-- An admin of somewhere is not an admin of everywhere.
-- Run after 0072_newsletter_signup_properly.sql. Safe to run more than once.
--
-- is_local_admin takes a Village and ends with:
--
--     and (v is null or (scope = 'village' and scope_id = v))
--
-- so when it is called with nothing the scope test disappears and the
-- function is true for anybody holding local_admin anywhere. Nineteen
-- policies call it that way. In most of them it sits beside is_member()
-- and only widens a read a member already had, which is harmless. In five
-- it is the whole gate, and in those five a Local Admin of one Village can
-- read and act on every other Village's data: every moderation report,
-- every role row, every connection request between two members, and every
-- community suggestion.
--
-- There is a second shape of the same fault. When a row's own village_id
-- is null, is_admin(village_id) is is_admin(null), which is true for every
-- Local Admin. An applicant who ticks "there is no Village in my city yet"
-- produces exactly such a row, and so does the profile made from it, so
-- that is the normal case rather than an edge one.
--
-- The fix is to split the two questions that were sharing one function.
-- "Is this person an admin of this Village" keeps is_admin(v). "Is this
-- person an admin of anywhere" becomes is_any_admin(), and the policies
-- that genuinely meant that now say so.

-- ------------------------------------------------- the two questions

create or replace function is_any_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select is_global_admin() or exists (
    select 1 from member_roles
    where profile_id = auth.uid()
      and role = 'local_admin'
      and ended_at is null
  )
$$;

comment on function is_any_admin() is
  'Holds global_admin, or local_admin of some Village. Use this where a '
  'policy only needs to know that somebody is an admin at all. Where it '
  'matters which Village, use is_admin(village_id).';

-- A null Village no longer means every Village. Anything that wants the
-- old reading now asks is_any_admin() for it, explicitly.
create or replace function is_local_admin(v uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select v is not null and exists (
    select 1 from member_roles
    where profile_id = auth.uid()
      and role = 'local_admin'
      and ended_at is null
      and scope = 'village'
      and scope_id = v
  )
$$;

comment on function is_local_admin(uuid) is
  'Local Admin of this Village. Called with null it is false, because a '
  'row with no Village belongs to nobody in particular.';

-- ------------------------------------- the harmless widening, restated

-- These nineteen all read "or an admin", beside a check a member already
-- passes. They keep exactly the behaviour they had; they just say which
-- question they are asking.

drop policy if exists villages_public_read on villages;
create policy villages_public_read on villages
  for select using (
    status in ('exploring','launching','open','paused') or is_any_admin()
  );

drop policy if exists market_posts_read on market_posts;
create policy market_posts_read on market_posts
  for select using (is_member() or is_any_admin());

drop policy if exists market_replies_read on market_replies;
create policy market_replies_read on market_replies
  for select using (is_member() or is_any_admin());

drop policy if exists media_read on media_items;
create policy media_read on media_items
  for select using (
    (published_at is not null and not member_only) or is_member() or is_any_admin()
  );

drop policy if exists groups_read on industry_groups;
create policy groups_read on industry_groups
  for select using (is_member() or is_any_admin());

drop policy if exists pods_read on pods;
create policy pods_read on pods
  for select using (is_member() or is_any_admin());

drop policy if exists session_hosts_read on session_hosts;
create policy session_hosts_read on session_hosts
  for select using (is_member() or is_any_admin());

drop policy if exists group_members_read on group_members;
create policy group_members_read on group_members
  for select using (profile_id = auth.uid() or is_paid() or is_any_admin());

drop policy if exists pod_members_read on pod_members;
create policy pod_members_read on pod_members
  for select using (profile_id = auth.uid() or is_paid() or is_any_admin());

-- ------------------------------------------------ the five real holes

-- A role row says who runs what. A Local Admin of Dubai had no business
-- reading Lisbon's, and the Global team's own roles were readable by all
-- of them.
drop policy if exists roles_read on member_roles;
create policy roles_read on member_roles
  for select using (
    profile_id = auth.uid()
    or is_global_admin()
    or (scope = 'village' and is_local_admin(scope_id))
  );

-- The suggestions page tells a member that one about the whole community
-- goes to the Global team. It went to every Local Admin as well.
drop policy if exists suggestions_admin_read on suggestions;
create policy suggestions_admin_read on suggestions
  for select using (
    is_global_admin()
    or (about = 'village' and is_local_admin(village_id))
    or author_id = auth.uid()
  );

-- A record of which reminder went to whom, for the admin of the Village
-- the event belongs to.
drop policy if exists reminders_admin on event_reminders_sent;
create policy reminders_admin on event_reminders_sent
  for all using (
    is_global_admin()
    or exists (
      select 1 from events e
      where e.id = event_id and is_local_admin(e.village_id)
    )
  ) with check (
    is_global_admin()
    or exists (
      select 1 from events e
      where e.id = event_id and is_local_admin(e.village_id)
    )
  );

-- Who asked to be introduced to whom is between those two people. It was
-- readable by every Local Admin in the network. Moderation keeps it.
drop policy if exists connections_read on connection_requests;
create policy connections_read on connection_requests
  for select using (
    requester_id = auth.uid()
    or recipient_id = auth.uid()
    or is_global_admin()
  );

-- ------------------------------------------------------------ reports
--
-- The moderation queue was the worst of the five: any Local Admin could
-- read the body of any report in the network, see who filed it, and close
-- it. The table had no Village to scope by, which is why nobody could
-- have scoped it, so it gets one.

alter table reports add column if not exists village_id uuid
  references villages(id) on delete set null;

comment on column reports.village_id is
  'The Village this belongs to, taken from whoever was reported. Null '
  'means nobody local owns it and it is the Global team''s.';

-- Existing rows: the Village of the person reported, which is how the
-- product thinks about where a report belongs.
update reports r
   set village_id = p.village_id
  from profiles p
 where p.id = r.subject_id
   and r.village_id is null;

create index if not exists reports_village_idx on reports (village_id, status);

drop policy if exists reports_read on reports;
create policy reports_read on reports
  for select using (
    reporter_id = auth.uid()
    or is_global_admin()
    or is_local_admin(village_id)
  );

drop policy if exists reports_update on reports;
create policy reports_update on reports
  for update using (
    is_global_admin() or is_local_admin(village_id)
  ) with check (
    is_global_admin() or is_local_admin(village_id)
  );

-- ------------------------------------------- rows with no Village yet
--
-- Now that is_admin(null) is false, somebody still has to be able to deal
-- with an applicant who named no city, and with the profile made from
-- one. Those are the two places the product creates such a row on purpose.

-- An application with no Village is triaged by whoever is free, which is
-- what the admin list already does on screen.
drop policy if exists applications_admin_read on applications;
create policy applications_admin_read on applications
  for select using (
    case when village_id is null then is_any_admin()
         else is_admin(village_id) end
  );

drop policy if exists applications_admin_write on applications;
create policy applications_admin_write on applications
  for update using (
    case when village_id is null then is_any_admin()
         else is_admin(village_id) end
  ) with check (
    case when village_id is null then is_any_admin()
         else is_admin(village_id) end
  );

-- A member with no Village is a Global matter, not a free for all. Before
-- this, every Local Admin could read their email, phone and nationalities
-- and set their plan, status and complimentary flag.
drop policy if exists profiles_admin_write on profiles;
create policy profiles_admin_write on profiles
  for all using (
    case when village_id is null then is_global_admin()
         else is_admin(village_id) end
  ) with check (
    case when village_id is null then is_global_admin()
         else is_admin(village_id) end
  );
