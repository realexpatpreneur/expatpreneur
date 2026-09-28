-- The content from the approved prototype, put into the database.
--
-- Every word, price, name and number below is taken from the prototype
-- that was signed off, not invented here. It is the same three Villages,
-- the same two plans at 50 EUR a month and 500 a year, the same events,
-- businesses, courses, articles, videos, podcast episodes and library
-- that the design was approved with.
--
-- Safe to run twice. Everything is matched on its slug and updated
-- rather than duplicated.

-- ------------------------------------------------------------ plans

insert into plans (slug, name, blurb, price_cents, currency, interval, features, position, active)
values
  ('member', 'Member', 'Your own Village', 0, 'EUR', 'month', array[
     'Your Village and Circle, with its WhatsApp group',
     'Member Directory across all Villages',
     'Ask & Offer',
     'Events in your Village and online',
     'Guides, templates and workshop recordings',
     'Industry Groups and Pods',
     'Message members in your Village'
   ]::text[], 1, true),
  ('paid', 'Paid member', 'Every Village', 5000, 'EUR', 'month', array[
     'Everything included in Member',
     'Contact members in any Village',
     'Attend events in any Village with the ExpatPreneurs Passport',
     'Sell workshops on the Learning marketplace',
     'Promote your offers to the whole network',
     'The Directory of every Village',
     'Resources from every Village'
   ]::text[], 2, true)
on conflict (slug) do update set
  name = excluded.name,
  blurb = excluded.blurb,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  interval = excluded.interval,
  features = excluded.features,
  active = true;

-- The yearly price, two months free, as the prototype's switch says.
insert into settings (key, value)
values ('paid_yearly_cents', '50000')
on conflict (key) do update set value = excluded.value;

-- --------------------------------------------------------- villages

update villages set
  name = 'Dubai',
  city = 'Dubai',
  country = 'United Arab Emirates',
  status = 'open',
  summary = 'Founders from more than 25 countries meet here to swap local knowledge, make introductions and grow together. Monthly gatherings, a Circle to call home, and the whole network behind you.',
  timezone = 'Gulf Standard Time'
where slug = 'dubai';

insert into villages (slug, name, city, country, status, summary, timezone)
select 'dubai', 'Dubai', 'Dubai', 'United Arab Emirates',
       'open', 'Founders from more than 25 countries meet here to swap local knowledge, make introductions and grow together. Monthly gatherings, a Circle to call home, and the whole network behind you.', 'Gulf Standard Time'
where not exists (select 1 from villages where slug = 'dubai');

update villages set
  name = 'Lisbon',
  city = 'Lisbon',
  country = 'Portugal',
  status = 'launching',
  summary = 'Lisbon opens next month. Founders building in Portugal are already getting ready, and the Village will help anyone testing the Portuguese market, from licences to hiring.',
  timezone = 'Western European Time'
where slug = 'lisbon';

insert into villages (slug, name, city, country, status, summary, timezone)
select 'lisbon', 'Lisbon', 'Lisbon', 'Portugal',
       'launching', 'Lisbon opens next month. Founders building in Portugal are already getting ready, and the Village will help anyone testing the Portuguese market, from licences to hiring.', 'Western European Time'
where not exists (select 1 from villages where slug = 'lisbon');

update villages set
  name = 'Paris',
  city = 'Paris',
  country = 'France',
  status = 'launching',
  summary = 'Paris opens next month. Local Admins are being prepared, and the first Circle opens with the founding members.',
  timezone = 'Central European Time'
where slug = 'paris';

insert into villages (slug, name, city, country, status, summary, timezone)
select 'paris', 'Paris', 'Paris', 'France',
       'launching', 'Paris opens next month. Local Admins are being prepared, and the first Circle opens with the founding members.', 'Central European Time'
where not exists (select 1 from villages where slug = 'paris');

-- ---------------------------------------------------------- circles

insert into circles (village_id, name, capacity, status)
select v.id, 'Circle 01', 50, 'welcoming'
from villages v where v.slug = 'dubai'
  and not exists (
    select 1 from circles c2 where c2.village_id = v.id and c2.name = 'Circle 01'
  );

update circles set capacity = 50, status = 'welcoming'
where name = 'Circle 01'
  and village_id = (select id from villages where slug = 'dubai');

insert into circles (village_id, name, capacity, status)
select v.id, 'Circle 02', 50, 'welcoming'
from villages v where v.slug = 'dubai'
  and not exists (
    select 1 from circles c2 where c2.village_id = v.id and c2.name = 'Circle 02'
  );

update circles set capacity = 50, status = 'welcoming'
where name = 'Circle 02'
  and village_id = (select id from villages where slug = 'dubai');

insert into circles (village_id, name, capacity, status)
select v.id, 'Circle 03', 50, 'preparing'
from villages v where v.slug = 'dubai'
  and not exists (
    select 1 from circles c2 where c2.village_id = v.id and c2.name = 'Circle 03'
  );

update circles set capacity = 50, status = 'preparing'
where name = 'Circle 03'
  and village_id = (select id from villages where slug = 'dubai');

insert into circles (village_id, name, capacity, status)
select v.id, 'Lisbon Circle 01', 50, 'preparing'
from villages v where v.slug = 'lisbon'
  and not exists (
    select 1 from circles c2 where c2.village_id = v.id and c2.name = 'Lisbon Circle 01'
  );

update circles set capacity = 50, status = 'preparing'
where name = 'Lisbon Circle 01'
  and village_id = (select id from villages where slug = 'lisbon');
-- ----------------------------------------------------------- events

insert into events (slug, village_id, title, description, starts_at, ends_at,
  timezone, venue, is_online, visibility, capacity, visitor_places,
  price_cents, currency, status)
select 'founders-dinner',
  (select id from villages where slug = 'dubai'),
  'Founders dinner', 'A long table, no pitches, and a seat next to someone you have not met yet. A small ticket confirms your seat and goes towards the table.',
  timestamptz '2026-10-01 19:30:00+04', timestamptz '2026-10-01 19:30:00+04' + interval '2 hours',
  'Gulf Standard Time',
  'Dubai Marina',
  false,
  'private', 30, 6,
  5000, 'AED', 'published'
where not exists (select 1 from events where slug = 'founders-dinner');

update events set title = 'Founders dinner', description = 'A long table, no pitches, and a seat next to someone you have not met yet. A small ticket confirms your seat and goes towards the table.',
  capacity = 30, visitor_places = 6,
  price_cents = 5000, currency = 'AED', status = 'published'
where slug = 'founders-dinner';

insert into events (slug, village_id, title, description, starts_at, ends_at,
  timezone, venue, is_online, visibility, capacity, visitor_places,
  price_cents, currency, status)
select 'circle-02-coffee-morning',
  (select id from villages where slug = 'dubai'),
  'Circle 02 coffee morning', 'An easy morning for Circle 02 members to catch up. Bring one thing you need help with this month.',
  timestamptz '2026-10-03 09:30:00+04', timestamptz '2026-10-03 09:30:00+04' + interval '2 hours',
  'Gulf Standard Time',
  'Jumeirah',
  false,
  'private', 20, 0,
  0, 'EUR', 'published'
where not exists (select 1 from events where slug = 'circle-02-coffee-morning');

update events set title = 'Circle 02 coffee morning', description = 'An easy morning for Circle 02 members to catch up. Bring one thing you need help with this month.',
  capacity = 20, visitor_places = 0,
  price_cents = 0, currency = 'EUR', status = 'published'
where slug = 'circle-02-coffee-morning';

insert into events (slug, village_id, title, description, starts_at, ends_at,
  timezone, venue, is_online, visibility, capacity, visitor_places,
  price_cents, currency, status)
select 'pricing-across-markets',
  null,
  'Pricing across markets', 'How founders set prices when they sell in more than one country. A short talk, then questions from members in every Village.',
  timestamptz '2026-10-07 17:00:00+04', timestamptz '2026-10-07 17:00:00+04' + interval '2 hours',
  'Central European Time',
  'Online',
  true,
  'public', 200, 0,
  0, 'EUR', 'published'
where not exists (select 1 from events where slug = 'pricing-across-markets');

update events set title = 'Pricing across markets', description = 'How founders set prices when they sell in more than one country. A short talk, then questions from members in every Village.',
  capacity = 200, visitor_places = 0,
  price_cents = 0, currency = 'EUR', status = 'published'
where slug = 'pricing-across-markets';

insert into events (slug, village_id, title, description, starts_at, ends_at,
  timezone, venue, is_online, visibility, capacity, visitor_places,
  price_cents, currency, status)
select 'doing-business-in-portugal',
  (select id from villages where slug = 'lisbon'),
  'Doing business in Portugal', 'The Lisbon Village launch evening. Founding members share what they wish they had known about licences, hiring and finding space. Visiting members from other Villages are welcome.',
  timestamptz '2026-10-13 19:00:00+04', timestamptz '2026-10-13 19:00:00+04' + interval '2 hours',
  'Western European Time',
  'Casa Tinta, Príncipe Real',
  false,
  'private', 40, 10,
  0, 'EUR', 'published'
where not exists (select 1 from events where slug = 'doing-business-in-portugal');

update events set title = 'Doing business in Portugal', description = 'The Lisbon Village launch evening. Founding members share what they wish they had known about licences, hiring and finding space. Visiting members from other Villages are welcome.',
  capacity = 40, visitor_places = 10,
  price_cents = 0, currency = 'EUR', status = 'published'
where slug = 'doing-business-in-portugal';

insert into events (slug, village_id, title, description, starts_at, ends_at,
  timezone, venue, is_online, visibility, capacity, visitor_places,
  price_cents, currency, status)
select 'creative-design-roundtable',
  null,
  'Creative & Design roundtable', 'Designers and marketers from every Village compare how they win and price client work.',
  timestamptz '2026-10-15 18:00:00+04', timestamptz '2026-10-15 18:00:00+04' + interval '2 hours',
  'Central European Time',
  'Online',
  true,
  'private', 40, 0,
  0, 'EUR', 'published'
where not exists (select 1 from events where slug = 'creative-design-roundtable');

update events set title = 'Creative & Design roundtable', description = 'Designers and marketers from every Village compare how they win and price client work.',
  capacity = 40, visitor_places = 0,
  price_cents = 0, currency = 'EUR', status = 'published'
where slug = 'creative-design-roundtable';

insert into events (slug, village_id, title, description, starts_at, ends_at,
  timezone, venue, is_online, visibility, capacity, visitor_places,
  price_cents, currency, status)
select 'open-evening-for-prospective-members',
  (select id from villages where slug = 'dubai'),
  'Open evening for prospective members', 'Meet members and Local Admins, hear how the Village works and ask anything before you apply.',
  timestamptz '2026-09-19 18:00:00+04', timestamptz '2026-09-19 18:00:00+04' + interval '2 hours',
  'Gulf Standard Time',
  'Alserkal Avenue',
  false,
  'public', 40, 0,
  0, 'EUR', 'published'
where not exists (select 1 from events where slug = 'open-evening-for-prospective-members');

update events set title = 'Open evening for prospective members', description = 'Meet members and Local Admins, hear how the Village works and ask anything before you apply.',
  capacity = 40, visitor_places = 0,
  price_cents = 0, currency = 'EUR', status = 'published'
where slug = 'open-evening-for-prospective-members';

insert into events (slug, village_id, title, description, starts_at, ends_at,
  timezone, venue, is_online, visibility, capacity, visitor_places,
  price_cents, currency, status)
select 'accountability-pod-check-in',
  null,
  'Accountability Pod check-in', 'The fortnightly Pod call. Each member shares one result from the last two weeks and one goal for the next.',
  timestamptz '2026-09-22 08:00:00+04', timestamptz '2026-09-22 08:00:00+04' + interval '2 hours',
  'Central European Time',
  'Online',
  true,
  'private', 6, 0,
  0, 'EUR', 'published'
where not exists (select 1 from events where slug = 'accountability-pod-check-in');

update events set title = 'Accountability Pod check-in', description = 'The fortnightly Pod call. Each member shares one result from the last two weeks and one goal for the next.',
  capacity = 6, visitor_places = 0,
  price_cents = 0, currency = 'EUR', status = 'published'
where slug = 'accountability-pod-check-in';
-- ------------------------------------------- watch and listen

insert into shows (slug, name, about, active)
values ('epp', 'The ExpatPreneurs Podcast', 'Long conversations with founders building businesses outside their home country. New episodes every two weeks.', true)
on conflict (slug) do update set name = excluded.name, about = excluded.about;

insert into shows (slug, name, about, active)
values ('vv', 'Village Voices', 'Short episodes from inside each Village, hosted by the people who run them.', true)
on conflict (slug) do update set name = excluded.name, about = excluded.about;

insert into media_items (kind, slug, title, summary, duration, published_at, member_only)
select 'video', 'why-i-started-expatpreneurs-after-six-countries', 'Why I started ExpatPreneurs after six countries', 'Kristiane Charrier on rebuilding her network at every move, what happened to the first community in Luanda, and why the network is built as Villages.', '8:42', now(), false
where not exists (select 1 from media_items where slug = 'why-i-started-expatpreneurs-after-six-countries');

insert into media_items (kind, slug, title, summary, duration, published_at, member_only)
select 'video', 'a-day-in-the-dubai-village', 'A day in the Dubai Village', 'From a Circle coffee morning to the founders dinner. Members and Local Admins show what belonging to a Village looks like.', '4:05', now(), false
where not exists (select 1 from media_items where slug = 'a-day-in-the-dubai-village');

insert into media_items (kind, slug, title, summary, duration, published_at, member_only)
select 'video', 'registering-a-company-in-dubai-what-to-ask-first', 'Registering a company in Dubai: what to ask first', 'Leila Haddad, a member in Dubai, walks through licences, free zones and bank accounts. Selected by the Media team for founders planning a Gulf launch.', '12:30', now(), false
where not exists (select 1 from media_items where slug = 'registering-a-company-in-dubai-what-to-ask-first');

insert into media_items (kind, slug, title, summary, duration, published_at, member_only)
select 'video', 'pricing-across-markets-full-session', 'Pricing across markets, full session', 'The full recording of the online session, with questions from members in every Village.', '1:02:14', now(), false
where not exists (select 1 from media_items where slug = 'pricing-across-markets-full-session');

insert into media_items (kind, slug, title, summary, duration, published_at, member_only)
select 'video', 'ines-on-opening-a-guesthouse-in-lisbon', 'Inês on opening a guesthouse in Lisbon', 'Inês Carvalho moved from Rio to Lisbon and opened two guesthouses. Here is what she would do differently.', '6:18', now(), false
where not exists (select 1 from media_items where slug = 'ines-on-opening-a-guesthouse-in-lisbon');

insert into media_items (kind, slug, title, summary, duration, published_at, member_only)
select 'video', 'founders-dinner-september-recap', 'Founders dinner, September recap', 'Two minutes from our long table in Dubai Marina.', '2:51', now(), false
where not exists (select 1 from media_items where slug = 'founders-dinner-september-recap');

insert into media_items (kind, slug, title, summary, duration, published_at, member_only)
select 'video', 'hiring-your-first-person-in-another-country', 'Hiring your first person in another country', 'Julien Moreau, a member in Dubai, on contracts, time zones and the first ninety days of a remote hire.', '15:07', now(), false
where not exists (select 1 from media_items where slug = 'hiring-your-first-person-in-another-country');

insert into media_items (kind, slug, title, summary, duration, published_at, member_only)
select 'video', 'lisbon-village-the-first-six-months', 'Lisbon Village: the first six months', 'How the Lisbon Village started, and what its Local Admins learned along the way.', '5:33', now(), false
where not exists (select 1 from media_items where slug = 'lisbon-village-the-first-six-months');

insert into media_items (kind, slug, title, summary, body, duration, show_slug,
  episode_number, published_at, member_only)
select 'episode', 'building-a-business-in-a-country-that-is-not-yours', 'Building a business in a country that is not yours', 'Kristiane Charrier, founder of ExpatPreneurs Global', 'Rebuilding a network after every move What the Luanda community taught her Why Villages need a global structure',
  '48 min', 'epp', 12, now(), false
where not exists (select 1 from media_items where slug = 'building-a-business-in-a-country-that-is-not-yours');

insert into media_items (kind, slug, title, summary, body, duration, show_slug,
  episode_number, published_at, member_only)
select 'episode', 'the-gulf-market-for-european-founders', 'The Gulf market for European founders', 'Leila Haddad, Haddad Advisory, Dubai Village', 'Choosing a licence Selling to your first Gulf clients Mistakes she sees every month',
  '41 min', 'epp', 11, now(), false
where not exists (select 1 from media_items where slug = 'the-gulf-market-for-european-founders');

insert into media_items (kind, slug, title, summary, body, duration, show_slug,
  episode_number, published_at, member_only)
select 'episode', 'hospitality-in-lisbon-from-zero', 'Hospitality in Lisbon, from zero', 'Inês Carvalho, Casa Tinta, Lisbon Village', 'Arriving without a network Licences for short stays Hosting the Village',
  '37 min', 'epp', 10, now(), false
where not exists (select 1 from media_items where slug = 'hospitality-in-lisbon-from-zero');

insert into media_items (kind, slug, title, summary, body, duration, show_slug,
  episode_number, published_at, member_only)
select 'episode', 'hiring-across-borders', 'Hiring across borders', 'Julien Moreau, Stackleaf, Dubai Village', 'Remote contracts Managing time zones Building trust early',
  '44 min', 'epp', 9, now(), false
where not exists (select 1 from media_items where slug = 'hiring-across-borders');

insert into media_items (kind, slug, title, summary, body, duration, show_slug,
  episode_number, published_at, member_only)
select 'episode', 'dubai-what-it-takes-to-run-a-village', 'Dubai: what it takes to run a Village', 'Nadia Mbarga and Rahel Tesfaye, Local Admins, Dubai', 'Welcoming new members Keeping the Village international Planning a monthly gathering',
  '22 min', 'vv', 5, now(), false
where not exists (select 1 from media_items where slug = 'dubai-what-it-takes-to-run-a-village');

insert into media_items (kind, slug, title, summary, body, duration, show_slug,
  episode_number, published_at, member_only)
select 'episode', 'lisbon-six-months-in', 'Lisbon: six months in', 'Kwame Asante and Sofia Lindqvist, Local Admins, Lisbon', 'Starting a Village The first Circle',
  '19 min', 'vv', 4, now(), false
where not exists (select 1 from media_items where slug = 'lisbon-six-months-in');

-- --------------------------------------------------------- articles

insert into articles (slug, kind, title, standfirst, body, member_only, status, published_at)
select 'six-countries-one-lesson-local-belonging-needs-global-contin', 'story', 'Six countries, one lesson: local belonging needs global continuity', 'Kristiane Charrier rebuilt her network every time she moved. The community she built in Luanda showed her why a local group is not enough on its own.', 'Kristiane Charrier rebuilt her network every time she moved. The community she built in Luanda showed her why a local group is not enough on its own.',
  false, 'published', now()
where not exists (select 1 from articles where slug = 'six-countries-one-lesson-local-belonging-needs-global-contin');

insert into articles (slug, kind, title, standfirst, body, member_only, status, published_at)
select 'opening-a-guesthouse-in-a-city-you-moved-to-for-love', 'story', 'Opening a guesthouse in a city you moved to for love', 'Inês Carvalho arrived in Lisbon with no network. Two guesthouses later, she hosts the Village she wished had existed.', 'Inês Carvalho arrived in Lisbon with no network. Two guesthouses later, she hosts the Village she wished had existed.',
  false, 'published', now()
where not exists (select 1 from articles where slug = 'opening-a-guesthouse-in-a-city-you-moved-to-for-love');

insert into articles (slug, kind, title, standfirst, body, member_only, status, published_at)
select 'what-i-wish-i-knew-before-registering-a-company-in-dubai', 'guide', 'What I wish I knew before registering a company in Dubai', 'A member who does this for a living shares the questions to ask before you choose a licence.', 'A member who does this for a living shares the questions to ask before you choose a licence.',
  false, 'published', now()
where not exists (select 1 from articles where slug = 'what-i-wish-i-knew-before-registering-a-company-in-dubai');

-- ------------------------------------------------------- businesses
--
-- A business belongs to a member, and the people who own these have not
-- joined yet. They are attached to the founder's account so the
-- marketplace is not empty, and every one carries a line saying so.
-- Reassign or delete each as its real owner arrives:
--
--   delete from businesses where description like '%[demo listing]%';


insert into businesses (slug, owner_id, village_id, name, tagline, description, industry, public)
select 'norte',
  (select id from profiles where email = 'realexpatpreneur@gmail.com'),
  (select id from villages where slug = 'dubai'),
  'Norte Studio', 'Brand identities for early stage founders.',
  'Brand identities for early stage founders. Brand identity, Naming, Pitch deck design. Brand sprint for new members, 10 percent off [demo listing]',
  'Design & branding', true
where exists (select 1 from profiles where email = 'realexpatpreneur@gmail.com')
  and not exists (select 1 from businesses where slug = 'norte');

update businesses set name = 'Norte Studio', tagline = 'Brand identities for early stage founders.',
  industry = 'Design & branding', public = true
where slug = 'norte';

insert into businesses (slug, owner_id, village_id, name, tagline, description, industry, public)
select 'casatinta',
  (select id from profiles where email = 'realexpatpreneur@gmail.com'),
  (select id from villages where slug = 'lisbon'),
  'Casa Tinta', 'Two guesthouses and a small events space in Lisbon.',
  'Two guesthouses and a small events space in Lisbon. Guest rooms, Events space, Long stays. 15 percent off for members visiting Lisbon [demo listing]',
  'Hospitality', true
where exists (select 1 from profiles where email = 'realexpatpreneur@gmail.com')
  and not exists (select 1 from businesses where slug = 'casatinta');

update businesses set name = 'Casa Tinta', tagline = 'Two guesthouses and a small events space in Lisbon.',
  industry = 'Hospitality', public = true
where slug = 'casatinta';

insert into businesses (slug, owner_id, village_id, name, tagline, description, industry, public)
select 'haddad',
  (select id from profiles where email = 'realexpatpreneur@gmail.com'),
  (select id from villages where slug = 'dubai'),
  'Haddad Advisory', 'Company setup and market entry in the Gulf.',
  'Company setup and market entry in the Gulf. Company setup, Licensing, Market entry plans. Free 30 minute intro call [demo listing]',
  'Consulting', true
where exists (select 1 from profiles where email = 'realexpatpreneur@gmail.com')
  and not exists (select 1 from businesses where slug = 'haddad');

update businesses set name = 'Haddad Advisory', tagline = 'Company setup and market entry in the Gulf.',
  industry = 'Consulting', public = true
where slug = 'haddad';

insert into businesses (slug, owner_id, village_id, name, tagline, description, industry, public)
select 'still',
  (select id from profiles where email = 'realexpatpreneur@gmail.com'),
  (select id from villages where slug = 'dubai'),
  'Still Studio', 'Workplace wellness programmes and a skincare line.',
  'Workplace wellness programmes and a skincare line. Team wellness days, Studio classes, Skincare.  [demo listing]',
  'Wellness', true
where exists (select 1 from profiles where email = 'realexpatpreneur@gmail.com')
  and not exists (select 1 from businesses where slug = 'still');

update businesses set name = 'Still Studio', tagline = 'Workplace wellness programmes and a skincare line.',
  industry = 'Wellness', public = true
where slug = 'still';

insert into businesses (slug, owner_id, village_id, name, tagline, description, industry, public)
select 'keystone',
  (select id from profiles where email = 'realexpatpreneur@gmail.com'),
  (select id from villages where slug = 'lisbon'),
  'Keystone Homes', 'Homes and offices for founders relocating to Lisbon.',
  'Homes and offices for founders relocating to Lisbon. Residential search, Office search, Relocation support. No search fee for members [demo listing]',
  'Real estate', true
where exists (select 1 from profiles where email = 'realexpatpreneur@gmail.com')
  and not exists (select 1 from businesses where slug = 'keystone');

update businesses set name = 'Keystone Homes', tagline = 'Homes and offices for founders relocating to Lisbon.',
  industry = 'Real estate', public = true
where slug = 'keystone';

insert into businesses (slug, owner_id, village_id, name, tagline, description, industry, public)
select 'stackleaf',
  (select id from profiles where email = 'realexpatpreneur@gmail.com'),
  (select id from villages where slug = 'dubai'),
  'Stackleaf', 'Inventory software for small retailers.',
  'Inventory software for small retailers. Inventory software, Onboarding.  [demo listing]',
  'Technology', true
where exists (select 1 from profiles where email = 'realexpatpreneur@gmail.com')
  and not exists (select 1 from businesses where slug = 'stackleaf');

update businesses set name = 'Stackleaf', tagline = 'Inventory software for small retailers.',
  industry = 'Technology', public = true
where slug = 'stackleaf';

-- -------------------------------------------------------- resources

insert into resources (village_id, kind, title, description, all_villages)
select (select id from villages where slug = 'dubai'),
  'guide',
  'Company setup in Dubai', 'Guide by Leila Haddad', true
where not exists (select 1 from resources where title = 'Company setup in Dubai');

insert into resources (village_id, kind, title, description, all_villages)
select (select id from villages where slug = 'dubai'),
  'guide',
  'Banks that open accounts for founders', 'Member recommendations', true
where not exists (select 1 from resources where title = 'Banks that open accounts for founders');

insert into resources (village_id, kind, title, description, all_villages)
select (select id from villages where slug = 'dubai'),
  'guide',
  'Visas for founders in Dubai', 'Kept by the Local Admins', true
where not exists (select 1 from resources where title = 'Visas for founders in Dubai');

insert into resources (village_id, kind, title, description, all_villages)
select (select id from villages where slug = 'dubai'),
  'guide',
  'Coworking spaces members use', 'Kept by the Local Admins', true
where not exists (select 1 from resources where title = 'Coworking spaces members use');

insert into resources (village_id, kind, title, description, all_villages)
select (select id from villages where slug = 'dubai'),
  'template',
  'Client proposal template', 'Two pages, ready to adapt', true
where not exists (select 1 from resources where title = 'Client proposal template');

insert into resources (village_id, kind, title, description, all_villages)
select (select id from villages where slug = 'dubai'),
  'template',
  'Freelance contract checklist', 'What to check before you sign', true
where not exists (select 1 from resources where title = 'Freelance contract checklist');

insert into resources (village_id, kind, title, description, all_villages)
select (select id from villages where slug = 'dubai'),
  'recording',
  'Legal setup in Dubai, workshop recording', 'Leila Haddad, 52 min', true
where not exists (select 1 from resources where title = 'Legal setup in Dubai, workshop recording');

insert into resources (village_id, kind, title, description, all_villages)
select (select id from villages where slug = 'dubai'),
  'recording',
  'Marketing on a small budget, workshop recording', 'Hana Sato, 45 min', true
where not exists (select 1 from resources where title = 'Marketing on a small budget, workshop recording');