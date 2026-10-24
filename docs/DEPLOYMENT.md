# Deployment and operations

**Status (2026-10-18):** hosted **staging exists**: Supabase project `visuallearn-staging` (ref `tyoplurznjqdngacvfke`, organization IAT, region ap-south-1). Steps 2.1–2.6 and 2.8 below are done and `npm run verify:staging` passes 19/19. Auth settings are versioned in `staging/supabase/config.toml` and applied with `supabase config push --workdir staging --project-ref tyoplurznjqdngacvfke`. **Hosted app (2026-10-24):** Vercel project `visuallearn-staging` (team `trs20`, Hobby), region `bom1` (Mumbai, next to the database), production URL https://visuallearn-staging.vercel.app, deployed from a trusted checkout with `vercel deploy --prod` (the repository is not Git-connected). Real enrollment is disabled.

## 1. Local rehearsal (no accounts needed)

On Windows PowerShell use `npm.cmd` when script execution policy blocks `npm.ps1`. The installed CLI entrypoints are launched directly by the harnesses. PostgreSQL defaults to loopback port 15439; set `VISUALLEARN_PG_PORT` if that port is unavailable. Use Node 24/npm 11; the browser suites use one worker for reliable cold compilation on slower local disks. Do not run staging/dev/build servers concurrently against the same `.next` directory.

Requires Docker and Node 24. `npm run test:pg` runs the migration CLI and concurrency tests against a disposable PostgreSQL 17 container. `npm run test:connected` starts local Supabase (Postgres, Auth/GoTrue, PostgREST, Kong) with `supabase/config.toml`, resets it, migrates with `npm run db:migrate`, runs the staging verifier, creates SYNTHETIC researcher accounts and drives the app in Chromium. Set `SUPABASE_CLI` to a local CLI binary or let it use `npx supabase@2`. The local stack uses Supabase's public development keys; nothing in it is a secret or a hosted credential.

## 2. Hosted staging (separate Supabase project, SYNTHETIC data only)

1. Create a **new** Supabase project named for staging (for example `visuallearn-staging`). Never reuse it for production research. Record the region and the institution's data-location requirement.
2. Auth settings (dashboard → Authentication): disable public sign-ups and anonymous sign-ins; keep the email provider on for password sign-in; enable **TOTP MFA** (enroll + verify); JWT expiry ≤ 3600 s; minimum password length ≥ 12.
3. Keep the `visuallearn` and `visuallearn_ops` schemas **out** of Data API → Exposed schemas (defaults are `public`, `graphql_public`).
4. Migrate with the project's `postgres` connection string, from a trusted machine:
   `DATABASE_URL='<postgres connection>' npm run db:migrate`
   It creates the private schemas, RLS, the backend group and eight **disabled draft** experiments. Do not run the SYNTHETIC open-E1 fixture (`tests/postgres/synthetic-open-e1.sql`) against any hosted project.
5. Runtime login: run `supabase/roles/runtime_role.sql` in the SQL editor, then `alter role visuallearn_app with login password '<generated 32+ byte secret>'`. The app's `DATABASE_URL` uses `visuallearn_app` (direct or session-pooler connection with TLS), never `postgres`.
6. Researcher accounts: invite each researcher (Authentication → Users, or the Auth admin `invite` endpoint with `redirect_to=<app>/admin/accept`). Copy their user UUIDs into `ADMIN_ALLOWLIST`. The invite link opens `/admin/accept`, where the researcher sets a password and then must enroll an authenticator; the app refuses the dashboard without aal2. "Forgot password?" on `/admin` sends a recovery link to the same page; researchers with MFA must enter a code before the password changes. Links now return to the hosted app (https://visuallearn-staging.vercel.app/admin/accept); the per-person `npm run dev:staging` logins used before hosting are revoked. Supabase's built-in mailer sends only a few emails per hour; configure custom SMTP before inviting many people.
7. Secrets: store `DATABASE_URL`, `SESSION_SECRET` (32+ random bytes), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ADMIN_ALLOWLIST` and `APP_BASE_URL` in the hosting provider's encrypted environment settings and in an ignored `.env.staging.local` for verification. Never commit populated files. The service-role key is not used by the app; do not configure it in the host.
8. Verify: copy `.env.staging.example` to `.env.staging.local`, fill it, and run `npm run verify:staging`. All checks must pass, including "Real enrollment closed". Save the output in `docs/QA.md`.

## 3. Hosting (after staging verification passes)

Chosen host: Vercel (`vercel.json` pins `bom1`; `.vercelignore` keeps env files, tests, analysis and screenshots out of uploads; `package.json` engines pin Node 24). Production environment: `DATABASE_URL` (restricted `visuallearn_app` session-pooler login, sensitive), `SUPABASE_URL`, `SUPABASE_ANON_KEY` (sensitive), `ADMIN_ALLOWLIST`, `SESSION_SECRET` (new, sensitive), `APP_BASE_URL=https://visuallearn-staging.vercel.app`, `STUDY_ENABLED=false`, `PHYSICAL_DELETION_ENABLED=false`; no service-role key. Per-deployment URLs stay behind Vercel Authentication; only the production alias is public. For researcher links without the built-in mailer, the Auth admin `generate_link` endpoint (invite or recovery, `redirect_to=<app>/admin/accept`) returns the link directly; deliver it privately with link previews off, because scanners consume one-time links. Requirements:

- After deploying, set `site_url` and `additional_redirect_urls` in `staging/supabase/config.toml` to the HTTPS origin (`…/admin/accept`) and push them.
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
