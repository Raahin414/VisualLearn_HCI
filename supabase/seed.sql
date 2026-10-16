-- Only draft configurations. No participant, answer, event or result fixtures.
insert into visuallearn.experiments(id,name,protocol_version,primary_outcome,arms) values
 ('E1','Visual density','2.0.0-draft','Adjusted immediate percentage correct',array['low','medium','high']),
 ('E2','Multimedia modality','2.0.0-draft','Pending registration',array['text-only','audio-only','text-diagram','audio-diagram']),
 ('E3','Information chunking','2.0.0-draft','Pending registration',array['chunked','grouped','all-at-once']),
 ('E4','Animation','2.0.0-draft','Pending registration',array['static','step-through','animated']),
 ('E5','Color and hierarchy','2.0.0-draft','Pending registration',array['neutral','semantic','saturated']),
 ('E6','Interactivity','2.0.0-draft','Pending registration',array['passive','guided','manipulable']),
 ('E7','Video delivery','2.0.0-draft','Pending registration',array['video','diagram-sequence','interactive']),
 ('E8','Adaptive delivery','2.0.0-draft','Pending registration',array['fixed','rules-based'])
on conflict(id) do nothing;
