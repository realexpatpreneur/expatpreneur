-- 0057_hubs_and_pods_are_paid.sql
--
-- The Membership Offer and Access Framework of October 2026 puts Industry
-- Hubs and Growth Pods inside the paid Village Membership. Until now any
-- member could join either one, which is what the prototype did, because
-- there the paid plan only added the other Villages.
--
-- What changes: joining one, and seeing who is inside one.
--
-- What does not change: the list of Hubs stays public, since discovering
-- that a trade has a home here is part of what brings people in, and the
-- Pod list stays visible to every member. The pages stop showing member
-- counts to somebody who cannot see the members, so no screen shows a
-- number that row level security has quietly turned into a zero.
--
-- Somebody who joined before this and later stops paying keeps their own
-- row, so they can still find their way out of a Hub or a Pod.
--
-- Safe to run more than once.

-- ----------------------------------------------------------- joining

drop policy if exists group_members_join on group_members;
create policy group_members_join on group_members
  for insert with check (profile_id = auth.uid() and is_paid());

drop policy if exists pod_members_join on pod_members;
create policy pod_members_join on pod_members
  for insert with check (profile_id = auth.uid() and is_paid());

-- ------------------------------------------------- seeing who is in one

drop policy if exists group_members_read on group_members;
create policy group_members_read on group_members
  for select using (profile_id = auth.uid() or is_paid() or is_admin());

drop policy if exists pod_members_read on pod_members;
create policy pod_members_read on pod_members
  for select using (profile_id = auth.uid() or is_paid() or is_admin());
