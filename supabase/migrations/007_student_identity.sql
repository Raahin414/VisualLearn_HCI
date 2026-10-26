-- Identifiers are kept apart from de-identified research exports.
create table visuallearn.participant_identity (
 participant_id uuid primary key references visuallearn.participants(id) on delete cascade,
 student_name text not null check(length(btrim(student_name)) between 2 and 120),
 erp text not null check(length(btrim(erp)) between 2 and 40),
 created_at timestamptz not null default now()
);
create index participant_identity_erp on visuallearn.participant_identity(erp);
alter table visuallearn.participant_identity enable row level security;
create policy backend_access on visuallearn.participant_identity for all to visuallearn_backend using (true) with check (true);
grant select,insert,update,delete on visuallearn.participant_identity to visuallearn_backend;
revoke all on visuallearn.participant_identity from public;
