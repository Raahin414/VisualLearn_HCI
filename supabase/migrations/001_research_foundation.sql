-- Fresh-repository v2 schema. No legacy tables exist to migrate.
-- Research data is deliberately outside the PostgREST public schema.
create schema if not exists visuallearn;
revoke all on schema visuallearn from public;
do $$ begin
 if not exists(select 1 from pg_roles where rolname='visuallearn_backend') then create role visuallearn_backend nologin; end if;
end $$;
grant usage on schema visuallearn to visuallearn_backend;

create table visuallearn.experiments (
 id text primary key, name text not null, status text not null default 'draft' check(status in ('draft','approved','recruiting','closed','archived')),
 enabled boolean not null default false, protocol_version text not null, primary_outcome text not null,
 arms text[] not null, consent_version text, consent_text text, study_contact text,
 content_approved boolean not null default false, ethics_approved boolean not null default false,
 followup_window_minutes integer not null default 30 check(followup_window_minutes between 1 and 1440),
 created_at timestamptz not null default now(), check(not enabled or id='E1')
);
create table visuallearn.participants (
 id uuid primary key default gen_random_uuid(), public_code text not null unique, enrollment_key text unique,
 experiment_id text not null references visuallearn.experiments(id),
 age_band text not null check(age_band in ('9-12','13-17','18-30')), language text not null,
 consent_version text not null, consent_at timestamptz not null default now(),
 f0 jsonb not null, withdrawn_at timestamptz, created_at timestamptz not null default now()
);
create table visuallearn.assignments (
 id uuid primary key default gen_random_uuid(), participant_id uuid not null unique references visuallearn.participants(id),
 experiment_id text not null references visuallearn.experiments(id), arm_key text not null,
 randomization_version text not null default 'age-stratified-minimum-v1', assigned_at timestamptz not null default now()
);
create table visuallearn.sessions (
 id uuid primary key default gen_random_uuid(),participant_id uuid not null unique references visuallearn.participants(id),
 assignment_id uuid unique references visuallearn.assignments(id),
 state text not null default 'enrolled' check(state in ('enrolled','lesson_active','lesson_complete','immediate_test_complete','waiting_60m','60m_test_complete','finished','withdrawn')),
 content_version text not null,content_sha256 text not null,protocol_version text not null,stimulus_version text not null,
 media_manifest_sha256 text not null,question_bank_sha256 text not null,stimulus_sha256 text not null,
 followup_window_minutes integer not null check(followup_window_minutes between 1 and 1440),
 progress integer not null default 0 check(progress between 0 and 4), visited_segments integer[] not null default '{}',
 accommodations jsonb not null default '{}',started_at timestamptz not null default now(),lesson_completed_at timestamptz
);
create table visuallearn.assessment_attempts (
 id uuid primary key default gen_random_uuid(),session_id uuid not null references visuallearn.sessions(id),
 timepoint text not null check(timepoint in ('pre','immediate','plus_60m','plus_7d')),
 form_key text not null,form_version text not null,opened_at timestamptz not null default now(),submitted_at timestamptz,
 answers_json jsonb,free_recall text check(length(free_recall)<=6000),correct integer,max_score integer,
 scoring_version text not null default 'objective-v1',rubric_version text,
 unique(session_id,timepoint),check(correct is null or correct between 0 and max_score)
);
create table visuallearn.survey_submissions (
 id uuid primary key default gen_random_uuid(),session_id uuid not null references visuallearn.sessions(id),
 form_key text not null check(form_key in ('F3','F5')),form_version text not null,
 answers_json jsonb not null,submitted_at timestamptz not null default now(),unique(session_id,form_key)
);
create table visuallearn.scheduled_followups (
 id uuid primary key default gen_random_uuid(),session_id uuid not null references visuallearn.sessions(id),
 timepoint text not null check(timepoint in ('plus_60m','plus_7d')),due_at timestamptz not null,deadline_at timestamptz not null,
 status text not null default 'not_started' check(status in ('not_started','completed_in_window','completed_late','expired','withdrawn')),
 completed_at timestamptz,unique(session_id,timepoint),check(deadline_at>due_at)
);
create table visuallearn.return_tokens (
 token_hash text primary key,session_id uuid not null references visuallearn.sessions(id),expires_at timestamptz not null,revoked_at timestamptz
);
create table visuallearn.events (
 id uuid primary key default gen_random_uuid(),session_id uuid not null references visuallearn.sessions(id),
 client_event_id uuid not null,event_type text not null,segment_id text,elapsed_ms integer not null check(elapsed_ms>=0),
 client_time timestamptz not null,server_received_at timestamptz not null default now(),payload jsonb not null default '{}',unique(session_id,client_event_id)
);
create index events_session_time on visuallearn.events(session_id,server_received_at);
create index followups_due on visuallearn.scheduled_followups(status,due_at);
create table visuallearn.free_recall_ratings (
 id uuid primary key default gen_random_uuid(),attempt_id uuid not null references visuallearn.assessment_attempts(id),
 rater_code text not null,rubric_version text not null,sub_scores jsonb not null,total_score integer not null check(total_score between 0 and 10),
 rated_at timestamptz not null default now(),unique(attempt_id,rater_code,rubric_version)
);
create table visuallearn.audit_log (
 id uuid primary key default gen_random_uuid(),actor_hash text not null,action text not null,created_at timestamptz not null default now()
);
-- Persisted, pseudonymous session limiter. No IP addresses or fingerprints.
create table visuallearn.request_limits (bucket text primary key,window_at timestamptz not null,request_count integer not null);

do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='visuallearn' loop
  execute format('alter table visuallearn.%I enable row level security',t.tablename);
  execute format('create policy backend_access on visuallearn.%I for all to visuallearn_backend using (true) with check (true)',t.tablename);
 end loop;
end $$;
grant select,insert,update,delete on all tables in schema visuallearn to visuallearn_backend;
revoke all on all tables in schema visuallearn from public;

-- Serialized allocation within experiment x age band; existing assignment wins.
-- Withdrawn participants remain in allocation counts to prevent allocation shopping.
create function visuallearn.assign_once(p_participant uuid) returns uuid language plpgsql as $$
declare p visuallearn.participants; e visuallearn.experiments; existing uuid; chosen text; result uuid;
begin
 select * into p from visuallearn.participants where id=p_participant for update;
 if p.id is null or p.withdrawn_at is not null then raise exception 'Participant unavailable'; end if;
 select id into existing from visuallearn.assignments where participant_id=p_participant;
 if existing is not null then return existing; end if;
 select * into e from visuallearn.experiments where id=p.experiment_id;
 if e.id<>'E1' or not e.enabled then raise exception 'Experiment disabled'; end if;
 perform pg_advisory_xact_lock(hashtext(p.experiment_id||':'||p.age_band));
 select arm into chosen from unnest(e.arms) arm
 left join (select a.arm_key,count(*) n from visuallearn.assignments a join visuallearn.participants ap on ap.id=a.participant_id
 where a.experiment_id=p.experiment_id and ap.age_band=p.age_band group by a.arm_key) counts on counts.arm_key=arm
 order by coalesce(n,0),md5(gen_random_uuid()::text) limit 1;
 insert into visuallearn.assignments(participant_id,experiment_id,arm_key) values(p_participant,p.experiment_id,chosen) returning id into result;
 return result;
end $$;
revoke all on function visuallearn.assign_once(uuid) from public;
grant execute on function visuallearn.assign_once(uuid) to visuallearn_backend;
