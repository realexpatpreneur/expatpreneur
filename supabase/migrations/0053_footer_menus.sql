-- The footer menus, as the footer reads today.
--
-- The header was seeded in 0052. These are the six that were left, so
-- the Menus screen opens with the real footer rather than empty boxes,
-- and so nothing changes on the site the moment somebody saves one.
--
-- The Villages column is not seeded past its last two links, because
-- the Villages themselves come from the database and should keep doing
-- so. Adding a Village adds it to the footer with no edit here.

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_explore', 'How it works', '/how-it-works', 1),
  ('footer_explore', 'Membership', '/membership', 2),
  ('footer_explore', 'Members', '/members', 3),
  ('footer_explore', 'Events', '/events', 4),
  ('footer_explore', 'Request your invitation', '/apply', 5),
  ('footer_explore', 'Your invitation request', '/apply/status', 6)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_explore');

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_villages', 'All Villages', '/villages', 1),
  ('footer_villages', 'Suggest a city', '/villages/suggest', 2)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_villages');

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_marketplace', 'Businesses', '/businesses', 1),
  ('footer_marketplace', 'Learning', '/learning', 2),
  ('footer_marketplace', 'Teach in the network', '/membership', 3)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_marketplace');

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_stories', 'Media', '/media', 1),
  ('footer_stories', 'Videos', '/watch', 2),
  ('footer_stories', 'Podcasts', '/watch', 3),
  ('footer_stories', 'Founder story', '/media', 4)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_stories');

insert into menu_items (menu, label, href, position)
select * from (values
  ('footer_company', 'Contact', '/contact', 1),
  ('footer_company', 'Partnerships', '/contact', 2),
  ('footer_company', 'Press', '/contact', 3),
  ('footer_company', 'Log in', '/login', 4)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'footer_company');

insert into menu_items (menu, label, href, position)
select * from (values
  ('legal', 'Privacy', '/legal/privacy', 1),
  ('legal', 'Terms', '/legal/terms', 2),
  ('legal', 'Cookies', '/legal/cookies', 3)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'legal');