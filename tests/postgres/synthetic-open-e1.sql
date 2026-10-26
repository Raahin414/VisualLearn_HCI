-- SYNTHETIC LOCAL FIXTURE ONLY. Applied by scripts/pg-harness.mjs to a
-- disposable loopback container so the real enrollment gate can be tested.
-- This is not consent wording, an approval or a recruitment setting.
update visuallearn.experiments set
 enabled=true, status='recruiting', content_approved=true, ethics_approved=true,
 protocol_version='SYNTHETIC-LOCAL-2.0.0-draft',
 consent_version='SYNTHETIC-LOCAL-CONSENT',
 consent_text='SYNTHETIC LOCAL TEST for name and ERP. Not an approved consent form. No human participant may use this database.',
 study_contact='SYNTHETIC TEST CONTACT. None.'
where id='E1';
