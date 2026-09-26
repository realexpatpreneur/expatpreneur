-- Give an account the Global team role.
--
-- Six admin and Global pages send you to /home because your account
-- holds no role. That is the guard working: /admin needs local_admin on
-- at least one Village, /global needs global_admin. Neither is granted
-- by signing up, and nothing in the platform grants the first one,
-- because there would be nobody to approve it.
--
-- Put your own email in the line below and run it in the Supabase SQL
-- editor. Sign out and in again afterwards.

insert into member_roles (profile_id, role, scope, scope_id)
select p.id, 'global_admin', 'global', null
from profiles p
where p.email = 'PUT YOUR EMAIL HERE'
on conflict (profile_id, role, scope, scope_id) do nothing;

-- Local Admin of the Dubai Village as well, so you can see that
-- workspace too. A Local Admin is always scoped to one Village.
insert into member_roles (profile_id, role, scope, scope_id)
select p.id, 'local_admin', 'village', v.id
from profiles p
cross join villages v
where p.email = 'PUT YOUR EMAIL HERE'
  and v.slug = 'dubai'
on conflict (profile_id, role, scope, scope_id) do nothing;

-- What you now hold.
select p.email, r.role, r.scope, coalesce(v.name, 'the whole network') as over
from member_roles r
join profiles p on p.id = r.profile_id
left join villages v on v.id = r.scope_id
where p.email = 'PUT YOUR EMAIL HERE'
  and r.ended_at is null;
