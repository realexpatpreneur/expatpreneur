-- ExpatPreneurs Global: the public pages, edited in the platform
-- The prototype has a Pages list and a block editor with search fields
-- per page. Until now every public page was written in code.
-- Run after 0025_email_templates.sql.

create type page_status as enum ('draft', 'live');

create table pages (
  slug             text primary key,
  title            text not null,
  path             text not null,
  blocks           jsonb not null default '[]'::jsonb,
  search_title     text,
  search_description text,
  status           page_status not null default 'draft',
  updated_by       uuid references profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger pages_updated before update on pages
  for each row execute function set_updated_at();

alter table pages enable row level security;

-- Anybody may read a live page, because the public site is what reads it.
create policy pages_read on pages
  for select using (status = 'live' or is_global_admin());
create policy pages_write on pages
  for all using (is_global_admin()) with check (is_global_admin());

grant select on pages to anon;

-- The five pages the prototype lists, each with the blocks that page
-- already shows, so turning one live changes nothing until it is edited.
insert into pages (slug, title, path, status, search_title, search_description, blocks) values
('home', 'Home', '/', 'draft',
 'ExpatPreneurs Global',
 'A curated network of expat entrepreneurs, organised as Villages in each city.',
 '[
   {"type":"hero",
    "heading":"Your business needs a village too.",
    "text":"A curated network of expat entrepreneurs. Belong to a small, trusted community in your city, and reach people you can trust in other markets.",
    "button_label":"Request your invitation","button_href":"/apply",
    "second_label":"Look around first","second_href":"/discover"},
   {"type":"heading","heading":"Big enough to open doors. Small enough to know each other."},
   {"type":"text","body":"Every member belongs to three places at once. As the network grows, your home base stays human sized."},
   {"type":"villages","show":"Open and launching Villages"},
   {"type":"story","heading":"Why this exists","body":"It takes a village to raise a child. We believe the same is true of the businesses we build far from home."}
 ]'::jsonb),

('how', 'How it works', '/how-it-works', 'draft',
 'How it works, ExpatPreneurs Global',
 'Invitation, a Circle of fifty, and a Village in your city.', '[]'::jsonb),

('membership', 'Membership', '/membership', 'draft',
 'Membership, ExpatPreneurs Global',
 'Membership is by invitation and costs nothing. One paid plan opens the rest of the network.', '[]'::jsonb),

('privacy', 'Privacy', '/legal/privacy', 'draft',
 'Privacy policy, ExpatPreneurs Global',
 'What the platform holds about a member, and what it never shows.', '[]'::jsonb),

('terms', 'Terms of service', '/legal/terms', 'draft',
 'Terms of service, ExpatPreneurs Global',
 'The terms of membership.', '[]'::jsonb)
on conflict (slug) do nothing;