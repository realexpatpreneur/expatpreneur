-- ExpatPreneurs Global: the Local Admin's own pages
-- Four screens from the prototype that were never built: the Overview the
-- workspace opens on, the Village mix with its Circle level check, the
-- Local Admin's own Reports inbox, and Leadership, for spotting members
-- who could take on more.
-- Run after 0029_shows_and_newsletter.sql.

-- ------------------------------------------------- the nationality rule

-- The rule is the same for every Village, but when it starts to apply is
-- a number Kristiane has not settled, so it lives in settings.
insert into settings (key, value, note) values
  ('nationality_limit',     '30', 'No Village may be more than this percent of one nationality.'),
  ('nationality_from_size', '30', 'The rule starts applying once a Village has this many members.'),
  ('balance_circles',       'on', 'Also balance each Circle, and flag one above the limit.')
on conflict (key) do nothing;

-- The mix, counted by people rather than by nationality entries. The
-- original view divided by the number of entries, so in a Village where
-- members hold two nationalities every share came out lower than it is.
-- The 30 percent rule is only as good as this sum.
-- Replacing rather than creating, because the column list changes.
drop view if exists village_nationality_mix cascade;
create view village_nationality_mix as
with headcount as (
  select village_id, count(*)::int as people
  from profiles
  where status = 'active' and village_id is not null
  group by village_id
),
spread as (
  select p.village_id, n.nationality, count(*)::int as members
  from profiles p
  cross join lateral unnest(p.nationalities) as n(nationality)
  where p.status = 'active' and p.village_id is not null
  group by p.village_id, n.nationality
)
select
  s.village_id,
  v.name as village,
  s.nationality,
  s.members,
  h.people,
  round(100.0 * s.members / nullif(h.people, 0), 1) as percent
from spread s
join headcount h on h.village_id = s.village_id
join villages v on v.id = s.village_id;

-- The same figure inside each Circle, which the build never had. A Circle
-- can sit well over the limit while the Village as a whole looks fine.
drop view if exists circle_mix cascade;
create view circle_mix as
with headcount as (
  select circle_id, count(*)::int as people
  from profiles
  where status in ('active', 'onboarding') and circle_id is not null
  group by circle_id
),
spread as (
  select p.circle_id, n.nationality, count(*)::int as members
  from profiles p
  cross join lateral unnest(p.nationalities) as n(nationality)
  where p.status in ('active', 'onboarding') and p.circle_id is not null
  group by p.circle_id, n.nationality
)
select
  s.circle_id,
  c.village_id,
  c.name as circle_name,
  s.nationality,
  s.members,
  h.people,
  round(100.0 * s.members / nullif(h.people, 0), 1) as percent
from spread s
join headcount h on h.circle_id = s.circle_id
join circles c on c.id = s.circle_id;

-- ----------------------------------------------------- spotting leaders

create table if not exists leadership_suggestions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  village_id  uuid references villages(id) on delete set null,
  suggested_by uuid references profiles(id) on delete set null,
  role        app_role not null,
  why         text,
  status      suggestion_status not null default 'new',
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (profile_id, role)
);
drop trigger if exists leadership_suggestions_updated on leadership_suggestions;
create trigger leadership_suggestions_updated before update on leadership_suggestions
  for each row execute function set_updated_at();

alter table leadership_suggestions enable row level security;

-- A Local Admin suggests somebody in their own Village. The Global team
-- decides, because roles are theirs to give.
drop policy if exists leadership_suggest on leadership_suggestions;
create policy leadership_suggest on leadership_suggestions
  for insert with check (is_admin(village_id));
drop policy if exists leadership_read on leadership_suggestions;
create policy leadership_read on leadership_suggestions
  for select using (is_admin(village_id) or is_global_admin());
drop policy if exists leadership_decide on leadership_suggestions;
create policy leadership_decide on leadership_suggestions
  for update using (is_global_admin()) with check (is_global_admin());