-- Additive E2 support. No existing research rows are deleted or reinterpreted.
alter table visuallearn.experiments add column pilot_contract_version text;
alter table visuallearn.experiments add column pilot_reviewed boolean not null default false;
alter table visuallearn.experiments drop constraint experiments_check;
alter table visuallearn.experiments add constraint experiments_enabled_supported check(not enabled or id in ('E1','E2'));
alter table visuallearn.experiments add constraint modality_arms_fixed check(id <> 'E2' or arms = array['text-only','audio-only','text-diagram','audio-diagram']);
alter table visuallearn.experiments add constraint modality_pilot_required check(id <> 'E2' or not enabled or (pilot_reviewed and pilot_contract_version is not distinct from 'modality-v1-draft'));

alter table visuallearn.sessions add column experiment_id text;
update visuallearn.sessions s set experiment_id=p.experiment_id from visuallearn.participants p where p.id=s.participant_id;
alter table visuallearn.sessions alter column experiment_id set not null;
alter table visuallearn.sessions alter column experiment_id set default 'E1';
alter table visuallearn.sessions add column presentation_version text;
update visuallearn.sessions set presentation_version=stimulus_version;
alter table visuallearn.sessions alter column presentation_version set not null;
alter table visuallearn.sessions alter column presentation_version set default 'density-v4-draft';
-- Null for legacy rows: do not invent exposure timestamps.
alter table visuallearn.sessions add column lesson_opened_at timestamptz;
alter table visuallearn.participants add constraint participant_study_identity unique(id,experiment_id);
alter table visuallearn.assignments add constraint assignment_study_identity unique(id,participant_id,experiment_id);
alter table visuallearn.assignments add constraint assignment_participant_study foreign key(participant_id,experiment_id) references visuallearn.participants(id,experiment_id);
alter table visuallearn.sessions add constraint session_participant_study foreign key(participant_id,experiment_id) references visuallearn.participants(id,experiment_id);
alter table visuallearn.sessions add constraint session_assignment_study foreign key(assignment_id,participant_id,experiment_id) references visuallearn.assignments(id,participant_id,experiment_id);

create or replace function visuallearn.assign_once(p_participant uuid) returns uuid language plpgsql as $$
declare p visuallearn.participants; e visuallearn.experiments; existing uuid; chosen text; result uuid;
begin
 select * into p from visuallearn.participants where id=p_participant for update;
 if p.id is null or p.withdrawn_at is not null then raise exception 'Participant unavailable'; end if;
 select id into existing from visuallearn.assignments where participant_id=p_participant;
 if existing is not null then return existing; end if;
 select * into e from visuallearn.experiments where id=p.experiment_id;
 if e.id not in ('E1','E2') or not e.enabled or
   (e.id='E2' and (not e.pilot_reviewed or e.pilot_contract_version is distinct from 'modality-v1-draft')) then raise exception 'Experiment disabled'; end if;
 perform pg_advisory_xact_lock(hashtext(p.experiment_id||':'||p.age_band));
 select arm into chosen from unnest(e.arms) arm
 left join (select a.arm_key,count(*) n from visuallearn.assignments a join visuallearn.participants ap on ap.id=a.participant_id
 where a.experiment_id=p.experiment_id and ap.age_band=p.age_band group by a.arm_key) counts on counts.arm_key=arm
 order by coalesce(n,0),md5(gen_random_uuid()::text) limit 1;
 insert into visuallearn.assignments(participant_id,experiment_id,arm_key,randomization_version)
 values(p_participant,p.experiment_id,chosen,case when p.experiment_id='E1' then 'age-stratified-minimum-v1' else 'age-stratified-minimum-v2' end) returning id into result;
 return result;
end $$;
revoke all on function visuallearn.assign_once(uuid) from public;
grant execute on function visuallearn.assign_once(uuid) to visuallearn_backend;
-- Rollback policy: disable E2, roll back compatible application code; retain
-- columns/rows and ledger. Never drop E2 data to roll back a deployment.
