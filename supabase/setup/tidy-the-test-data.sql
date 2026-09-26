-- Tidying what is on the live site.
--
-- Read each block before you run it. Every one is written so you can
-- see what it will touch first, and none of them deletes a person.

-- 1. The profile showing publicly on Discover as cdcxzc.
--    It is your own account, the one you signed in with, so it is not
--    deleted. This takes it off the public site and gives it a real
--    name. Change the name and headline to whatever you want to appear.

select id, full_name, headline, email, public_profile
from profiles
where full_name = 'cdcxzc' or headline = 'sdfdsf';

update profiles
set full_name = 'Kristiane Charrier',
    headline = 'Founder, ExpatPreneurs Global',
    public_profile = false
where email = 'realexpatpreneur@gmail.com';

-- 2. The nationality that reads dfdsd in the Village mix flag.
--    See what is there, then clear the nonsense.

select id, full_name, nationalities from profiles
where nationalities is not null and nationalities <> '{}';

update profiles
set nationalities = '{}'
where 'dfdsd' = any(nationalities);

-- 3. Circles all read "opens when a Circle reaches 45 members" because
--    none is marked open. Look first, then open the ones that are
--    really running.

select c.id, c.name, v.name as village, c.status
from circles c join villages v on v.id = c.village_id
order by v.name, c.name;

update circles
set status = 'open'
where village_id = (select id from villages where slug = 'dubai')
  and name = 'Circle 01';

-- 4. Anything else left over from testing. This only shows you; it
--    deletes nothing.

select 'applications' as table_name, count(*) from applications
union all select 'asks', count(*) from asks
union all select 'events', count(*) from events
union all select 'businesses', count(*) from businesses
union all select 'suggestions', count(*) from suggestions
union all select 'reports', count(*) from reports;