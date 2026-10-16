# Privacy and research activation limits

Public demo stores only its chapter, visited chapters and density in localStorage. Demo practice answers go to an in-memory scoring operation and are not persisted. No analytics SDK or research telemetry runs in demo mode.

Consented study mode uses an HttpOnly signed cookie and opaque server session. Return secrets contain 32 random bytes; only their SHA-256 hashes persist. The browser places return tokens in URL fragments, strips the fragment before recovery and sends no referrers. Do not collect names, emails, exact birthdates, raw IP addresses, pointer trails or user-agent fingerprints.

Study events are allowlisted, bounded and deduplicated per session. The browser caps its retry queue at 200 events in per-participant sessionStorage, sends at five-second intervals and attempts a flush on visibility/page exit. Abrupt termination can lose unsent events. Background transmission is best-effort; no inference of inattention from missing events is permitted. Active-time reconstruction needs further validation.

Withdrawal marks the participant, closes the session and follow-ups, revokes return tokens and excludes records from exports. Physical deletion and backup expiry depend on the approved consent/retention policy and remain unresolved. No invented retention period or institutional contact is shown.

Administrator authentication uses Supabase-verified accounts and a server UUID allowlist. Existing implementation needs staged authentication and access testing, MFA workflow completion and institutional review before sensitive use. Backend database credentials never go to browsers. Access logs at the deployment provider are separate infrastructure and need operational retention configuration.
