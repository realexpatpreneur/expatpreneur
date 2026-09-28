-- The third number the prototype's Village page shows.
--
-- The page has three stat blocks: Members, Circles, Nationalities. The
-- view only counted the first two, so the third had nowhere to come
-- from. Counted server side, like the other two, because a visitor
-- cannot read the profiles table.
--
-- This is a count of distinct nationalities. It never says which ones,
-- and the 30 percent rule is not visible here or anywhere public.

create or replace view village_public_counts as
  select
    v.id as village_id,
    v.slug,
    (select count(*) from profiles p
      where p.village_id = v.id and p.status = 'active') as members,
    (select count(*) from circles c
      where c.village_id = v.id) as circles,
    (select count(distinct n) from profiles p
       cross join lateral unnest(p.nationalities) as n
      where p.village_id = v.id and p.status = 'active') as nationalities
  from villages v;

grant select on village_public_counts to anon, authenticated;