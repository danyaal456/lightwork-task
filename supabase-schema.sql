-- Items table (objectives, key results, tasks)
create table items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('objective', 'key_result', 'task')),
  title text not null,
  description text,
  parent_id uuid references items(id) on delete cascade,
  team text check (team in ('engineering', 'product', 'commercial', 'operations')),
  status text not null default 'not_started' check (status in ('not_started', 'on_track', 'at_risk', 'missed', 'done')),
  deadline_type text not null check (deadline_type in ('date', 'month', 'quarter')),
  deadline_value date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Owners (many per item)
create table item_owners (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade,
  owner_name text not null
);

-- Notes (threaded comment log)
create table notes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Links (labeled URLs per item)
create table links (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger items_updated_at before update on items
  for each row execute function update_updated_at();

-- Seed data: fictitious LightWork AI goals
insert into items (id, type, title, team, status, deadline_type, deadline_value) values
  ('a1000000-0000-0000-0000-000000000001', 'objective', 'Grow Commercial Pipeline Q2', 'commercial', 'on_track', 'quarter', '2026-06-30'),
  ('a1000000-0000-0000-0000-000000000002', 'objective', 'Ship Core Product v2', 'engineering', 'on_track', 'quarter', '2026-06-30'),
  ('a1000000-0000-0000-0000-000000000003', 'objective', 'Build Operations Foundation', 'operations', 'not_started', 'quarter', '2026-06-30');

insert into items (id, type, title, parent_id, team, status, deadline_type, deadline_value) values
  ('b1000000-0000-0000-0000-000000000001', 'key_result', 'Close 3 pilot clients', 'a1000000-0000-0000-0000-000000000001', 'commercial', 'on_track', 'month', '2026-04-30'),
  ('b1000000-0000-0000-0000-000000000002', 'key_result', 'Expand to 2 new verticals', 'a1000000-0000-0000-0000-000000000001', 'commercial', 'not_started', 'month', '2026-05-31'),
  ('b1000000-0000-0000-0000-000000000003', 'key_result', 'Ship tenant integration v2', 'a1000000-0000-0000-0000-000000000002', 'engineering', 'on_track', 'month', '2026-04-14'),
  ('b1000000-0000-0000-0000-000000000004', 'key_result', 'Reduce bug backlog by 60%', 'a1000000-0000-0000-0000-000000000002', 'engineering', 'at_risk', 'month', '2026-03-31'),
  ('b1000000-0000-0000-0000-000000000005', 'key_result', 'Hire 2 senior engineers', 'a1000000-0000-0000-0000-000000000003', 'operations', 'not_started', 'month', '2026-04-30');

insert into items (id, type, title, parent_id, team, status, deadline_type, deadline_value) values
  ('c1000000-0000-0000-0000-000000000001', 'task', 'Close pilot with Greenfield', 'b1000000-0000-0000-0000-000000000001', 'commercial', 'on_track', 'date', '2026-03-31'),
  ('c1000000-0000-0000-0000-000000000002', 'task', 'Close pilot with Harlow Group', 'b1000000-0000-0000-0000-000000000001', 'commercial', 'not_started', 'date', '2026-04-14'),
  ('c1000000-0000-0000-0000-000000000003', 'task', 'Close pilot with Meridian PM', 'b1000000-0000-0000-0000-000000000001', 'commercial', 'not_started', 'date', '2026-04-28'),
  ('c1000000-0000-0000-0000-000000000004', 'task', 'Ship property integration API', 'b1000000-0000-0000-0000-000000000003', 'engineering', 'on_track', 'date', '2026-04-07'),
  ('c1000000-0000-0000-0000-000000000005', 'task', 'Complete end-to-end QA pass', 'b1000000-0000-0000-0000-000000000003', 'engineering', 'not_started', 'date', '2026-04-10'),
  ('c1000000-0000-0000-0000-000000000006', 'task', 'Resolve top 20 critical bugs', 'b1000000-0000-0000-0000-000000000004', 'engineering', 'at_risk', 'date', '2026-03-29'),
  ('c1000000-0000-0000-0000-000000000007', 'task', 'Post senior engineer JDs', 'b1000000-0000-0000-0000-000000000005', 'operations', 'not_started', 'date', '2026-03-28'),
  ('c1000000-0000-0000-0000-000000000008', 'task', 'Draft partnership proposal deck', 'b1000000-0000-0000-0000-000000000002', 'commercial', 'not_started', 'date', '2026-04-05');

-- Owners
insert into item_owners (item_id, owner_name) values
  ('a1000000-0000-0000-0000-000000000001', 'James'),
  ('a1000000-0000-0000-0000-000000000002', 'Sarah'),
  ('a1000000-0000-0000-0000-000000000003', 'Maya'),
  ('b1000000-0000-0000-0000-000000000001', 'James'),
  ('b1000000-0000-0000-0000-000000000002', 'James'),
  ('b1000000-0000-0000-0000-000000000003', 'Sarah'),
  ('b1000000-0000-0000-0000-000000000004', 'Tom'),
  ('b1000000-0000-0000-0000-000000000005', 'Maya'),
  ('c1000000-0000-0000-0000-000000000001', 'James'),
  ('c1000000-0000-0000-0000-000000000002', 'James'),
  ('c1000000-0000-0000-0000-000000000003', 'James'),
  ('c1000000-0000-0000-0000-000000000004', 'Sarah'),
  ('c1000000-0000-0000-0000-000000000004', 'Tom'),
  ('c1000000-0000-0000-0000-000000000005', 'Tom'),
  ('c1000000-0000-0000-0000-000000000006', 'Tom'),
  ('c1000000-0000-0000-0000-000000000007', 'Maya'),
  ('c1000000-0000-0000-0000-000000000008', 'James');

-- Sample notes
insert into notes (item_id, content) values
  ('c1000000-0000-0000-0000-000000000001', 'Had intro call with Greenfield. They are keen, contract being drafted.'),
  ('c1000000-0000-0000-0000-000000000006', 'Only 8 of 20 bugs resolved so far. Team is blocked on auth refactor.'),
  ('b1000000-0000-0000-0000-000000000004', 'At risk due to auth refactor dependency. Need engineering sync by EOW.');
