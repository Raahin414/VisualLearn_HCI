-- Five-course density study. These tables are private and inactive until approved.
create table visuallearn.course_study_settings (
 id boolean primary key default true check(id),
 enabled boolean not null default false,
 content_approved boolean not null default false,
 ethics_approved boolean not null default false,
 consent_version text,
 consent_text text,
 study_contact text
);
insert into visuallearn.course_study_settings(id) values(true);
create table visuallearn.course_student_identity (
 id uuid primary key default gen_random_uuid(),
 student_name text not null check(length(btrim(student_name)) between 2 and 120),
 erp text not null check(length(btrim(erp)) between 2 and 40),
 created_at timestamptz not null default now()
);
create table visuallearn.course_attempts (
 id uuid primary key default gen_random_uuid(),
 identity_id uuid not null references visuallearn.course_student_identity(id),
 course_slug text not null check(course_slug in ('water-cycle','photosynthesis','electric-circuits','human-digestion','solar-system')),
 density text not null check(density in ('low','medium','high')),
 access_hash text not null unique,
 content_version text not null,
 consent_version text not null,
 consent_at timestamptz not null default now(),
 adult_attested boolean not null check(adult_attested),
 voluntary_accepted boolean not null check(voluntary_accepted),
 data_use_accepted boolean not null check(data_use_accepted),
 started_at timestamptz not null default now(),
 submitted_at timestamptz,
 answers jsonb,
 score integer check(score between 0 and 4),
 withdrawn_at timestamptz,
 check((submitted_at is null and answers is null and score is null) or
       (submitted_at is not null and answers is not null and score is not null))
);
create index course_attempts_course_density on visuallearn.course_attempts(course_slug,density);
create index course_student_identity_erp on visuallearn.course_student_identity(erp);
do $$ declare t text; begin
 foreach t in array array['course_study_settings','course_student_identity','course_attempts'] loop
  execute format('alter table visuallearn.%I enable row level security',t);
  execute format('create policy backend_access on visuallearn.%I for all to visuallearn_backend using (true) with check (true)',t);
  execute format('grant select,insert,update,delete on visuallearn.%I to visuallearn_backend',t);
  execute format('revoke all on visuallearn.%I from public',t);
 end loop;
end $$;
-- Approval settings are owner-operated; the application may only read them.
revoke insert,update,delete on visuallearn.course_study_settings from visuallearn_backend;
