-- 0056_plan_names_and_published_prices.sql
--
-- Two things, both content.
--
-- 1. The plans take the names the Membership Offer and Access Framework
--    gives them: Explorer and Village Member.
--
-- 2. The old single network price comes out of the published pages. It
--    was written into the home page, the membership questions and the
--    terms of membership as 50 EUR a month or 500 EUR a year. Prices now
--    live per Village in village_plans, so those sentences quote a
--    starting figure and the terms point at the membership page instead
--    of naming an amount.
--
-- Each replacement matches the exact sentence it replaces, so a page
-- somebody has already edited by hand is left alone.
--
-- Safe to run more than once.

update plans set name = 'Explorer'
  where slug = 'member' and name is distinct from 'Explorer';

update plans set name = 'Village Member'
  where slug = 'paid' and name is distinct from 'Village Member';

-- The home page.
update pages
set blocks = replace(
      blocks::text,
      'the paid plan adds every Village, at 50 EUR a month or 500 EUR a year.',
      'the paid plan adds every Village, from 15 EUR or 59 AED a month in your own Village''s currency, while founding places last.'
    )::jsonb
where blocks::text like '%the paid plan adds every Village, at 50 EUR a month or 500 EUR a year.%';

-- The membership questions.
update pages
set blocks = replace(
      blocks::text,
      'One paid plan, Paid member, adds every Village at 50 EUR a month or 500 EUR a year.',
      'One paid plan, Village Member, adds every Village. It is priced in your own Village''s currency, from 15 EUR or 59 AED a month while founding places last.'
    )::jsonb
where blocks::text like '%One paid plan, Paid member, adds every Village at 50 EUR a month or 500 EUR a year.%';

-- The terms of membership. A legal page should not carry a figure that
-- differs by Village and changes when founding closes.
update pages
set blocks = replace(
      blocks::text,
      'The paid plan is 50 EUR a month or 500 EUR a year. It renews until you cancel, and you can cancel at any time from your settings.',
      'The paid plan is priced in the currency of your own Village and is shown on the membership page before you pay. It renews until you cancel, and you can cancel at any time from your settings, with access running to the end of the period already paid for.'
    )::jsonb
where blocks::text like '%The paid plan is 50 EUR a month or 500 EUR a year.%';
