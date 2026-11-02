-- A lapsed member keeps their Circle place for thirty five days

-- Until now losing a subscription kept the Circle for ever, and the
-- comment in the webhook said so out loud: "drops them back to free
-- membership, which keeps their Village and their Circle". /upgrade/done
-- told them the same on the way out. Neither was true after 0067, which
-- put Circles behind is_paid(): the Circle closed immediately and
-- /my-circle sent them to a page that answered not found. So they were
-- promised the seat for ever and lost it at once.

-- Thirty five days, then the seat goes. If they come back later and the
-- Circle still has room, they go straight back into it, which is what
-- the former_circle_id column remembers.

-- The seat is held rather than released at once because it is theirs
-- until it is not, and it counts against the fifty the whole time it is
-- held. That is already true without any change here: 0080 counts
-- anybody active or quiet in the Circle, and a lapsed member is still
-- active. Releasing the seat is what takes them out of the count.

alter table profiles add column if not exists lapsed_at timestamptz;
alter table profiles
  add column if not exists former_circle_id uuid references circles(id) on delete set null;

comment on column profiles.lapsed_at is
  'When this member stopped being paid for. Null while they are paid. '
  'The thirty five day hold on their Circle place runs from here.';
comment on column profiles.former_circle_id is
  'The Circle a released seat came from, so a member who comes back can '
  'be put into it again when it still has room.';

-- Neither column is granted to anon or authenticated. 0015 took the
-- table wide grant off profiles and hands back a named list, so a new
-- column is private by default, which is the right way round. A member
-- reads their own through the view at the bottom of this file; nobody
-- reads anybody else's.

-- ------------------------------------------------- paid, for any row

-- is_paid() asks about the person signed in, so it is no use to a
-- trigger or to a nightly job looking at everybody. This is the same
-- question asked of a row.
create or replace function is_paid_row(
  p_id uuid, p_plan plan_tier, p_complimentary boolean, p_status member_status
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_status in ('onboarding', 'active', 'quiet')
     and (
       p_plan = 'paid'
       or coalesce(p_complimentary, false)
       or exists (
         select 1 from member_roles
         where profile_id = p_id
           and ended_at is null
           and role in ('global_admin', 'local_admin', 'pod_lead', 'industry_lead')
       )
     );
$$;

comment on function is_paid_row(uuid, plan_tier, boolean, member_status) is
  'is_paid() for a given row rather than for the caller. The four roles '
  'are the same four has_complimentary_role() lists in 0067 and '
  'ROLES_THAT_CARRY_MEMBERSHIP lists in lib/member.ts.';

-- --------------------------------------- the clock starts, and stops

-- This is in the database rather than in the webhook because membership
-- ends in more than one place: a cancelled subscription, a refund, a
-- Local Admin turning complimentary off, a role being given back. Every
-- one of those is an update to profiles or to member_roles, so putting
-- it here catches all of them, including a change made by hand in the
-- SQL editor.
--
-- The test is the state of the row, not the change to it, so touching a
-- row re-decides it. That is what the member_roles trigger below leans
-- on.
--
-- Only active and quiet are stamped. Invited and onboarding have never
-- been paid for, so they have not lapsed, they have not started, and
-- 0066 says the Circle arrives with the payment anyway. Left and removed
-- are gone rather than lapsed.
create or replace function membership_lapse_and_return()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  paid boolean;
  room int;
  taken int;
begin
  paid := is_paid_row(new.id, new.plan, new.complimentary, new.status);

  if paid then
    new.lapsed_at := null;

    -- Back from a lapse, with the seat already released and the Circle
    -- still holding room: straight back into it. The room is counted
    -- here rather than left to circle_is_not_overfilled, because that
    -- trigger sorts before this one and will have seen a null Circle and
    -- waved the row through before this line runs.
    if new.circle_id is null and new.former_circle_id is not null then
      select c.capacity into room from circles c where c.id = new.former_circle_id;

      if room is not null then
        select count(*) into taken
          from profiles p
         where p.circle_id = new.former_circle_id
           and p.id <> new.id
           and p.status in ('active', 'onboarding', 'quiet');

        -- A place promised to somebody approved and not yet paid is
        -- taken, same as 0080 counts it, so coming back cannot take a
        -- seat out from under an approved applicant.
        select taken + count(*) into taken
          from applications a
         where a.circle_id = new.former_circle_id
           and a.status = 'approved';

        if taken < room then
          new.circle_id := new.former_circle_id;
          new.former_circle_id := null;
        end if;
      end if;
    end if;

    return new;
  end if;

  if new.status in ('active', 'quiet') and new.lapsed_at is null then
    new.lapsed_at := now();
  end if;

  return new;
end;
$$;

-- c sorts before m, so circle_is_not_overfilled runs first and this one
-- counts its own room. Said again here because the order is load bearing.
drop trigger if exists membership_lapse_and_return on profiles;
create trigger membership_lapse_and_return
  before insert or update on profiles
  for each row execute function membership_lapse_and_return();

-- A role that carried membership ending is a lapse too, and it happens
-- on the other table. Touching the profile is enough, because the
-- trigger above reads the state of the row rather than the change.
create or replace function role_change_rechecks_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set updated_at = now()
   where id = coalesce(new.profile_id, old.profile_id);
  return null;
end;
$$;

drop trigger if exists role_change_rechecks_membership on member_roles;
create trigger role_change_rechecks_membership
  after insert or update or delete on member_roles
  for each row execute function role_change_rechecks_membership();

-- ------------------------------------------- the seat goes after 35

create or replace function release_lapsed_circle_places()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  moved int;
begin
  with released as (
    update profiles p
       set former_circle_id = p.circle_id,
           circle_id = null
     where p.circle_id is not null
       and p.lapsed_at is not null
       and p.lapsed_at < now() - interval '35 days'
       and not is_paid_row(p.id, p.plan, p.complimentary, p.status)
    returning p.id
  )
  select count(*) into moved from released;
  return coalesce(moved, 0);
end;
$$;

comment on function release_lapsed_circle_places() is
  'Nightly. Releases a Circle place thirty five days after the '
  'membership behind it ended, remembering which Circle it was.';

revoke all on function release_lapsed_circle_places() from anon, authenticated;

-- Scheduled in the database rather than through /api/cron, which the
-- other two jobs use. Those answer 401 and do nothing at all unless
-- CRON_SECRET is set in the host, which is one of the reasons the
-- scheduled jobs looked like they ran and did not. Whether somebody
-- keeps their seat should not rest on an environment variable.
do $$
begin
  perform cron.unschedule('expatpreneurs-circle-holds');
exception when others then null;
end;
$$;

select cron.schedule(
  'expatpreneurs-circle-holds',
  '20 3 * * *',
  $$select release_lapsed_circle_places()$$
);

-- --------------------------------------- what the member sees of it

-- Their own, and only their own. The columns stay off the profiles grant
-- so nobody reads anybody else's lapse date, which is the shape 0067
-- used for circle_rooms and 0076 for village_settings.
create or replace view my_membership as
select
  p.id,
  p.lapsed_at,
  p.former_circle_id,
  c.name as former_circle_name,
  (p.lapsed_at + interval '35 days') as place_held_until
from profiles p
left join circles c on c.id = p.former_circle_id
where p.id = auth.uid();

alter view my_membership set (security_invoker = off);
revoke all on my_membership from anon;
grant select on my_membership to authenticated;
