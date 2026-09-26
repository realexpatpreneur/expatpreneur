-- Bringing the people already in the WhatsApp group onto the platform.
--
-- These are not applications. Nobody is deciding whether to let them in;
-- they are already members. A row here is one person on the list, with
-- the details the Local Admin has, and a token that opens their own
-- re-enrolment page.

create type founding_invite_status as enum (
  'invited',      -- on the list, link not opened
  'reminded',     -- chased at least once
  're_enrolled',  -- they confirmed and have an account
  'declined',     -- they said it is not for them
  'removed'       -- past the deadline, taken out of the group
);

create table founding_invites (
  id           uuid primary key default gen_random_uuid(),
  village_id   uuid not null references villages(id) on delete cascade,
  full_name    text not null,
  phone        text,
  email        citext,
  token        text unique not null default encode(gen_random_bytes(16), 'hex'),
  status       founding_invite_status not null default 'invited',
  claimed_by   uuid references profiles(id) on delete set null,
  invited_at   timestamptz not null default now(),
  last_contact timestamptz,
  claimed_at   timestamptz,
  note         text,
  created_at   timestamptz not null default now()
);

create index founding_invites_village_idx on founding_invites(village_id, status);

-- When the Village stops waiting.
alter table villages
  add column if not exists reenrol_deadline date;

alter table founding_invites enable row level security;

-- The list belongs to the Village that holds it. Nobody else sees it,
-- and it is never public: the re-enrolment page itself is served with
-- the service key, by token, so a stranger cannot read the list even
-- with one valid link.
create policy founding_invites_read on founding_invites
  for select to authenticated
  using (is_global_admin() or is_local_admin(village_id));

create policy founding_invites_write on founding_invites
  for all to authenticated
  using (is_global_admin() or is_local_admin(village_id))
  with check (is_global_admin() or is_local_admin(village_id));

grant select, insert, update, delete on founding_invites to authenticated;

-- How a Village is doing at bringing its people across.
create or replace view founding_progress as
  select
    village_id,
    count(*) as on_the_list,
    count(*) filter (where status = 're_enrolled') as re_enrolled,
    count(*) filter (where status in ('invited', 'reminded')) as waiting,
    count(*) filter (where status = 'declined') as declined,
    count(*) filter (where status = 'removed') as removed
  from founding_invites
  group by village_id;

grant select on founding_progress to authenticated;