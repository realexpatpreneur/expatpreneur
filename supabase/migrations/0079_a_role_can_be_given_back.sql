-- A role can be given back, and somebody put forward twice.
-- Run after 0078. Safe to run more than once.
--
-- member_roles is unique on (profile_id, role, scope, scope_id) and
-- ended_at is not in the key. endRole sets ended_at and leaves the row
-- where it is, so the tuple stays taken for ever. When somebody steps
-- down as Local Admin of Lisbon in March and is asked back in September,
-- the insert collides and the form says "That role is already held, or
-- the details do not match." They hold nothing: the March row is ended,
-- so is_local_admin ignores it and they have no access. The role could
-- never be given back through the product at all, only by SQL, and the
-- message sent whoever tried looking for a role that was not there.
--
-- The constraint is doing something worth keeping, which is stopping the
-- same live role being granted twice. It just has to mean a live one.

alter table member_roles
  drop constraint if exists member_roles_profile_id_role_scope_scope_id_key;

create unique index if not exists member_roles_live_key
  on member_roles (profile_id, role, scope, scope_id)
  where ended_at is null;

comment on index member_roles_live_key is
  'One live grant of a role per person per scope. An ended one is history '
  'and does not stand in the way of giving it again.';

-- leadership_suggestions has the same shape, unique on (profile_id,
-- role), with no Village in it and no sense of a cycle. So once Nadia had
-- been put forward for local_admin anywhere and the Global team said not
-- now, no admin in any Village could ever put her forward again, and the
-- refusal was reported as "You have already put this member forward for
-- that role."

alter table leadership_suggestions
  drop constraint if exists leadership_suggestions_profile_id_role_key;

create unique index if not exists leadership_suggestions_open_key
  on leadership_suggestions (profile_id, role)
  where status = 'new';

comment on index leadership_suggestions_open_key is
  'One open suggestion per person per role. Once it has been decided, '
  'somebody may be put forward again later.';
