-- Who decides an application, and when a Village is too full of one nationality

-- ======================================================== the two stages

-- /apply/status describes four stages. Two of them could never happen.
-- Nothing in the codebase or in the other eighty three migrations ever
-- wrote with_local or recommended: every single occurrence was a read or
-- a filter. The only writes were approved, waitlisted and declined. So a
-- person checking their request was told "The Local Admins of the city
-- you named are reading it" and "Your Village recommended you. The final
-- word is being given" about states the product had no way of reaching,
-- and /admin/applications had a tab filtering for one of them and
-- counted the other as decided.

-- They mean something now.
--   new           no Village yet, so it is the Global team's to route
--   with_local    a Village is attached and its Local Admins are reading
--   recommended   the Local Admins raised a tricky one for the Global team
-- then approved, waitlisted or declined, by either.

-- with_local follows from a Village being attached rather than from
-- anybody pressing anything. An application already arrives carrying a
-- village_id when the city matches a Village, so most never sit at new
-- at all, and 0073 noted that having no Village is the normal case
-- rather than the edge one. Doing it this way also means it cannot be
-- moved by the wrong person opening the page.
create or replace function application_reaches_the_village()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.village_id is not null and new.status = 'new' then
    new.status := 'with_local';
  end if;
  return new;
end;
$$;

drop trigger if exists application_reaches_the_village on applications;
create trigger application_reaches_the_village
  before insert or update on applications
  for each row execute function application_reaches_the_village();

-- ================================================== the balance limit

-- settings has carried three rows about this since 0030 and nothing has
-- ever read two of them. nationality_limit, thirty, "No Village may be
-- more than this percent of one nationality." nationality_from_size,
-- thirty, "The rule starts applying once a Village has this many
-- members." /admin/mix read the first to draw a marker and read the
-- second into a variable it never used, and told an admin "When a
-- nationality reaches it, new requests from that nationality wait until
-- the balance allows." Nothing waited. There was no check in the
-- approval path, no trigger, no constraint.

-- It blocks now.

-- from_size is why the rule does not make a new Village unstartable. The
-- second member of a two person Village is a hundred percent of
-- something. The rule holds its tongue until the Village is big enough
-- for a share to mean anything, which is the number that row has been
-- waiting to be asked for.

-- A Local Admin who is stopped by this raises the case through
-- recommended and the Global team decides. When the Global team decides
-- to go ahead, that is recorded on the row rather than waved through
-- invisibly, which is also what makes this enforceable against the
-- service connection: approveApplication authorises with requireAdmin
-- and then writes with the service key, so auth.uid() is null by the
-- time any trigger runs and is_global_admin() would be false for
-- everybody. A column says who cleared it; a session cannot.
alter table applications
  add column if not exists nationality_cleared_by uuid references profiles(id);
alter table applications
  add column if not exists nationality_cleared_at timestamptz;

comment on column applications.nationality_cleared_by is
  'The Global Admin who decided to approve this over the balance limit. '
  'Null means the limit applies.';

-- Null when there is room, otherwise the nationality that would go over.
-- The count matches village_nationality_mix in 0030: by people, with
-- somebody holding two nationalities counted under both, so the shares
-- can add up to more than a hundred and each is read on its own.
create or replace function nationality_over_the_limit(
  p_village uuid, p_nationalities text[]
) returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  cap        numeric;
  from_size  int;
  people     int;
  candidate  text;
begin
  if p_village is null or p_nationalities is null or array_length(p_nationalities, 1) is null then
    return null;
  end if;

  select coalesce((select value::numeric from settings where key = 'nationality_limit'), 30)
    into cap;
  select coalesce((select value::int from settings where key = 'nationality_from_size'), 30)
    into from_size;

  select count(*)::int into people
    from profiles
   where village_id = p_village and status = 'active';

  -- Too small for a share to mean anything yet.
  if people + 1 < from_size then
    return null;
  end if;

  select n.nationality into candidate
    from unnest(p_nationalities) as n(nationality)
   where (
     100.0 * (
       1 + (
         select count(*)
           from profiles p
           cross join lateral unnest(p.nationalities) as m(nationality)
          where p.village_id = p_village
            and p.status = 'active'
            and m.nationality = n.nationality
       )
     ) / (people + 1)
   ) > cap
   order by n.nationality
   limit 1;

  return candidate;
end;
$$;

comment on function nationality_over_the_limit(uuid, text[]) is
  'The nationality that approving this person would push above '
  'settings.nationality_limit, or null when there is room. Silent until '
  'the Village reaches settings.nationality_from_size.';

grant execute on function nationality_over_the_limit(uuid, text[]) to authenticated;

-- The backstop. The screen checks first and says something useful; this
-- is here because a rule of the product belongs in the database, which
-- is the same reason 0080 put the fifty seat cap in a trigger rather
-- than trusting the form.
create or replace function approval_respects_the_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  over text;
begin
  if new.status <> 'approved' or old.status = 'approved' then
    return new;
  end if;

  if new.nationality_cleared_by is not null then
    return new;
  end if;

  over := nationality_over_the_limit(new.village_id, new.nationalities);

  if over is not null then
    raise exception
      'Approving this would put % above the balance limit for this Village. The Global team can decide it.', over;
  end if;

  return new;
end;
$$;

drop trigger if exists approval_respects_the_balance on applications;
create trigger approval_respects_the_balance
  before update on applications
  for each row execute function approval_respects_the_balance();
