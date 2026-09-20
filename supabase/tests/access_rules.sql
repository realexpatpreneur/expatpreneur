-- ExpatPreneurs Global: the access rules, checked
--
-- Run this in the Supabase SQL editor after any migration that touches a
-- policy, a grant or a role. It makes its own people and Villages, checks
-- what each of them can see, and rolls the whole lot back. Nothing it
-- makes survives, and nothing real is touched.
--
-- It finishes by returning a table. Read the first column: FAILED means
-- somebody can see something they should not, or cannot see something
-- they should. Failures are listed first, so if the top row says ok, all
-- of it passed.

begin;

-- ------------------------------------------------------------ the cast
--
-- Two Villages. A free member and an admin in one, a paid member in the
-- other, and somebody who left.

insert into villages (id, slug, name, city, country, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'test-alpha', 'Alpha', 'Alpha', 'Testland', 'open'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'test-beta',  'Beta',  'Beta',  'Testland', 'open');

-- Profiles hang off auth.users, so the test people need to exist there
-- first. Both go back at the end with everything else.
insert into auth.users (id, email) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'free@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'paid@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'admin@test.invalid'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'left@test.invalid');

insert into profiles (id, full_name, email, phone, status, plan, village_id, public_profile, nationalities)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Free Alpha',  'free@test.invalid',  '+100000001', 'active', 'member', 'aaaaaaaa-0000-0000-0000-000000000001', false, array['Testish']),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Paid Beta',   'paid@test.invalid',  '+100000002', 'active', 'paid',   'aaaaaaaa-0000-0000-0000-000000000002', true,  array['Testish']),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Admin Alpha', 'admin@test.invalid', '+100000003', 'active', 'member', 'aaaaaaaa-0000-0000-0000-000000000001', false, array['Testish']),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Left Alpha',  'left@test.invalid',  '+100000004', 'left',   'member', 'aaaaaaaa-0000-0000-0000-000000000001', true,  array['Testish']);

insert into member_roles (profile_id, role, scope, scope_id)
values ('bbbbbbbb-0000-0000-0000-000000000003', 'local_admin', 'village', 'aaaaaaaa-0000-0000-0000-000000000001');

-- Something to look at in each Village.
insert into asks (id, author_id, village_id, kind, title, body, status)
values
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'ask', 'Alpha ask', 'Body', 'open'),
  ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'ask', 'Beta ask',  'Body', 'open');

-- ------------------------------------------------------------ the checks

create or replace function pg_temp.as_person(who uuid) returns void
language plpgsql as $$
begin
  execute format('set local role authenticated');
  execute format('set local request.jwt.claim.sub = %L', who);
  execute format('set local request.jwt.claims = %L',
    json_build_object('sub', who, 'role', 'authenticated')::text);
end $$;

create or replace function pg_temp.as_stranger() returns void
language plpgsql as $$
begin
  set local role anon;
  set local request.jwt.claim.sub = '';
end $$;

-- The results are collected rather than printed, because the SQL editor
-- shows tables and swallows notices.
create temporary table test_results (
  seq      serial,
  verdict  text,
  rule     text,
  expected boolean,
  got      boolean
) on commit drop;

-- The checks run while the session is pretending to be a member or a
-- stranger, so those roles need to be able to write their result down.
grant all on test_results to public;
grant all on sequence test_results_seq_seq to public;

create or replace function pg_temp.check(what text, got boolean, expected boolean)
returns void language plpgsql as $$
begin
  insert into test_results (verdict, rule, expected, got)
  values (case when got = expected then 'ok' else 'FAILED' end, what, expected, got);
end $$;

create or replace function pg_temp.can_read(query text)
returns boolean language plpgsql as $$
declare n int;
begin
  execute query into n;
  return coalesce(n, 0) > 0;
exception when others then
  return false;
end $$;

do $$
declare
  free  uuid := 'bbbbbbbb-0000-0000-0000-000000000001';
  paid  uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
  admin uuid := 'bbbbbbbb-0000-0000-0000-000000000003';
begin
  insert into test_results (verdict, rule) values ('', '--- a member''s private columns ---');

  perform pg_temp.as_person(free);
  perform pg_temp.check(
    'a member cannot read anybody''s email through profiles',
    pg_temp.can_read('select count(*) from profiles where email is not null'),
    false);
  perform pg_temp.check(
    'a member cannot read anybody''s phone through profiles',
    pg_temp.can_read('select count(*) from profiles where phone is not null'),
    false);
  perform pg_temp.check(
    'a member can read their own record through member_records',
    pg_temp.can_read(format('select count(*) from member_records where id = %L', free)),
    true);
  perform pg_temp.check(
    'a member cannot read another member''s record through member_records',
    pg_temp.can_read(format('select count(*) from member_records where id = %L', paid)),
    false);
  reset role;

  perform pg_temp.as_person(admin);
  perform pg_temp.check(
    'a Local Admin can read the records of their own Village',
    pg_temp.can_read(format('select count(*) from member_records where id = %L', free)),
    true);
  perform pg_temp.check(
    'a Local Admin cannot read the records of another Village',
    pg_temp.can_read(format('select count(*) from member_records where id = %L', paid)),
    false);
  reset role;

  insert into test_results (verdict, rule) values ('', '--- who can see whom ---');

  perform pg_temp.as_person(free);
  perform pg_temp.check(
    'a free member sees their own Village',
    pg_temp.can_read(format('select count(*) from profiles where id = %L', admin)),
    true);
  reset role;

  perform pg_temp.as_person(paid);
  perform pg_temp.check(
    'a paid member sees other Villages',
    pg_temp.can_read(format('select count(*) from profiles where id = %L', free)),
    true);
  reset role;

  insert into test_results (verdict, rule) values ('', '--- Ask and Offer stays in its Village ---');

  perform pg_temp.as_person(free);
  perform pg_temp.check(
    'a free member reads their own Village''s asks',
    pg_temp.can_read('select count(*) from asks where village_id = ''aaaaaaaa-0000-0000-0000-000000000001'''),
    true);
  perform pg_temp.check(
    'a free member does not read another Village''s asks',
    pg_temp.can_read('select count(*) from asks where village_id = ''aaaaaaaa-0000-0000-0000-000000000002'''),
    false);
  reset role;

  insert into test_results (verdict, rule) values ('', '--- the workspaces ---');

  perform pg_temp.as_person(free);
  perform pg_temp.check(
    'a member cannot read the audit log',
    pg_temp.can_read('select count(*) from audit_log'),
    false);
  perform pg_temp.check(
    'a member cannot read applications',
    pg_temp.can_read('select count(*) from applications'),
    false);
  perform pg_temp.check(
    'a member cannot read reports',
    pg_temp.can_read('select count(*) from reports'),
    false);
  reset role;

  insert into test_results (verdict, rule) values ('', '--- a stranger ---');

  perform pg_temp.as_stranger();
  perform pg_temp.check(
    'a stranger reads the Villages',
    pg_temp.can_read('select count(*) from villages'),
    true);
  perform pg_temp.check(
    'a stranger reads a public profile',
    pg_temp.can_read('select count(*) from profiles where public_profile'),
    true);
  perform pg_temp.check(
    'a stranger cannot read a private profile',
    pg_temp.can_read(format('select count(*) from profiles where id = %L', free)),
    false);
  perform pg_temp.check(
    'a stranger cannot read any email',
    pg_temp.can_read('select count(*) from profiles where email is not null'),
    false);
  perform pg_temp.check(
    'a stranger cannot read a Circle WhatsApp link',
    pg_temp.can_read('select count(*) from circles where whatsapp_url is not null'),
    false);
  perform pg_temp.check(
    'a stranger cannot read messages',
    pg_temp.can_read('select count(*) from messages'),
    false);
  perform pg_temp.check(
    'a stranger cannot read asks',
    pg_temp.can_read('select count(*) from asks'),
    false);
  reset role;

end $$;

-- Failures first, then everything in the order it was checked.
select
  verdict,
  rule,
  case when verdict = 'FAILED' then format('expected %s, got %s', expected, got) end as detail
from test_results
order by case when verdict = 'FAILED' then 0 else 1 end, seq;

rollback;