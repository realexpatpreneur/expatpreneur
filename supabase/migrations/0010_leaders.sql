-- ExpatPreneurs Global: leaders
-- Two things.
-- 1. Who may open a live room. The rule written in 0008 let anyone create a
--    session, because creating one made you its host. Now it takes a role.
-- 2. A leader can see who is in the thing they run.
-- Run after 0009_storage_and_images.sql.

create or replace function holds_a_role(who uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from member_roles r
    where r.profile_id = who
      and r.ended_at is null
      and r.role in ('local_admin','global_admin','circle_host',
                     'industry_lead','pod_lead','educator')
  )
$$;

-- Creating, changing and cancelling are three different things, so they get
-- three rules rather than one.
drop policy if exists sessions_write on live_sessions;

create policy sessions_open on live_sessions
  for insert with check (
    created_by = auth.uid()
    and (is_admin(village_id) or holds_a_role())
  );

create policy sessions_change on live_sessions
  for update using (is_session_host(live_sessions) or is_admin(village_id))
  with check (is_session_host(live_sessions) or is_admin(village_id));

create policy sessions_remove on live_sessions
  for delete using (is_session_host(live_sessions) or is_admin(village_id));

-- What a leader is responsible for, in one place. Each row is a thing they
-- run and how many people are in it.
create view my_leadership as
select r.profile_id,
       r.role::text as role,
       'circle'::text as kind,
       c.id as thing_id,
       c.name as thing_name,
       (select count(*) from profiles p where p.circle_id = c.id
         and p.status = 'active')::int as people
from member_roles r
join circles c on c.id = r.scope_id
where r.ended_at is null and r.role = 'circle_host'

union all

select r.profile_id, r.role::text, 'village',
       v.id, v.name,
       (select count(*) from profiles p where p.village_id = v.id
         and p.status = 'active')::int
from member_roles r
join villages v on v.id = r.scope_id
where r.ended_at is null and r.role = 'local_admin'

union all

select g.lead_id, 'industry_lead', 'group',
       g.id, g.name,
       (select count(*) from group_members m where m.group_id = g.id)::int
from industry_groups g
where g.lead_id is not null

union all

select p.lead_id, 'pod_lead', 'pod',
       p.id, p.name,
       (select count(*) from pod_members m where m.pod_id = p.id)::int
from pods p
where p.lead_id is not null;

alter view my_leadership set (security_invoker = on);