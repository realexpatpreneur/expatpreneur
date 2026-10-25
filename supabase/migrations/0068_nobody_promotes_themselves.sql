-- Nobody promotes themselves.
-- Run after 0067_complimentary_and_circles.sql.
--
-- profiles_self_write lets a member update their own row, and the grant
-- on profiles covers every column, so a member could change plan to
-- paid, or status from invited to active, with one request to the data
-- API using their own access token. Membership beginning at payment
-- rests on that status, so that was the way around it, and the same
-- request would now hand somebody complimentary membership.
--
-- A column grant cannot say unless an admin, so this is a trigger. It
-- is deliberately not security definer: the function needs to see the
-- role it was called as, and a definer function would always see the
-- owner. Admins keep the Members page, and the service role, which is
-- what the Stripe webhook and the invitation flow use, is not touched.

create or replace function profiles_no_self_promotion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Only the two roles a browser can reach are asked anything.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  -- An admin of the Village the row is in, or is moving to, may set
  -- all of it. That is the Members page.
  if is_admin(old.village_id) or is_admin(new.village_id) then
    return new;
  end if;

  if new.plan is distinct from old.plan then
    raise exception 'A plan changes by paying, or by an admin.';
  end if;

  if new.complimentary       is distinct from old.complimentary
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

  -- Two changes of status are a member's own: finishing onboarding, and
  -- leaving. An invited applicant making themselves active without
  -- paying is not one of them.
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

comment on function profiles_no_self_promotion() is
  'Keeps the columns that decide access out of a member''s own hands. '
  'Admins and the service role pass straight through.';
