-- ExpatPreneurs Global: podcast shows, and the newsletter
-- Watch and Listen holds episodes with nowhere saying what the show is,
-- and nothing to follow it in a podcast app. The prototype also has a
-- newsletter sign up and its confirmation.
-- Run after 0028_public_businesses.sql.

-- ----------------------------------------------------------- the shows

create table shows (
  slug        text primary key,
  name        text not null,
  about       text,
  cover_url   text,
  spotify_url text,
  apple_url   text,
  youtube_url text,
  rss_url     text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger shows_updated before update on shows
  for each row execute function set_updated_at();

alter table shows enable row level security;

create policy shows_read on shows for select using (active or is_global_admin());
create policy shows_write on shows
  for all using (is_global_admin()) with check (is_global_admin());

grant select on shows to anon;

-- An episode belongs to a show. A video belongs to none.
alter table media_items add column if not exists show_slug text references shows(slug) on delete set null;
alter table media_items add column if not exists episode_number int;

insert into shows (slug, name, about) values
  ('expatpreneurs', 'The ExpatPreneurs Podcast',
   'Members on what building a business away from home actually takes. Recorded in the Villages, one conversation at a time.')
on conflict (slug) do nothing;

-- ------------------------------------------------------- the newsletter

create table newsletter_signups (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null unique,
  source       text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at   timestamptz not null default now()
);

alter table newsletter_signups enable row level security;

-- Anybody may sign up. Only the Global team reads the list, and nobody
-- can find out whether an address is already on it.
create policy newsletter_signup on newsletter_signups
  for insert with check (true);
create policy newsletter_read on newsletter_signups
  for select using (is_global_admin());

grant insert on newsletter_signups to anon;