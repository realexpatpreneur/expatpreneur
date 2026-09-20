-- ExpatPreneurs Global: three walls members hit
-- A member could join a Pod but never start one. A member who moved city
-- had no route but to ask an admin privately. And a member asking for their
-- own data had nowhere to ask, which matters the moment Lisbon and Paris
-- open and European law applies.
-- Run after 0018_media.sql.

-- ------------------------------------------------------- proposing a Pod

create table pod_proposals (
  id          uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references profiles(id) on delete cascade,
  village_id  uuid references villages(id) on delete set null,
  name        text not null,
  purpose     text not null,
  cadence     text not null default 'monthly',
  ends_on     date,
  status      suggestion_status not null default 'new',
  note        text,
  pod_id      uuid references pods(id) on delete set null,   -- once it exists
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger pod_proposals_updated before update on pod_proposals
  for each row execute function set_updated_at();

alter table pod_proposals enable row level security;

create policy pod_proposals_mine on pod_proposals
  for insert with check (proposer_id = auth.uid() and is_member());
create policy pod_proposals_read on pod_proposals
  for select using (proposer_id = auth.uid() or is_admin(village_id) or is_global_admin());
create policy pod_proposals_decide on pod_proposals
  for update using (is_global_admin()) with check (is_global_admin());

-- ----------------------------------------------------- moving city

create table transfer_requests (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  from_village  uuid references villages(id) on delete set null,
  to_village    uuid references villages(id) on delete set null,
  moving_on     date,
  note          text,
  status        text not null default 'new',    -- new, arranged, done, declined
  handled_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger transfer_requests_updated before update on transfer_requests
  for each row execute function set_updated_at();

alter table transfer_requests enable row level security;

-- The member, and the admins of either end. A move is two Villages' business.
create policy transfers_mine on transfer_requests
  for insert with check (profile_id = auth.uid() and is_member());
create policy transfers_read on transfer_requests
  for select using (
    profile_id = auth.uid()
    or is_admin(from_village)
    or is_admin(to_village)
    or is_global_admin()
  );
create policy transfers_handle on transfer_requests
  for update using (is_admin(from_village) or is_admin(to_village) or is_global_admin())
  with check (is_admin(from_village) or is_admin(to_village) or is_global_admin());

-- ------------------------------------------ a member's own data

create table data_requests (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  kind        text not null default 'export',   -- export, delete
  status      text not null default 'new',      -- new, in_progress, done, refused
  note        text,
  handled_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger data_requests_updated before update on data_requests
  for each row execute function set_updated_at();

alter table data_requests enable row level security;

create policy data_requests_mine on data_requests
  for insert with check (profile_id = auth.uid());
create policy data_requests_read on data_requests
  for select using (profile_id = auth.uid() or is_global_admin());
create policy data_requests_handle on data_requests
  for update using (is_global_admin()) with check (is_global_admin());