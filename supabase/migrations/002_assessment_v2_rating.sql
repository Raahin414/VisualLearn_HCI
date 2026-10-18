-- Assessment v2: ordering/labeling item scores, written scenario responses,
-- blind written-response ratings by kind and documented adjudication.
-- Forward-only. No participant rows are created or rewritten.
alter table visuallearn.assessment_attempts
 add column scenario_response text check(length(scenario_response)<=3000),
 add column item_scores jsonb;

alter table visuallearn.free_recall_ratings
 add column response_kind text not null default 'free_recall' check(response_kind in ('free_recall','scenario'));
do $$ declare c text; begin
 select conname into c from pg_constraint
 where conrelid='visuallearn.free_recall_ratings'::regclass and contype='u';
 if c is not null then execute format('alter table visuallearn.free_recall_ratings drop constraint %I',c); end if;
end $$;
alter table visuallearn.free_recall_ratings
 add constraint free_recall_ratings_one_per_rater unique(attempt_id,response_kind,rater_code,rubric_version),
 add constraint free_recall_ratings_kind_range check(response_kind='free_recall' or total_score<=4);

create table visuallearn.rating_adjudications (
 id uuid primary key default gen_random_uuid(),
 attempt_id uuid not null references visuallearn.assessment_attempts(id),
 response_kind text not null check(response_kind in ('free_recall','scenario')),
 rubric_version text not null, adjudicator_code text not null, sub_scores jsonb not null,
 total_score integer not null check(total_score between 0 and 10 and (response_kind='free_recall' or total_score<=4)),
 note text check(length(note)<=1000), resolved_at timestamptz not null default now(),
 unique(attempt_id,response_kind,rubric_version)
);
alter table visuallearn.rating_adjudications enable row level security;
create policy backend_access on visuallearn.rating_adjudications for all to visuallearn_backend using (true) with check (true);
grant select,insert,update,delete on visuallearn.rating_adjudications to visuallearn_backend;
revoke all on visuallearn.rating_adjudications from public;
