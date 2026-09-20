-- ExpatPreneurs Global: is the database what the migrations say?
--
-- Read-only. Nothing is created and nothing is changed. It returns a
-- table: FAILED means the migration that should have done this has not
-- run here, or something undid it.

with checks as (

  -- 0030: the Village mix counts people, not nationality entries. The
  -- rebuilt view carries a people column; the old one did not.
  select 1 as seq,
    'the Village mix counts people, not nationality entries' as rule,
    exists (
      select 1 from information_schema.columns
      where table_name = 'village_nationality_mix' and column_name = 'people'
    ) as got, true as expected

  union all
  -- 0030: the Circle level figure exists at all.
  select 2,
    'the Circle mix exists',
    exists (select 1 from information_schema.views where table_name = 'circle_mix'),
    true

  union all
  select 3,
    'the Circle mix counts people too',
    exists (
      select 1 from information_schema.columns
      where table_name = 'circle_mix' and column_name = 'people'
    ),
    true

  union all
  -- 0033: the grants are written down rather than inherited.
  select 4,
    'the newest tables are granted to signed in members',
    (
      select count(*) = 3 from information_schema.role_table_grants
      where grantee = 'authenticated'
        and privilege_type = 'SELECT'
        and table_name in ('photo_uses', 'leadership_suggestions', 'educator_profiles')
    ),
    true

  union all
  select 5,
    'the public may read an educator profile',
    exists (
      select 1 from information_schema.role_table_grants
      where grantee = 'anon' and privilege_type = 'SELECT'
        and table_name = 'educator_profiles'
    ),
    true

  union all
  -- 0015 and 0024: the privacy work is still in place. These four tables
  -- must NOT have been re-granted wholesale.
  select 6,
    'nobody signed in may select every column of profiles',
    not exists (
      select 1 from information_schema.role_table_grants
      where grantee = 'authenticated' and privilege_type = 'SELECT'
        and table_name = 'profiles'
    ),
    true

  union all
  select 7,
    'a stranger cannot select every column of profiles',
    not exists (
      select 1 from information_schema.role_table_grants
      where grantee = 'anon' and privilege_type = 'SELECT'
        and table_name = 'profiles'
    ),
    true

  union all
  -- Every table carries row level security. One without it is open to
  -- anybody holding a key.
  select 8,
    'every table has row level security switched on',
    not exists (
      select 1 from pg_tables
      where schemaname = 'public' and not rowsecurity
    ),
    true

  union all
  -- The migrations that should have run.
  select 9,
    'the mix, photograph and grant migrations have all run',
    (
      exists (select 1 from information_schema.tables where table_name = 'photo_uses')
      and exists (select 1 from information_schema.tables where table_name = 'leadership_suggestions')
      and exists (select 1 from information_schema.tables where table_name = 'educator_profiles')
    ),
    true
)

select
  case when got = expected then 'ok' else 'FAILED' end as verdict,
  rule,
  case when got <> expected then 'this has not been applied here' end as detail
from checks
order by case when got = expected then 1 else 0 end, seq;