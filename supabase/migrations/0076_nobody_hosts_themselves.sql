-- Nobody hosts themselves, and nobody redirects their own post.
-- Run after 0075. Safe to run more than once.
--
-- Three things in one file, all of the same kind: a write or a read that
-- the interface gates and the database does not.

-- --------------------------------------------- the live room lobby
--
-- participants_update ends with `with check (true)`, so a member may
-- update their own row to anything. Knock on a room, then PATCH your own
-- participant row to state admitted and role host. The token endpoint
-- reads that role back and mints a LiveKit token with roomAdmin on it,
-- which is mute anybody, remove anybody, end the room. The lobby is
-- walked past in the same move, and a member a host removed can put
-- themselves back.
--
-- A policy cannot say "these columns only", so this is a trigger, the
-- same shape as profiles_no_self_promotion in 0068. Deliberately not
-- security definer: it needs to see the role it was called as.

create or replace function participants_no_self_promotion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Only the two roles a browser can reach are asked anything.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  -- A host of this session decides all of it.
  if exists (
    select 1 from live_sessions s
    where s.id = new.session_id and is_session_host(s)
  ) then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'A host decides who hosts.';
  end if;

  if new.state is distinct from old.state then
    raise exception 'A host decides who comes into the room.';
  end if;

  return new;
end;
$$;

drop trigger if exists participants_no_self_promotion on session_participants;
create trigger participants_no_self_promotion
  before update on session_participants
  for each row execute function participants_no_self_promotion();

comment on function participants_no_self_promotion() is
  'Keeps state and role out of a participant own hands. A host of the '
  'session, and the service role, pass straight through.';

-- ------------------------------------------- a members own address
--
-- 0068 lists plan, the four complimentary columns, founding, village_id,
-- circle_id, joined_on and status, and does not mention email. The
-- settings page does it correctly, through Supabase auth, which sends a
-- confirmation first. A PATCH straight at the data API skips that.
--
-- profiles.email is what every sender delivers to: the renewal cycle,
-- event reminders, the Circle letter, message alerts. So a member could
-- quietly point all of it at an address they do not own, and
-- auth.users.email and profiles.email would disagree with nothing saying
-- so.

-- What the sign in system has actually confirmed for this person. A
-- member may bring profiles.email into line with that, and may not point
-- it anywhere else.
create or replace function my_auth_email() returns text
language sql stable security definer set search_path = auth, public as $$
  select email from auth.users where id = auth.uid()
$$;

revoke all on function my_auth_email() from public;
grant execute on function my_auth_email() to authenticated;

create or replace function profiles_no_self_promotion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if is_admin(old.village_id) or is_admin(new.village_id) then
    return new;
  end if;

  if new.plan is distinct from old.plan then
    raise exception 'A plan changes by paying, or by an admin.';
  end if;

  if new.complimentary        is distinct from old.complimentary
  or new.complimentary_reason is distinct from old.complimentary_reason
  or new.complimentary_by     is distinct from old.complimentary_by
  or new.complimentary_at     is distinct from old.complimentary_at then
    raise exception 'Complimentary membership is given by an admin.';
  end if;

  if new.founding is distinct from old.founding then
    raise exception 'A founding seat is claimed by paying for it.';
  end if;

  if new.village_id is distinct from old.village_id then
    raise exception 'A Village changes by asking for a transfer.';
  end if;

  if new.circle_id is distinct from old.circle_id then
    raise exception 'A Circle is given by a Local Admin.';
  end if;

  if new.joined_on is distinct from old.joined_on then
    raise exception 'The joining date is not yours to set.';
  end if;

  -- The address everything is sent to: the renewal cycle, event
  -- reminders, the Circle letter, message alerts. It changes through the
  -- sign in system, which confirms it first. A member may copy the
  -- confirmed value here and may not set it to anything else.
  if new.email is distinct from old.email
     and lower(coalesce(new.email, '')) is distinct from lower(coalesce(my_auth_email(), '')) then
    raise exception 'An email address changes in Settings, which confirms it first.';
  end if;

  if new.status is distinct from old.status
  and not (old.status = 'onboarding' and new.status = 'active')
  and not (new.status = 'left'
           and old.status in ('onboarding', 'active', 'quiet')) then
    raise exception 'That status is set by an admin, or by paying.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_no_self_promotion on profiles;
create trigger profiles_no_self_promotion
  before update on profiles
  for each row execute function profiles_no_self_promotion();

-- ------------------------------------------ a Villages own settings
--
-- villages has no column grant anywhere in the tree, so anon holds the
-- table wide default and reads every column, including the ones 0023
-- added for a Local Admin to keep notes in. Three of them are written by
-- nothing today, so nothing is leaking yet; the shape is the fault.

revoke select on villages from anon, authenticated;

grant select (
  id, slug, name, city, country, timezone, status, summary, cover_url,
  launched_on, currency, paid_launch_on, created_at, updated_at
) on villages to anon, authenticated;

create or replace view village_settings as
select
  v.id,
  v.welcome_message,
  v.whatsapp_url,
  v.quiet_days,
  v.meeting_note,
  v.visitor_places,
  v.reenrol_deadline
from villages v
where is_admin(v.id);

alter view village_settings set (security_invoker = off);
revoke all on village_settings from anon;
grant select on village_settings to authenticated;

comment on view village_settings is
  'The working notes and numbers a Village keeps, to the admins of that '
  'Village and the Global team. Everything else about a Village is public.';

-- ------------------------------------------------ the settings table
--
-- settings_read is one blanket is_member(), so every member reads every
-- row. Among them is the nationality balance rule, and the note column
-- spells it out in English: "No Village may be more than this percent of
-- one nationality." That rule is internal and is never to be written to
-- a member. The educator share, the recognition amounts and the four
-- security switches are in there too.
--
-- Three keys are genuinely a member's business, so they stay readable and
-- everything else becomes an admin matter.

drop policy if exists settings_read on settings;
create policy settings_read on settings
  for select using (
    is_any_admin()
    or key in ('default_language', 'languages_prepared', 'educator_share')
  );
