-- E3 remains draft/disabled; no review, consent or stored stimulus is rewritten.
alter table visuallearn.experiments add column study_time_policy text;
alter table visuallearn.experiments drop constraint experiments_enabled_supported;
alter table visuallearn.experiments add constraint experiments_enabled_supported check(not enabled or id in ('E1','E2','E3'));
alter table visuallearn.experiments add constraint chunking_arms_fixed check(id <> 'E3' or arms = array['chunked','grouped','all-at-once']);
alter table visuallearn.experiments add constraint chunking_pilot_required check(id <> 'E3' or not enabled or (pilot_reviewed and pilot_contract_version is not distinct from 'chunking-v1-draft' and study_time_policy is not distinct from 'self-paced-no-minimum-v1'));
alter table visuallearn.sessions add column active_time_ms bigint not null default 0 check(active_time_ms>=0);
alter table visuallearn.sessions add column presentation_exposures integer not null default 0 check(presentation_exposures>=0);
alter table visuallearn.sessions add column exposure_measure_version text;
alter table visuallearn.sessions add column study_time_policy text;
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
 left join (select a.arm_key,count(*) n from visuallearn.assignments a join visuallearn.participants ap on ap.id=a.participant_id
 where a.experiment_id=p.experiment_id and ap.age_band=p.age_band group by a.arm_key) counts on counts.arm_key=arm
 order by coalesce(n,0),md5(gen_random_uuid()::text) limit 1;
 insert into visuallearn.assignments(participant_id,experiment_id,arm_key,randomization_version)
 values(p_participant,p.experiment_id,chosen,case when p.experiment_id='E1' then 'age-stratified-minimum-v1' when p.experiment_id='E2' then 'age-stratified-minimum-v2' else 'age-stratified-minimum-v3' end) returning id into result;
 return result;
end $$;
revoke all on function visuallearn.assign_once(uuid) from public;
grant execute on function visuallearn.assign_once(uuid) to visuallearn_backend;
-- Rollback: disable E3 and roll back compatible application code; retain all
-- counters, rows and the private migration ledger. No destructive down migration.
