-- 0071_no_madrid_village.sql
--
-- Madrid is not a Village that is being opened, so it comes off the public
-- site: the footer, the home page, the Villages page and the invitation
-- form all list Villages whose status is open, launching or exploring.
--
-- The row stays where it is. It keeps its slug, its name and anything
-- already attached to it, and moves to the archived status the Global admin
-- screen already offers, so a person can put it back from that screen
-- without a migration. Any member, Circle or event against it is untouched.
--
-- The one page that names Madrid in its own words is Discover, whose
-- closing band carries the sentence as text. That sentence is replaced with
-- the wording the rest of the site uses for cities that are not yet named.
--
-- Safe to run more than once.

update villages
   set status = 'archived',
       updated_at = now()
 where slug = 'madrid'
   and status is distinct from 'archived';

-- The Discover band. The replace runs over the stored blocks as text, so it
-- reaches the sentence wherever in that page it sits, and matches nothing
-- once it has run.
update pages
   set blocks = replace(
         blocks::text,
         '"Madrid is being explored."',
         '"More cities are being explored."'
       )::jsonb,
       updated_at = now()
 where blocks::text like '%Madrid is being explored.%';
