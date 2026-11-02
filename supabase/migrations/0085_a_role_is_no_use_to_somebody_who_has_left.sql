-- A role is no use to somebody who has left

-- Every role question in the schema asked one thing: is there a row in
-- member_roles with ended_at null. None of them asked whether the person
-- holding it is still here.

-- is_member(), is_paid() and is_paid_row() have always asked for the
-- status as well, so the two halves of the schema disagreed. A Global
-- Admin marked left kept is_global_admin(), is_admin(), is_any_admin()
-- and has_complimentary_role(), which between them open every admin
-- policy in the database, including the one that reads every member
-- record in the network. The member side was shut and the admin side was
-- wide open, which is the wrong way round.

-- Nothing here ends anybody's role. The row stays exactly as it is, so
-- putting a status back to active hands the role back with it. Ending a
-- role is still a thing an admin does on purpose, on the Leadership
-- page.

-- ------------------------------------------------------ still here

create or replace function is_in_place(who uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = who
      and status in ('onboarding', 'active', 'quiet')
  )
$$;

comment on function is_in_place(uuid) is
  'Still part of the network: the same three statuses is_member(), '
  'is_paid() and is_paid_row() ask for. Invited, left and removed are '
  'not. Every role function below starts here.';

grant execute on function is_in_place(uuid) to anon, authenticated;

-- --------------------------------------------- the role functions

create or replace function is_global_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select is_in_place() and exists (
    select 1 from member_roles
    where profile_id = auth.uid() and role = 'global_admin' and ended_at is null
  )
$$;

create or replace function is_local_admin(v uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select is_in_place() and v is not null and exists (
    select 1 from member_roles
    where profile_id = auth.uid()
      and role = 'local_admin'
      and ended_at is null
      and scope = 'village'
      and scope_id = v
  )
$$;

create or replace function is_any_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select is_in_place() and (
    is_global_admin() or exists (
      select 1 from member_roles
      where profile_id = auth.uid()
        and role = 'local_admin'
        and ended_at is null
    )
  )
$$;

create or replace function is_educator() returns boolean
language sql stable security definer set search_path = public as $$
  select is_in_place() and exists (
    select 1 from member_roles
    where profile_id = auth.uid()
      and role = 'educator'
      and ended_at is null
  )
$$;

create or replace function has_complimentary_role() returns boolean
language sql stable security definer set search_path = public as $$
  select is_in_place() and exists (
    select 1 from member_roles
    where profile_id = auth.uid()
      and ended_at is null
      and role in ('global_admin', 'local_admin', 'pod_lead', 'industry_lead')
  )
$$;

create or replace function holds_a_role(who uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select is_in_place(who) and exists (
    select 1 from member_roles r
    where r.profile_id = who
      and r.ended_at is null
      and r.role in ('local_admin','global_admin','circle_host',
                     'industry_lead','pod_lead','educator')
  )
$$;

-- is_admin(v) is is_global_admin() or is_local_admin(v), so it follows
-- from the two above without being touched.

-- is_paid_row() in 0083 asks about a given row rather than the caller,
-- and already reads that row's status, so it is right as it stands.
