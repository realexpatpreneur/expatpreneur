-- ExpatPreneurs Global: articles and member stories
-- Watch and Listen holds video and audio. This holds what is read: the
-- stories about members, and the pieces written for people who are not in
-- yet. Members can pitch a story rather than wait to be asked.
-- Run after 0017_shop_window.sql.

create type article_kind   as enum ('story', 'guide', 'note');
create type article_status as enum ('draft', 'published', 'retired');

create table articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  kind         article_kind not null default 'story',
  title        text not null,
  standfirst   text,                       -- the line under the title
  body         text not null,
  cover_url    text,
  about_id     uuid references profiles(id) on delete set null,  -- the member it is about
  village_id   uuid references villages(id) on delete set null,
  member_only  boolean not null default false,
  status       article_status not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger articles_updated before update on articles
  for each row execute function set_updated_at();
create index articles_published_idx on articles(published_at desc);

-- A member says there is a story here, and who it is about.
create table story_suggestions (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  about       text not null default 'me',   -- me, another member, a collaboration
  body        text not null,
  status      suggestion_status not null default 'new',
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger story_suggestions_updated before update on story_suggestions
  for each row execute function set_updated_at();

alter table articles enable row level security;
alter table story_suggestions enable row level security;

-- Published and open to everyone unless it is marked members only.
create policy articles_read on articles
  for select using (
    (status = 'published' and not member_only)
    or ((status = 'published') and is_member())
    or is_global_admin()
  );
create policy articles_write on articles
  for all using (is_global_admin()) with check (is_global_admin());

create policy stories_own on story_suggestions
  for insert with check (profile_id = auth.uid() and is_member());
create policy stories_read on story_suggestions
  for select using (profile_id = auth.uid() or is_global_admin());
create policy stories_handle on story_suggestions
  for update using (is_global_admin()) with check (is_global_admin());

revoke select on articles from anon;
grant select (
  id, slug, kind, title, standfirst, body, cover_url,
  about_id, village_id, member_only, status, published_at, created_at
) on articles to anon;