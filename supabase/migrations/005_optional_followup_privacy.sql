-- Optional mechanisms only. No approvals, grace period or retention default.
alter table visuallearn.experiments
 add column seven_day_enabled boolean not null default false,
 add column seven_day_reviewed boolean not null default false,
 add column seven_day_form_version text,
 add column seven_day_window_minutes integer check(seven_day_window_minutes between 1 and 1440),
 add column retention_approved boolean not null default false,
 add column retention_policy_version text,
 add column withdrawal_retention_days integer check(withdrawal_retention_days between 0 and 36500),
 add constraint seven_day_review_required check(not seven_day_enabled or
   (seven_day_reviewed and seven_day_form_version is not distinct from '1.0-seven-day-draft' and seven_day_window_minutes is not null)),
 add constraint retention_review_required check(not retention_approved or
   (retention_policy_version is not null and withdrawal_retention_days is not null));
alter table visuallearn.sessions
 add column seven_day_form_version text,
 add column seven_day_bank_sha256 text,
 add column seven_day_window_minutes integer check(seven_day_window_minutes between 1 and 1440),
 add constraint seven_day_snapshot_complete check(
   (seven_day_form_version is null and seven_day_bank_sha256 is null and seven_day_window_minutes is null) or
   (seven_day_form_version is not null and seven_day_bank_sha256 is not null and seven_day_window_minutes is not null));
alter table visuallearn.sessions drop constraint sessions_state_check;
alter table visuallearn.sessions add constraint sessions_state_check check(state in
 ('enrolled','lesson_active','lesson_complete','immediate_test_complete','waiting_60m','60m_test_complete','waiting_7d','7d_test_complete','finished','withdrawn'));
alter table visuallearn.survey_submissions drop constraint survey_submissions_form_key_check;
alter table visuallearn.survey_submissions add constraint survey_submissions_form_key_check check(form_key in ('F3','F5','F6'));

-- Aggregate allocation history has no participant/session identifiers. Its
-- retention remains a human policy decision; it never enters research exports.
create table visuallearn.deleted_allocation_counts (
 experiment_id text not null references visuallearn.experiments(id),
 age_band text not null check(age_band in ('9-12','13-17','18-30')),
 arm_key text not null, n bigint not null check(n>0),
 primary key(experiment_id,age_band,arm_key)
);
alter table visuallearn.deleted_allocation_counts enable row level security;
create policy backend_access on visuallearn.deleted_allocation_counts for all to visuallearn_backend using (true) with check (true);
grant select,insert,update,delete on visuallearn.deleted_allocation_counts to visuallearn_backend;
revoke all on visuallearn.deleted_allocation_counts from public;

create or replace function visuallearn.assign_once(p_participant uuid) returns uuid language plpgsql as $$
declare p visuallearn.participants; e visuallearn.experiments; existing uuid; chosen text; result uuid;
begin
 select * into p from visuallearn.participants where id=p_participant for update;
 if p.id is null or p.withdrawn_at is not null then raise exception 'Participant unavailable'; end if;
 select id into existing from visuallearn.assignments where participant_id=p_participant;
 if existing is not null then return existing; end if;
 select * into e from visuallearn.experiments where id=p.experiment_id;
 if e.id not in ('E1','E2','E3') or not e.enabled or
   (e.id='E2' and (not e.pilot_reviewed or e.pilot_contract_version is distinct from 'modality-v1-draft')) or
   (e.id='E3' and (not e.pilot_reviewed or e.pilot_contract_version is distinct from 'chunking-v1-draft' or e.study_time_policy is distinct from 'self-paced-no-minimum-v1')) then raise exception 'Experiment disabled'; end if;
 perform pg_advisory_xact_lock(hashtext(p.experiment_id||':'||p.age_band));
 select arm into chosen from unnest(e.arms) arm
 left join (select arm_key,sum(n) n from (
   select a.arm_key,count(*)::bigint n from visuallearn.assignments a join visuallearn.participants ap on ap.id=a.participant_id
    where a.experiment_id=p.experiment_id and ap.age_band=p.age_band group by a.arm_key
   union all select d.arm_key,d.n from visuallearn.deleted_allocation_counts d where d.experiment_id=p.experiment_id and d.age_band=p.age_band
 ) history group by arm_key) counts on counts.arm_key=arm
 order by coalesce(n,0),md5(gen_random_uuid()::text) limit 1;
 insert into visuallearn.assignments(participant_id,experiment_id,arm_key,randomization_version)
 values(p_participant,p.experiment_id,chosen,case when p.experiment_id='E1' then 'age-stratified-minimum-v1' when p.experiment_id='E2' then 'age-stratified-minimum-v2' else 'age-stratified-minimum-v3' end) returning id into result;
 return result;
end $$;
revoke all on function visuallearn.assign_once(uuid) from public;
grant execute on function visuallearn.assign_once(uuid) to visuallearn_backend;

-- Invoker privileges, no public/API access, no HTTP endpoint. An operator must
-- explicitly enable the process flag AND name an approved database policy.
create function visuallearn.purge_withdrawn(p_participant uuid, p_policy text, p_enabled boolean default false)
returns boolean language plpgsql as $$
declare p visuallearn.participants; e visuallearn.experiments; a visuallearn.assignments; sid uuid;
begin
 if p_enabled is not true then raise exception 'Physical deletion disabled'; end if;
 -- Same session-before-participant lock order as the participant service.
 perform 1 from visuallearn.sessions where participant_id=p_participant for update;
 select * into p from visuallearn.participants where id=p_participant for update;
 if p.id is null then return false; end if;
 select * into e from visuallearn.experiments where id=p.experiment_id for share;
 if not e.retention_approved or e.retention_policy_version is distinct from p_policy or
    e.withdrawal_retention_days is null then raise exception 'Approved retention policy required'; end if;
 if p.withdrawn_at is null or p.withdrawn_at + e.withdrawal_retention_days * interval '1 day' > now() then
   raise exception 'Withdrawal deletion is not eligible'; end if;
 perform pg_advisory_xact_lock(hashtext(p.experiment_id||':'||p.age_band));
 select * into a from visuallearn.assignments where participant_id=p_participant;
 if a.id is not null then
   insert into visuallearn.deleted_allocation_counts(experiment_id,age_band,arm_key,n)
   values(p.experiment_id,p.age_band,a.arm_key,1)
   on conflict(experiment_id,age_band,arm_key) do update set n=visuallearn.deleted_allocation_counts.n+1;
 end if;
 select id into sid from visuallearn.sessions where participant_id=p_participant;
 delete from visuallearn.rating_adjudications where attempt_id in (select id from visuallearn.assessment_attempts where session_id=sid);
 delete from visuallearn.free_recall_ratings where attempt_id in (select id from visuallearn.assessment_attempts where session_id=sid);
 delete from visuallearn.assessment_attempts where session_id=sid;
 delete from visuallearn.survey_submissions where session_id=sid;
 delete from visuallearn.scheduled_followups where session_id=sid;
 delete from visuallearn.return_tokens where session_id=sid;
 delete from visuallearn.events where session_id=sid;
 delete from visuallearn.request_limits where bucket in (
   encode(sha256(convert_to(sid::text||':read','UTF8')),'hex'),
   encode(sha256(convert_to(sid::text||':write','UTF8')),'hex'));
 delete from visuallearn.sessions where participant_id=p_participant;
 delete from visuallearn.assignments where participant_id=p_participant;
 delete from visuallearn.participants where id=p_participant;
 insert into visuallearn.audit_log(actor_hash,action) values('system','withdrawal:physical-deletion');
 return true;
end $$;
revoke all on function visuallearn.purge_withdrawn(uuid,text,boolean) from public;
grant execute on function visuallearn.purge_withdrawn(uuid,text,boolean) to visuallearn_backend;
-- Forward-only rollback: disable optional features, retain columns/counts/data.
-- Never enable deletion or remove rows as part of applying this migration.
