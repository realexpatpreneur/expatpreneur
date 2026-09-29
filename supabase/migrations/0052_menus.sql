-- The menus, so a new page can be put where people will find it.
--
-- Until now the header and the footer were written into the code, so
-- creating a page left it unreachable unless a developer linked to it.
-- These rows are the menus. An empty table changes nothing: the header
-- and footer fall back to what the code has always shown.

create table if not exists menu_items (
  id         uuid primary key default gen_random_uuid(),
  menu       text not null,
  label      text not null,
  href       text not null,
  position   int not null default 0,
  new_tab    boolean not null default false,
  signed_in  text not null default 'anyone',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column menu_items.menu is
  'header, footer_explore, footer_villages, footer_marketplace, footer_stories, footer_company, legal';
comment on column menu_items.signed_in is
  'anyone, visitors, members';

create index if not exists menu_items_menu_idx on menu_items(menu, position);

alter table menu_items enable row level security;

drop policy if exists menu_items_read on menu_items;
create policy menu_items_read on menu_items for select using (true);

drop policy if exists menu_items_write on menu_items;
create policy menu_items_write on menu_items
  for all using (is_global_admin()) with check (is_global_admin());

-- The header as it stands today, so the screen opens with something
-- real rather than empty.
insert into menu_items (menu, label, href, position)
select * from (values
  ('header', 'Discover', '/discover', 1),
  ('header', 'How it works', '/how-it-works', 2),
  ('header', 'Membership', '/membership', 3),
  ('header', 'Events', '/events', 4),
  ('header', 'Watch & Listen', '/watch', 5)
) as t(menu, label, href, position)
where not exists (select 1 from menu_items where menu = 'header');