-- Fifty means fifty.
-- Run after 0079. Safe to run more than once.
--
-- A Circle is capped at fifty and the cap is enforced nowhere. The check
-- constraint on circles.capacity constrains the number in that column,
-- not how many people share a circle_id, and there is no trigger on
-- profiles doing it either. Two separate paths overfill a Circle.
--
-- One. circle_capacity counts profiles whose status is active or
-- onboarding. An approved applicant waits at invited with circle_id
-- still null, because the Circle their admin chose is parked on the
-- application until they pay. So a Local Admin can approve sixty people
-- into one Circle and every approval screen reads fifty places left the
-- whole way through. Then they all pay and all sixty get the circle_id.
--
-- Two. The admin members form lists every Circle, full ones included,
-- and updateMember writes circle_id with no capacity check at all. The
-- approval screen does filter on places_left; the members page does not,
-- so the two disagree.
--
-- The count also ignores quiet, which is a live member who is simply
-- having a quiet spell, so a Circle of fifty with six quiet members
-- reported six places left.

-- ------------------------------------------- what a place actually is

create or replace view circle_capacity as
select
  c.id as circle_id,
  c.village_id,
  c.name,
  c.capacity,
  -- Everybody who holds a place: the three live statuses, plus anybody
  -- approved into this Circle who has not paid yet. Their seat is
  -- promised, so counting it is the only way the admin sees the truth
  -- while deciding.
  (
    (select count(*) from profiles p
      where p.circle_id = c.id
        and p.status in ('active', 'onboarding', 'quiet'))
    +
    (select count(*) from applications a
      join profiles ap on ap.id = a.profile_id
      where a.circle_id = c.id
        and ap.status = 'invited'
        and ap.circle_id is null)
  )::int as members,
  greatest(
    c.capacity - (
      (select count(*) from profiles p
        where p.circle_id = c.id
          and p.status in ('active', 'onboarding', 'quiet'))
      +
      (select count(*) from applications a
        join profiles ap on ap.id = a.profile_id
        where a.circle_id = c.id
          and ap.status = 'invited'
          and ap.circle_id is null)
    ),
    0
  )::int as places_left
from circles c;

alter view circle_capacity set (security_invoker = on);

comment on view circle_capacity is
  'Places taken and places left. A place is taken by a live member of the '
  'Circle, quiet ones included, and by anybody approved into it who has '
  'not paid yet, because that seat is already promised to them.';

-- --------------------------------------------------- and enforce it

create or replace function circle_is_not_overfilled()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  taken int;
  room  int;
begin
  -- Only when somebody is being put into a Circle, or moved into a
  -- different one. Leaving one is always allowed.
  if new.circle_id is null
     or (tg_op = 'UPDATE' and new.circle_id is not distinct from old.circle_id) then
    return new;
  end if;

  -- Somebody who is not taking a place does not need one.
  if new.status not in ('active', 'onboarding', 'quiet') then
    return new;
  end if;

  select c.capacity into room from circles c where c.id = new.circle_id;
  if room is null then
    return new;
  end if;

  select count(*) into taken
    from profiles p
   where p.circle_id = new.circle_id
     and p.id <> new.id
     and p.status in ('active', 'onboarding', 'quiet');

  if taken >= room then
    raise exception
      'That Circle is full. It holds % and has % in it already.', room, taken;
  end if;

  return new;
end;
$$;

drop trigger if exists circle_is_not_overfilled on profiles;
create trigger circle_is_not_overfilled
  before insert or update on profiles
  for each row execute function circle_is_not_overfilled();

comment on function circle_is_not_overfilled() is
  'Fifty means fifty. This applies to the service role as well, because '
  'the cap is a rule of the product rather than a permission, so the '
  'payment webhook checks for room before it writes a Circle.';
