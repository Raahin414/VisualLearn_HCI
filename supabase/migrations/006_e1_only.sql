-- Narrow active scope without deleting historical participant/session records.
update visuallearn.experiments set enabled=false,status='archived',seven_day_enabled=false where id <> 'E1';
alter table visuallearn.experiments drop constraint experiments_enabled_supported;
alter table visuallearn.experiments add constraint experiments_enabled_supported check(not enabled or id='E1');
alter table visuallearn.experiments add constraint e1_only_recruiting check(status <> 'recruiting' or id='E1');
alter table visuallearn.experiments add constraint e1_arms_fixed check(id <> 'E1' or arms = array['low','medium','high']);
-- Do not rewrite historical session hashes, approvals, protocol versions or answers.
create or replace function visuallearn.assign_once(p_participant uuid) returns uuid language plpgsql as $$
declare p visuallearn.participants; e visuallearn.experiments; existing uuid; chosen text; result uuid;
begin
 select * into p from visuallearn.participants where id=p_participant for update;
 if p.id is null or p.withdrawn_at is not null then raise exception 'Participant unavailable'; end if;
 select id into existing from visuallearn.assignments where participant_id=p_participant;
 if existing is not null then return existing; end if;
 select * into e from visuallearn.experiments where id=p.experiment_id;
 if e.id <> 'E1' or not e.enabled then raise exception 'Only the E1 visual-density study is supported'; end if;
 perform pg_advisory_xact_lock(hashtext(p.experiment_id||':'||p.age_band));
 select arm into chosen from unnest(e.arms) arm
 left join (select arm_key,sum(n) n from (
   select a.arm_key,count(*)::bigint n from visuallearn.assignments a join visuallearn.participants ap on ap.id=a.participant_id
    where a.experiment_id=p.experiment_id and ap.age_band=p.age_band group by a.arm_key
   union all select d.arm_key,d.n from visuallearn.deleted_allocation_counts d where d.experiment_id=p.experiment_id and d.age_band=p.age_band
 ) history group by arm_key) counts on counts.arm_key=arm
 order by coalesce(n,0),md5(gen_random_uuid()::text) limit 1;
 insert into visuallearn.assignments(participant_id,experiment_id,arm_key,randomization_version)
 values(p_participant,p.experiment_id,chosen,'age-stratified-minimum-v1') returning id into result;
 return result;
end $$;
revoke all on function visuallearn.assign_once(uuid) from public;
grant execute on function visuallearn.assign_once(uuid) to visuallearn_backend;


-- Rollback uses forward fixes; archived rows and historical schema remain intact.
