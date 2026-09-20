-- ExpatPreneurs Global: tell me when this Village opens
-- A member browsing the network can ask to be told when a launching
-- Village opens. The prototype has the confirmation screen; this is what
-- sits behind it.
-- Run after 0033_explicit_grants.sql.

create table village_interest (
  profile_id uuid not null references profiles(id) on delete cascade,
  village_id uuid not null references villages(id) on delete cascade,
  told_at    timestamptz,
  created_at timestamptz not null default now(),
  primary key (profile_id, village_id)
);

alter table village_interest enable row level security;

create policy village_interest_own on village_interest
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy village_interest_admin on village_interest
  for select using (is_admin(village_id) or is_global_admin());

grant select, insert, update, delete on village_interest to authenticated;