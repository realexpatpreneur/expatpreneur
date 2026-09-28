-- Every word on a coded page, editable.
--
-- The pages table replaces a whole page with blocks, which is right for
-- a page that is only prose and wrong for a page with cards, filters
-- and live data. Publishing the home page that way would strip it.
--
-- This is the other half: one row per piece of text. A page asks for a
-- key, and gets the row if somebody has written one, or the wording in
-- the code if nobody has. Nothing can be stripped, because the code is
-- always the fallback, and an empty table changes nothing.

create table if not exists page_text (
  page       text not null,
  key        text not null,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null,
  primary key (page, key)
);

alter table page_text enable row level security;

-- Anyone may read it: this is the public wording of the website.
drop policy if exists page_text_read on page_text;
create policy page_text_read on page_text
  for select using (true);

-- Only the Global team writes it.
drop policy if exists page_text_write on page_text;
create policy page_text_write on page_text
  for all using (is_global_admin()) with check (is_global_admin());

create index if not exists page_text_page_idx on page_text(page);