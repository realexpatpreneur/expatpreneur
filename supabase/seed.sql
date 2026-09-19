-- ExpatPreneurs Global, starting data
-- Safe to run more than once.

insert into villages (slug, name, city, country, timezone, status, summary) values
  ('dubai',  'Dubai',  'Dubai',  'United Arab Emirates', 'Asia/Dubai',    'open',      'The founding Village, and the home of the first Circles.'),
  ('lisbon', 'Lisbon', 'Lisbon', 'Portugal',             'Europe/Lisbon', 'launching', 'Launching with founding members across consulting, hospitality and technology.'),
  ('paris',  'Paris',  'Paris',  'France',               'Europe/Paris',  'launching', 'Launching with a Local Admin already hosting members in the city.'),
  ('madrid', 'Madrid', 'Madrid', 'Spain',                'Europe/Madrid', 'exploring', 'Being explored. People who ask are told when it opens.')
on conflict (slug) do nothing;

insert into circles (village_id, name, status)
select v.id, c.name, c.status
from villages v
join (values
  ('dubai',  'Circle 01', 'welcoming'),
  ('dubai',  'Circle 02', 'welcoming'),
  ('dubai',  'Circle 03', 'preparing'),
  ('lisbon', 'Lisbon Circle 01', 'preparing')
) as c(slug, name, status) on c.slug = v.slug
on conflict (village_id, name) do nothing;

-- Guides, templates and recordings promised to founding members.
insert into resources (village_id, kind, title, description, all_villages)
select v.id, 'guide', 'Setting up a company in Dubai', 'Licences, costs and the order to do things in.', false
from villages v where v.slug = 'dubai'
on conflict do nothing;
