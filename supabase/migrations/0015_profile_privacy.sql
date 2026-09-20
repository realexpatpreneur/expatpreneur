-- ExpatPreneurs Global: what a member can actually read about another member
-- The rule written in 0002 let any member read any profile row. The pages
-- only ever showed the safe parts, but the row was readable, which means an
-- email, a phone number and the answers somebody wrote for admins were one
-- query away. The member profile page promises the opposite in writing.
--
-- Two changes. Rows: your own Village, or any Village on the paid plan, or a
-- public profile, or your own. Columns: email, phone and nationalities are
-- taken away from members entirely, and read through an admin only view.
-- Run after 0014_waitlist_and_address.sql.

-- ------------------------------------------------------------------- rows

drop policy if exists profiles_public_read on profiles;

create policy profiles_read on profiles
  for select using (
    id = auth.uid()
    or is_admin(village_id)
    or (public_profile and status = 'active')
    or (is_member() and village_id = my_village())
    or (is_member() and is_paid())
  );

-- ---------------------------------------------------------------- columns

-- Nobody signed in reads the whole row any more. Everything a member is
-- allowed to see is listed here; everything else is not on the list.
revoke select on profiles from anon, authenticated;

grant select (
  id, full_name, headline, bio, avatar_url,
  village_id, circle_id, status, plan, founding,
  industry, business_name,
  languages, markets_known, lived_in,
  can_help_with, looking_for,
  public_profile, joined_on, last_active_at, created_at, updated_at
) on profiles to authenticated;

-- The public site reads even less.
grant select (
  id, full_name, headline, bio, avatar_url,
  village_id, industry, business_name, lived_in,
  public_profile, status
) on profiles to anon;

-- Members still change their own row, including their own phone.
grant insert, update on profiles to authenticated;

-- ------------------------------------------------------- the admin's view

-- Admins need the email, the phone and the nationalities to do the job.
-- This view runs as its owner, so the column grants above do not apply, and
-- the guard inside is what decides who sees a row.
create or replace view member_records
with (security_invoker = off) as
select p.*
from profiles p
where is_admin(p.village_id) or p.id = auth.uid();

revoke all on member_records from anon;
grant select on member_records to authenticated;

comment on view member_records is
  'The full member record, for admins of that Village and for the member '
  'themselves. Members read profiles instead, which hides email and phone.';