-- E1 only. This seed never enables recruitment or supplies approvals.
insert into visuallearn.experiments(id,name,protocol_version,primary_outcome,arms)
values ('E1','Visual density','2.1.0-e1-draft','Adjusted immediate percentage correct',array['low','medium','high'])
on conflict(id) do nothing;
