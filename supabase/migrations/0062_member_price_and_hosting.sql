-- 0062_member_price_and_hosting.sql
--
-- Two lines on the Village Member tile that the build did not keep.
--
-- One. Preferential pricing for eligible paid events. Courses have had a
-- member price since 0021; events never did, so every ticket cost the
-- same whoever bought it. Events get the same column, with the same
-- meaning: null is the same price as everybody else.
--
-- Two. Eligibility to host workshops, training and showcases. Any member
-- could put themselves forward as an educator and publish a course, while
-- her framework puts hosting inside Village Membership and the Learning
-- page already told people it was. Creating now needs a paid plan.
--
-- Somebody who set up as an educator before this, or who later stops
-- paying, keeps what they have and can still manage it. Only starting
-- something new asks for the plan, which is how joining a Hub works.
--
-- Safe to run more than once.

-- ------------------------------------------------- a price for members

alter table events add column if not exists member_price_cents int
  check (member_price_cents is null or member_price_cents >= 0);

comment on column events.member_price_cents is
  'What a Village Member pays. Null means the same as everybody else.';

-- --------------------------------------------------------- who may host

drop policy if exists educator_profiles_write  on educator_profiles;
drop policy if exists educator_profiles_create on educator_profiles;
drop policy if exists educator_profiles_manage on educator_profiles;
drop policy if exists educator_profiles_remove on educator_profiles;

create policy educator_profiles_create on educator_profiles
  for insert with check (
    (profile_id = auth.uid() and is_paid()) or is_global_admin()
  );
create policy educator_profiles_manage on educator_profiles
  for update using (profile_id = auth.uid() or is_global_admin())
         with check (profile_id = auth.uid() or is_global_admin());
create policy educator_profiles_remove on educator_profiles
  for delete using (profile_id = auth.uid() or is_global_admin());

drop policy if exists courses_write  on courses;
drop policy if exists courses_create on courses;
drop policy if exists courses_manage on courses;
drop policy if exists courses_remove on courses;

create policy courses_create on courses
  for insert with check (
    (educator_id = auth.uid() and is_paid()) or is_global_admin()
  );
create policy courses_manage on courses
  for update using (educator_id = auth.uid() or is_global_admin())
         with check (educator_id = auth.uid() or is_global_admin());
create policy courses_remove on courses
  for delete using (educator_id = auth.uid() or is_global_admin());
