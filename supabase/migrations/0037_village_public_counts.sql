-- How many members and Circles a Village has, for the public site.
--
-- A visitor cannot read the profiles table, so counting from it as a
-- visitor returns zero, which is why every Village card said "0 members
-- in 0 Circles". This view does the counting on the server side and
-- exposes nothing but the two numbers: no names, no rows, nothing that
-- identifies anybody.

create or replace view village_public_counts as
  select
    v.id as village_id,
    v.slug,
    (select count(*) from profiles p
      where p.village_id = v.id and p.status = 'active') as members,
    (select count(*) from circles c
      where c.village_id = v.id) as circles
  from villages v;

grant select on village_public_counts to anon, authenticated;