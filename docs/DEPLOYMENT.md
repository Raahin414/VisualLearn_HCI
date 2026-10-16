# Deployment and operations

The app has not been deployed. Public demo needs a Node.js Next.js host; research additionally needs PostgreSQL and Supabase Auth. Use HTTPS and the correct APP_BASE_URL; cookies are Secure in production. Do not enable enrollment during setup.

1. Create an authorized staging Supabase project. Keep staging separate from production. Install dependencies with `npm ci`.
2. Configure ignored local/deployment environment values from `.env.example`; generate a random SESSION_SECRET of at least 32 bytes. Never expose it or DATABASE_URL to client components.
3. Run `npm run db:migrate` using an authorized migration role. It creates `visuallearn`, a nologin backend group, RLS policies and disabled registry seeds. Actual hosted migration execution is pending credentials. If managed permissions prohibit role creation, adapt grants in a reviewed follow-up migration; never disable RLS as a workaround.
4. Provision a non-owner runtime login, grant `visuallearn_backend` membership, and switch DATABASE_URL to that login. Restrict database connectivity. Confirm that Supabase anon/authenticated roles cannot read the private schema. Do not add `visuallearn` to exposed API schemas.
5. Configure Supabase Auth users and ADMIN_ALLOWLIST using user UUIDs. The server checks bearer tokens at Supabase `/auth/v1/user` on each admin request. Admin sessions expire within an hour. MFA challenge UX is not implemented; require and test an institution-approved access setup before sensitive use.
6. Run lint, types, unit/integration, E2E, content verification and production build. Exercise synthetic connected participants, multi-client allocation, reconnect, delayed test windows, exports and withdrawal. Label every test participant SYNTHETIC outside the production study.
7. Approve and freeze lesson/media/question hashes, protocol and instruments, withdrawal/retention policy, study contact and consent. Enrollment requires both STUDY_ENABLED and explicit approved database metadata. Minors and E2–E8 stay unavailable.
8. Deploy staging with HTTPS. Back up the database and verify restore. Avoid logging request bodies, cookies, return tokens or query parameters. Return links use fragments and referrers are disabled. Do not promise email/SMS reminders.

## Rollback

Close enrollment immediately with STUDY_ENABLED=false and E1 status closed. Existing participants can finish saved sessions; new enrollment cannot proceed. Roll back the application to the last compatible commit and preserve the database. Never drop research tables to roll back a code deploy. Restore an encrypted backup to a separate database if recovery is needed. A destructive down migration is intentionally not supplied.

## Collection limitations

Runtime app authorization supplies participant ownership; the private schema is inaccessible to public roles. The backend role can access all research rows and must remain server-only. Exports exclude withdrawn participants and replace join IDs consistently; free text still requires disclosure review. Withdrawal currently marks records and revokes access; final deletion requires the approved retention policy. Rate-limit buckets should be pruned periodically after operational policy review.

Npm audit currently reports transitive development-only glob/braces advisories in eslint-config-next, with no compatible patched braces release available from the registry during this run. Production dependency audit is separate. Avoid executing lint with untrusted arbitrary glob patterns and recheck advisories before deployment. Do not force-downgrade Next.js to silence an unrelated development advisory.
