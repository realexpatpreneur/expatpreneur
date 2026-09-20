-- ExpatPreneurs Global, Phase 2: Industry Groups and Pods
-- Groups gather people in the same trade across every Village.
-- Pods are small, committed and meet on a rhythm.
-- Run after 0002_rls.sql.

create type group_status as enum ('forming','open','full','paused','closed');

create table industry_groups (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  industry     text not null,
  description  text,
  lead_id      uuid references profiles(id) on delete set null,
  whatsapp_url text,
  status       group_status not null default 'forming',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger industry_groups_updated before update on industry_groups
  for each row execute function set_updated_at();

create table group_members (
  group_id   uuid not null references industry_groups(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table pods (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  purpose      text,
  village_id   uuid references villages(id) on delete set null,
  lead_id      uuid references profiles(id) on delete set null,
  capacity     int not null default 8 check (capacity between 3 and 12),
  cadence      text not null default 'monthly',
  whatsapp_url text,
  status       group_status not null default 'forming',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger pods_updated before update on pods
  for each row execute function set_updated_at();

create table pod_members (
  pod_id     uuid not null references pods(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (pod_id, profile_id)
);

create view group_sizes as
select g.id as group_id, g.name, count(m.profile_id)::int as members
from industry_groups g
left join group_members m on m.group_id = g.id
group by g.id;

create view pod_sizes as
select p.id as pod_id, p.name, p.capacity,
       count(m.profile_id)::int as members,
       p.capacity - count(m.profile_id)::int as places_left
from pods p
left join pod_members m on m.pod_id = p.id
group by p.id;

alter view group_sizes set (security_invoker = on);
alter view pod_sizes   set (security_invoker = on);

-- ------------------------------------------------------------------ rules

alter table industry_groups enable row level security;
alter table group_members   enable row level security;
alter table pods            enable row level security;
alter table pod_members     enable row level security;

-- Every member sees the Groups and Pods. Only the Global team creates them,
-- and a lead can edit their own.
create policy groups_read on industry_groups
  for select using (is_member() or is_admin());
create policy groups_write on industry_groups
  for all using (is_global_admin() or lead_id = auth.uid())
  with check (is_global_admin() or lead_id = auth.uid());

create policy pods_read on pods
  for select using (is_member() or is_admin());
create policy pods_write on pods
  for all using (is_global_admin() or is_local_admin(village_id) or lead_id = auth.uid())
  with check (is_global_admin() or is_local_admin(village_id) or lead_id = auth.uid());

-- Members join and leave for themselves. Leads and admins can remove.
create policy group_members_read on group_members
  for select using (is_member() or is_admin());
create policy group_members_join on group_members
  for insert with check (profile_id = auth.uid() and is_member());
create policy group_members_leave on group_members
  for delete using (
    profile_id = auth.uid()
    or is_global_admin()
    or exists (select 1 from industry_groups g where g.id = group_id and g.lead_id = auth.uid())
  );

create policy pod_members_read on pod_members
  for select using (is_member() or is_admin());
create policy pod_members_join on pod_members
  for insert with check (profile_id = auth.uid() and is_member());
create policy pod_members_leave on pod_members
  for delete using (
    profile_id = auth.uid()
    or is_global_admin()
    or exists (select 1 from pods p where p.id = pod_id and p.lead_id = auth.uid())
  );