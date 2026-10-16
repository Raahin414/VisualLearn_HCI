# Privacy and research activation limits

The public lesson stores its chapter, visited chapters and density in localStorage. Unsent objective/recall drafts use tab-scoped sessionStorage and are removed after successful submission. This is browser recovery, not database autosave; closing the tab can lose unsent work. Practice answers go to a scoring operation that does not persist them. No analytics SDK or research telemetry runs in the public demo.

The `/dev/study` development-only fixture uses a separate SYNTHETIC localStorage namespace for one simulated session and never sends research API requests. Reset clears the fixture; a fresh synthetic ID isolates any remaining tab draft keys. Do not enter identifying data into development tools. Production returns 404 for this route.

Consented study mode uses an HttpOnly signed cookie and opaque server session. Return secrets contain 32 random bytes; only their SHA-256 hashes persist. The browser places return tokens in URL fragments, strips the fragment before recovery and sends no referrers. Do not collect names, emails, exact birthdates, raw IP addresses, pointer trails or user-agent fingerprints.

Study events are allowlisted, bounded and deduplicated per session. The browser caps its retry queue at 200 events in per-participant sessionStorage, sends at five-second intervals and attempts a flush on visibility/page exit. Abrupt termination can lose unsent events. Background transmission is best-effort; no inference of inattention from missing events is permitted. Active-time reconstruction needs further validation.

Withdrawal marks the participant, closes the session and follow-ups, revokes return tokens and excludes records from exports. Physical deletion and backup expiry depend on the approved consent/retention policy and remain unresolved. No invented retention period or institutional contact is shown.

Administrator authentication uses Supabase-verified accounts and a server UUID allowlist. Existing implementation needs staged authentication and access testing, MFA workflow completion and institutional review before sensitive use. Backend database credentials never go to browsers. Access logs at the deployment provider are separate infrastructure and need operational retention configuration.
