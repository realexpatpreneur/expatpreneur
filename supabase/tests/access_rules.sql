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

-- Something published and something still a draft, on both the page
-- editor and the marketplace.
insert into pages (slug, title, path, status) values
  ('test-live',  'Test live',  '/test-live',  'live'),
  ('test-draft', 'Test draft', '/test-draft', 'draft');

insert into businesses (slug, owner_id, village_id, name, public, hidden)
values
  ('test-open',   'bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'Test Open',   true,  false),
  ('test-hidden', 'bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'Test Hidden', true,  true);

insert into newsletter_signups (email, source) values ('someone@test.invalid', 'test');

insert into payouts (person_id, kind, period_start, period_end, gross_cents, share, net_cents, currency)
values ('bbbbbbbb-0000-0000-0000-000000000002', 'recognition', '2026-09-01', '2026-09-30', 5000, 100, 5000, 'EUR');

-- ------------------------------------------------------------ the checks

create or replace function pg_temp.as_person(who uuid) returns void
language plpgsql as $$
begin
  execute format('set local role authenticated');
  execute format('set local request.jwt.claim.sub = %L', who);
  execute format('set local request.jwt.claims = %L',
    json_build_object('sub', who, 'role', 'authenticated')::text);
end $$;

-- Supabase reads identity from two settings and falls back from one to
-- the other, so becoming a stranger means clearing both. Clearing one and
-- not the other leaves the last person still signed in, which is how this
-- test first lied to itself.
create or replace function pg_temp.as_stranger() returns void
language plpgsql as $$
begin
  set local role anon;
  set local request.jwt.claim.sub = '';
  set local request.jwt.claims = '';
end $$;

-- Who the database thinks is asking. Every section checks this first, so
-- a result can never be read as the wrong person's.
create or replace function pg_temp.whoami()
returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub'
  )::uuid
$$;

-- Runs a count as whoever the session is pretending to be. A refusal is
-- an answer, not an error, so it comes back as false.
create or replace function pg_temp.can_read(query text)
returns boolean language plpgsql as $$
declare n int;
begin
  execute query into n;
  return coalesce(n, 0) > 0;
exception when others then
  return false;
end $$;

-- One rule, checked. A row rather than a printed line.
create or replace function pg_temp.verdict(what text, got boolean, expected boolean)
returns table (verdict text, rule text, detail text)
language sql as $$
  select
    case when got = expected then 'ok' else 'FAILED' end,
    what,
    case when got <> expected then format('expected %s, got %s', expected, got) end
$$;

-- The results come back from a function rather than a table, so the
-- editor has nothing to warn about and nothing is created that could
-- outlive the transaction.
create or replace function pg_temp.checks()
returns table (verdict text, rule text, detail text)
language plpgsql as $fn$
declare
  free  uuid := 'bbbbbbbb-0000-0000-0000-000000000001';
  paid  uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
  admin uuid := 'bbbbbbbb-0000-0000-0000-000000000003';
begin
  return query select ''::text, '--- a member''s private columns ---'::text, null::text;

  perform pg_temp.as_person(free);
  return query select * from pg_temp.verdict(
    'the test is signed in as the member it thinks it is',
    pg_temp.whoami() = free, true);
  return query select * from pg_temp.verdict(
    'a member cannot read anybody''s email through profiles',
    pg_temp.can_read('select count(*) from profiles where email is not null'),
    false);
  return query select * from pg_temp.verdict(
    'a member cannot read anybody''s phone through profiles',
    pg_temp.can_read('select count(*) from profiles where phone is not null'),
    false);
  return query select * from pg_temp.verdict(
    'a member can read their own record through member_records',
    pg_temp.can_read(format('select count(*) from member_records where id = %L', free)),
    true);
  return query select * from pg_temp.verdict(
    'a member cannot read another member''s record through member_records',
    pg_temp.can_read(format('select count(*) from member_records where id = %L', paid)),
    false);
  reset role;

  perform pg_temp.as_person(admin);
  return query select * from pg_temp.verdict(
    'the test is signed in as the admin it thinks it is',
    pg_temp.whoami() = admin, true);
  return query select * from pg_temp.verdict(
    'a Local Admin can read the records of their own Village',
    pg_temp.can_read(format('select count(*) from member_records where id = %L', free)),
    true);
  return query select * from pg_temp.verdict(
    'a Local Admin cannot read the records of another Village',
    pg_temp.can_read(format('select count(*) from member_records where id = %L', paid)),
    false);
  reset role;

  return query select ''::text, '--- who can see whom ---'::text, null::text;

  perform pg_temp.as_person(free);
  return query select * from pg_temp.verdict(
    'a free member sees their own Village',
    pg_temp.can_read(format('select count(*) from profiles where id = %L', admin)),
    true);
  reset role;

  perform pg_temp.as_person(paid);
  return query select * from pg_temp.verdict(
    'a paid member sees other Villages',
    pg_temp.can_read(format('select count(*) from profiles where id = %L', free)),
    true);
  reset role;

  return query select ''::text, '--- Ask and Offer stays in its Village ---'::text, null::text;

  perform pg_temp.as_person(free);
  return query select * from pg_temp.verdict(
    'a free member reads their own Village''s asks',
    pg_temp.can_read('select count(*) from asks where village_id = ''aaaaaaaa-0000-0000-0000-000000000001'''),
    true);
  return query select * from pg_temp.verdict(
    'a free member does not read another Village''s asks',
    pg_temp.can_read('select count(*) from asks where village_id = ''aaaaaaaa-0000-0000-0000-000000000002'''),
    false);
  reset role;

  return query select ''::text, '--- the workspaces ---'::text, null::text;

  perform pg_temp.as_person(free);
  return query select * from pg_temp.verdict(
    'a member cannot read the audit log',
    pg_temp.can_read('select count(*) from audit_log'),
    false);
  return query select * from pg_temp.verdict(
    'a member cannot read applications',
    pg_temp.can_read('select count(*) from applications'),
    false);
  return query select * from pg_temp.verdict(
    'a member cannot read reports',
    pg_temp.can_read('select count(*) from reports'),
    false);
  reset role;

  return query select ''::text, '--- money and mailing lists ---'::text, null::text;

  perform pg_temp.as_person(free);
  return query select * from pg_temp.verdict(
    'a member cannot read the email templates',
    pg_temp.can_read('select count(*) from email_templates'),
    false);
  return query select * from pg_temp.verdict(
    'a member cannot read somebody else''s payout',
    pg_temp.can_read('select count(*) from payouts'),
    false);
  return query select * from pg_temp.verdict(
    'a member cannot read the newsletter list',
    pg_temp.can_read('select count(*) from newsletter_signups'),
    false);
  return query select * from pg_temp.verdict(
    'a member cannot read enquiries sent to somebody else''s business',
    pg_temp.can_read('select count(*) from business_enquiries'),
    false);
  reset role;

  return query select ''::text, '--- a stranger ---'::text, null::text;

  perform pg_temp.as_stranger();
  return query select * from pg_temp.verdict(
    'the test is nobody at all, not the last person it pretended to be',
    pg_temp.whoami() is null, true);
  return query select * from pg_temp.verdict(
    'a stranger reads the Villages',
    pg_temp.can_read('select count(*) from villages'),
    true);
  return query select * from pg_temp.verdict(
    'a stranger reads a public profile',
    pg_temp.can_read('select count(*) from profiles where public_profile'),
    true);
  return query select * from pg_temp.verdict(
    'a stranger cannot read a private profile',
    pg_temp.can_read(format('select count(*) from profiles where id = %L', free)),
    false);
  return query select * from pg_temp.verdict(
    'a stranger cannot read any email',
    pg_temp.can_read('select count(*) from profiles where email is not null'),
    false);
  return query select * from pg_temp.verdict(
    'a stranger cannot read a Circle WhatsApp link',
    pg_temp.can_read('select count(*) from circles where whatsapp_url is not null'),
    false);
  return query select * from pg_temp.verdict(
    'a stranger cannot read messages',
    pg_temp.can_read('select count(*) from messages'),
    false);
  return query select * from pg_temp.verdict(
    'a stranger cannot read asks',
    pg_temp.can_read('select count(*) from asks'),
    false);
  return query select * from pg_temp.verdict(
    'a stranger reads a published page',
    pg_temp.can_read('select count(*) from pages where slug = ''test-live'''),
    true);
  return query select * from pg_temp.verdict(
    'a stranger cannot read a page still in draft',
    pg_temp.can_read('select count(*) from pages where slug = ''test-draft'''),
    false);
  return query select * from pg_temp.verdict(
    'a stranger reads a public business listing',
    pg_temp.can_read('select count(*) from businesses where slug = ''test-open'''),
    true);
  return query select * from pg_temp.verdict(
    'a stranger cannot read a listing the Global team took down',
    pg_temp.can_read('select count(*) from businesses where slug = ''test-hidden'''),
    false);
  return query select * from pg_temp.verdict(
    'a stranger cannot read the newsletter list',
    pg_temp.can_read('select count(*) from newsletter_signups'),
    false);
  return query select * from pg_temp.verdict(
    'a stranger reads the podcast show',
    pg_temp.can_read('select count(*) from shows'),
    true);
  reset role;
  return;
end $fn$;

-- Failures first, then everything in the order it was checked.
with results as (
  select row_number() over () as seq, * from pg_temp.checks()
)
select verdict, rule, detail
from results
order by case when verdict = 'FAILED' then 0 else 1 end, seq;

rollback;