-- Non-owner runtime login for the application server (run once per database
-- by an authorized administrator; set the password separately, never in Git):
--   alter role visuallearn_app with login password '<generated secret>';
-- It inherits only visuallearn_backend's table privileges. CREATE ROLE defaults
-- (NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS INHERIT) apply;
-- Supabase's non-superuser `postgres` cannot set those attributes explicitly.
-- scripts/verify-staging.mjs confirms them after provisioning.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='visuallearn_app') then
  create role visuallearn_app nologin;
 end if;
end $$;
grant visuallearn_backend to visuallearn_app;
revoke create on schema public from visuallearn_app;
alter role visuallearn_app set statement_timeout = '15s';
alter role visuallearn_app set idle_in_transaction_session_timeout = '30s';
