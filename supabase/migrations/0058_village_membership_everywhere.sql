-- 0058_village_membership_everywhere.sql
--
-- The site called the paid tier by two names. Migration 0056 named the
-- plans Explorer and Village Member, which is her name for them, but the
-- words "the paid plan" and "paid members" stayed in the copy, in the
-- code and in the published pages.
--
-- The code side is in this same commit. This is the database side: the
-- plan's own blurb, and the five sentences in published pages that still
-- used the old words.
--
-- Each replacement matches the exact sentence it replaces, so a page
-- somebody has already edited by hand is left alone.
--
-- Safe to run more than once.

update plans
set blurb = 'The one paid tier. Members take it when their business starts needing the other cities.'
where slug = 'paid'
  and blurb = 'The one paid plan. Members take it when their business starts needing the other cities.';

-- The home page.
update pages
set blocks = replace(
      blocks::text,
      'Membership itself is free; the paid plan adds every Village,',
      'Explorer membership is free; Village Membership adds every Village,'
    )::jsonb
where blocks::text like '%Membership itself is free; the paid plan adds every Village,%';

-- Learning.
update pages
set blocks = replace(
      blocks::text,
      'Paid members can apply to become educators',
      'Village Members can apply to become educators'
    )::jsonb
where blocks::text like '%Paid members can apply to become educators%';

-- The membership page, three sentences.
update pages
set blocks = replace(
      blocks::text,
      'you can upgrade to the paid plan at any time.',
      'you can upgrade to Village Membership at any time.'
    )::jsonb
where blocks::text like '%you can upgrade to the paid plan at any time.%';

update pages
set blocks = replace(
      blocks::text,
      'One paid plan, Village Member, adds every Village.',
      'There is one paid tier, Village Membership, which adds every Village.'
    )::jsonb
where blocks::text like '%One paid plan, Village Member, adds every Village.%';

update pages
set blocks = replace(
      blocks::text,
      'The paid plan is optional, for reaching every Village.',
      'Village Membership is optional, for reaching every Village.'
    )::jsonb
where blocks::text like '%The paid plan is optional, for reaching every Village.%';

-- The terms of membership, a heading and the clause under it.
update pages
set blocks = replace(
      blocks::text,
      '## Paid membership\nThe paid plan is priced in the currency of your own Village',
      '## Village Membership\nVillage Membership is priced in the currency of your own Village'
    )::jsonb
-- strpos rather than like: a backslash is like's own escape character, so
-- the newline inside the stored JSON would never match a like pattern.
where strpos(blocks::text,
             '## Paid membership\nThe paid plan is priced in the currency of your own Village') > 0;
