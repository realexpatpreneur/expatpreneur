-- 0067_complimentary_and_circles.sql
--
-- Three things, all about who may be inside.
--
-- One. Complimentary membership. Her framework asks for it by name: a
-- complimentary subscription status for volunteer roles. It is a reason
-- for access rather than a tier, so it is a flag beside the plan rather
-- than a third value in it, and the tile still says Village Member.
--
-- It comes from two places. A role carries it while the role lasts, so
-- stepping down ends it without anybody remembering to. And it can be
-- given by hand, which is what the people already in a Village need at
-- launch, along with a line saying why and who gave it.
--
-- Two. Circles join Industry Hubs and Growth Pods inside the paid
-- membership, which section 13 now states.
--
-- Three. While doing that: any signed in member could read every
-- Circle's WhatsApp link, in any Village, because the public read policy
-- says true for everybody and the column was granted to every signed in
-- role. A group link is an invitation to a private room. The column is
-- taken back and served through a view that gives it to the member whose
-- Circle it is, and to the admins of that Village.
--
-- Safe to run more than once.

-- ------------------------------------------------ complimentary access

alter table profiles
  add column if not exists complimentary        boolean not null default false,
  add column if not exists complimentary_reason text,
  add column if not exists complimentary_by     uuid references profiles(id) on delete set null,
  add column if not exists complimentary_at     timestamptz;

comment on column profiles.complimentary is
  'Given membership without paying. Volunteer roles carry it on their '
  'own; this is for the ones given by hand, such as the people already '
  'in a Village at launch.';

-- The roles she named: hers, the Local Admins, the Growth Pod Leaders
-- and the Industry Hub hosts. A Circle Host is not on that list, nor is
-- an educator, so neither is here.
-- A member may see that their own membership is complimentary, because
-- the site tells them so on their settings page. Why it was given, who
-- gave it and when stay with the admins, who read member_records.
grant select (complimentary) on profiles to authenticated;

create or replace function has_complimentary_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from member_roles
    where profile_id = auth.uid()
      and ended_at is null
      and role in ('global_admin', 'local_admin', 'pod_lead', 'industry_lead')
  )
$$;

grant execute on function has_complimentary_role() to anon, authenticated;

-- One function decides what the private side opens for, so Hubs, Pods,
-- connections, messages, events, the Directory and the rest all follow
-- without being touched.
create or replace function is_paid() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and status in ('onboarding', 'active', 'quiet')
      and (plan = 'paid' or complimentary or has_complimentary_role())
  )
$$;

-- ------------------------------------------------- Circles are paid now

drop policy if exists circles_member_read on circles;
create policy circles_member_read on circles
  for select to authenticated using (is_paid() or is_admin());

-- The public read stays, for the Village pages, but only for visitors.
drop policy if exists circles_public_read on circles;
create policy circles_public_read on circles
  for select to anon using (true);

-- ------------------------------------------- the group link is private

-- A column revoke does nothing while a table wide grant stands, so the
-- table grant goes and every column but the link comes back, which is
-- the shape migration 0015 used for profiles.
revoke select on circles from authenticated;
grant select (
  id, village_id, name, capacity, host_id, status, created_at, updated_at
) on circles to authenticated;

-- The view runs as its owner so the column can be served at all, which
-- means it has to ask about the plan itself rather than leaning on row
-- level security to ask for it.
create or replace view circle_rooms as
select c.id, c.village_id, c.name, c.capacity, c.status, c.whatsapp_url
from circles c
where (c.id = my_circle() and is_paid())
   or is_admin(c.village_id);

alter view circle_rooms set (security_invoker = off);
grant select on circle_rooms to authenticated;

comment on view circle_rooms is
  'A Circle with the way into its room, for the member whose Circle it '
  'is and for the admins of that Village. Nobody else needs the link.';

-- ----------------------------------------------- the admin record again

-- member_records was written as select p.* back in 0015, and Postgres
-- fixes the column list at that moment. Every column added to profiles
-- since then has been missing from it: time_zone, language,
-- show_business and findable_elsewhere, which is why the Settings page
-- showed those four controls at their defaults however they were set,
-- and now the complimentary columns too. Replacing the view re-expands
-- the star. It only ever adds columns at the end, so nothing that reads
-- it today changes.
create or replace view member_records
with (security_invoker = off) as
select p.*
from profiles p
where is_admin(p.village_id) or p.id = auth.uid();
