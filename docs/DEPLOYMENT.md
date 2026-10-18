# Deployment and operations

**Status (2026-10-18):** nothing is deployed and no hosted Supabase project exists. Every step below was rehearsed against the real Supabase stack running locally (`npm run test:connected`), which is not the same as a hosted project. Real enrollment stays disabled throughout staging.

## 1. Local rehearsal (no accounts needed)

Requires Docker and Node 24. `npm run test:pg` runs the migration CLI and concurrency tests against a disposable PostgreSQL 17 container. `npm run test:connected` starts local Supabase (Postgres, Auth/GoTrue, PostgREST, Kong) with `supabase/config.toml`, resets it, migrates with `npm run db:migrate`, runs the staging verifier, creates SYNTHETIC researcher accounts and drives the app in Chromium. Set `SUPABASE_CLI` to a local CLI binary or let it use `npx supabase@2`. The local stack uses Supabase's public development keys; nothing in it is a secret or a hosted credential.

## 2. Hosted staging (separate Supabase project, SYNTHETIC data only)

1. Create a **new** Supabase project named for staging (for example `visuallearn-staging`). Never reuse it for production research. Record the region and the institution's data-location requirement.
2. Auth settings (dashboard → Authentication): disable public sign-ups and anonymous sign-ins; keep the email provider on for password sign-in; enable **TOTP MFA** (enroll + verify); JWT expiry ≤ 3600 s; minimum password length ≥ 12.
3. Keep the `visuallearn` and `visuallearn_ops` schemas **out** of Data API → Exposed schemas (defaults are `public`, `graphql_public`).
4. Migrate with the project's `postgres` connection string, from a trusted machine:
   `DATABASE_URL='<postgres connection>' npm run db:migrate`
   It creates the private schemas, RLS, the backend group and eight **disabled draft** experiments. Do not run the SYNTHETIC open-E1 fixture (`tests/postgres/synthetic-open-e1.sql`) against any hosted project.
5. Runtime login: run `supabase/roles/runtime_role.sql` in the SQL editor, then `alter role visuallearn_app with login password '<generated 32+ byte secret>'`. The app's `DATABASE_URL` uses `visuallearn_app` (direct or session-pooler connection with TLS), never `postgres`.
6. Researcher accounts: create each researcher in Authentication → Users (invite or create with a strong password). Copy their user UUIDs into `ADMIN_ALLOWLIST`. Each researcher enrolls an authenticator at first sign-in; the app refuses the dashboard without aal2.
7. Secrets: store `DATABASE_URL`, `SESSION_SECRET` (32+ random bytes), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ADMIN_ALLOWLIST` and `APP_BASE_URL` in the hosting provider's encrypted environment settings and in an ignored `.env.staging.local` for verification. Never commit populated files. The service-role key is not used by the app; do not configure it in the host.
8. Verify: copy `.env.staging.example` to `.env.staging.local`, fill it, and run `npm run verify:staging`. All checks must pass, including "Real enrollment closed". Save the output in `docs/QA.md`.

## 3. Hosting (after staging verification passes)

Any Node.js host that runs `next build`/`next start` behind HTTPS works; the choice of provider is a project decision not yet made. Requirements:

- HTTPS only; `APP_BASE_URL` equals the exact public origin (mutations fail closed otherwise). Cookies are `Secure` in production.
- Environment variables from step 2.7 with `STUDY_ENABLED=false`. `NODE_ENV=production` forces researcher MFA and disables `/dev/study` (it must return 404; `npm run test:e2e:production` checks this locally).
- Request logging must not record bodies, cookies, query strings or URL fragments. Return links carry the token in the fragment, which browsers do not send.
- Deploy staging first and repeat the full workflow there with SYNTHETIC participants: two concurrent enrollments, refresh, return link in a new browser, duplicate submission, early/expired follow-up (wait the real hour, or use a separate staging-only database copy for time shifts), researcher MFA sign-in/out, every export, withdrawal.
- A successful deployment does not open recruitment.

## 4. Backups, restoration and rollback

- Enable the provider's automated backups (Supabase daily backups; PITR if the plan allows). Test a **restore into a separate project** before any participant data exists, then rerun `npm run verify:staging` against the restored copy. Record the date and result.
- Close enrollment immediately with `STUDY_ENABLED=false` and E1 `status='closed'`. Existing participants can finish saved sessions.
- Roll back the application to the last compatible commit; keep the database. Migrations are forward-only and never dropped to roll back code. Restore an encrypted backup into a separate database if recovery is needed.

## 5. Known limitations

Runtime authorization supplies participant ownership; the backend role can read all research rows and must stay server-only. Exports exclude withdrawn participants and use consistent hashed join keys; written responses still need disclosure review. Physical deletion awaits the approved retention policy. The public enrollment/recovery limiter is one shared bucket (60 requests per minute across all visitors); review it before any large recruitment. Rate-limit rows should be pruned periodically. Development-only lint dependencies may carry transitive advisories; recheck `npm audit` before deployment.
