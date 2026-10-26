-- 0072_newsletter_signup_properly.sql
--
-- Run after 0071_no_madrid_village.sql. Safe to run more than once.
--
-- Four faults in how a newsletter signup is stored.
--
-- One. anon holds a plain insert on a table whose email column is
-- unique, so a stranger holding the public anon key can POST an address
-- straight at the data API and tell 201 from 409. That enumerates who
-- is on the list, one address at a time, without ever touching the site
-- or its rate limit. Reading the rows was already shut; this is the
-- side channel underneath it.
--
-- Two. Somebody who unsubscribes and later signs up again can never be
-- put back. The signup is a bare insert, so it hits the unique
-- constraint and does nothing, and unsubscribed_at stays set forever.
-- There is no update policy either, so nothing could clear it.
--
-- Three. Nothing validated the address. An address with no @ in it was
-- stored and then refused by Flodesk, where only the server log saw it.
--
-- Four. confirmed_at was never written by anything.
--
-- The fix is one security definer function that owns the whole signup.
-- anon loses its direct insert and gets only the function, which means
-- the only thing a stranger can do is add an address, and the answer is
-- the same whether or not it was already there.

-- ------------------------------------------------------- the function

create or replace function newsletter_signup(
  p_email  text,
  p_source text default 'media'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean citext;
begin
  clean := lower(btrim(coalesce(p_email, '')));

  -- Enough of a check to keep rubbish out of the list. Anything more
  -- clever rejects addresses that are perfectly real.
  if clean !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'That does not look like an email address.'
      using errcode = 'check_violation';
  end if;

  if length(clean) > 254 then
    raise exception 'That address is too long.'
      using errcode = 'check_violation';
  end if;

  insert into newsletter_signups (email, source)
  values (clean, nullif(btrim(coalesce(p_source, '')), ''))
  on conflict (email) do update
    -- Signing up again is a fresh consent, so an old unsubscribe is
    -- cleared. The first source is kept: it is where they came from.
    set unsubscribed_at = null,
        source = coalesce(newsletter_signups.source, excluded.source);
end;
$$;

comment on function newsletter_signup(text, text) is
  'The only way in from the public side. Validates the address, and '
  'treats signing up again as a fresh consent that clears an earlier '
  'unsubscribe. Returns nothing, so it cannot be used to find out who '
  'is already on the list.';

revoke all on function newsletter_signup(text, text) from public;
grant execute on function newsletter_signup(text, text) to anon, authenticated;

-- ------------------------------------------------ close the direct way

revoke insert on newsletter_signups from anon;

-- A signed in member signing up is the same transaction as a stranger
-- doing it, so neither needs the table itself.
revoke insert on newsletter_signups from authenticated;

-- ------------------------------------------------ the Global team's own

-- Unsubscribes arrive through the service role, which is not touched by
-- policies, but the Global team needs to be able to correct a row by
-- hand and nothing allowed that.
drop policy if exists newsletter_global_write on newsletter_signups;
create policy newsletter_global_write on newsletter_signups
  for update using (is_global_admin()) with check (is_global_admin());

grant update (unsubscribed_at, confirmed_at, source) on newsletter_signups
  to authenticated;

-- The list is read by one person, sorted by when they arrived.
create index if not exists newsletter_signups_created_idx
  on newsletter_signups (created_at desc);
