-- 0063_community_preview.sql
--
-- A visitor gets a preview of the community instead of its Directory:
-- how many members there are, where they are from, what they do, and a
-- few members who chose to be listed.
--
-- These are counts, never rows. They read every active member rather
-- than only the publicly listed ones, which is the whole point, so they
-- run as the owner. Nothing here can return a person.
--
-- One care. Migration 0015 took nationalities away from members on
-- purpose. A mix over a small Village would hand them back, because
-- three members and one Malagasy entry names somebody. So the mix is
-- network wide rather than per Village, and a nationality held by fewer
-- than three members is left out of it.
--
-- Safe to run more than once.

create or replace view public_village_members as
select
  v.id   as village_id,
  v.slug,
  v.name,
  v.status,
  count(p.id)::int as members
from villages v
left join profiles p
  on p.village_id = v.id and p.status = 'active'
group by v.id, v.slug, v.name, v.status;

alter view public_village_members set (security_invoker = off);
grant select on public_village_members to anon, authenticated;

create or replace view public_nationalities as
select n.nationality, count(*)::int as members
from profiles p, lateral unnest(p.nationalities) as n(nationality)
where p.status = 'active'
  and n.nationality is not null
  and n.nationality <> ''
group by n.nationality
having count(*) >= 3;

alter view public_nationalities set (security_invoker = off);
grant select on public_nationalities to anon, authenticated;

create or replace view public_industries as
select p.industry, count(*)::int as members
from profiles p
where p.status = 'active'
  and p.industry is not null
  and p.industry <> ''
group by p.industry;

alter view public_industries set (security_invoker = off);
grant select on public_industries to anon, authenticated;
