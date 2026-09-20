-- ExpatPreneurs Global: photographs and consent
-- Kristiane wants only a few member photographs on permanent pages,
-- rotated so nobody is fixed to the site forever. This records who
-- appears where, whether they signed a permission, and when each is due
-- for review. It is a promise to members about their own face, and the
-- build had nothing behind it.
-- Run after 0030_local_admin_workspace.sql.

create table photo_uses (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references profiles(id) on delete set null,
  who         text not null,                  -- the name, kept if they leave
  image_url   text,
  appears_on  text not null,                  -- the page it is used on
  taken_on    date,
  consent     text not null default 'waiting',-- signed, waiting, no_faces
  consent_note text,
  review_by   date,
  retired_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger photo_uses_updated before update on photo_uses
  for each row execute function set_updated_at();

alter table photo_uses enable row level security;

-- The register is the Global team's. A member may see where their own
-- photograph is used, which is the point of keeping it.
create policy photo_uses_read on photo_uses
  for select using (is_global_admin() or profile_id = auth.uid());
create policy photo_uses_write on photo_uses
  for all using (is_global_admin()) with check (is_global_admin());

insert into settings (key, value, note) values
  ('photo_rotation',  'Every six months', 'How often member photographs are rotated.'),
  ('photo_next',      '', 'When the next rotation is due.'),
  ('photo_checked_by','Global team', 'Who checks the rotation.')
on conflict (key) do nothing;

-- When a member leaves, their photographs come off the public pages. This
-- marks them so the next rotation takes them down.
create or replace function retire_photos_on_leaving()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('left', 'removed') and old.status not in ('left', 'removed') then
    update photo_uses
    set retired_at = now(),
        consent_note = coalesce(consent_note, '') || ' Member has left.'
    where profile_id = new.id and retired_at is null;
  end if;
  return new;
end $$;

drop trigger if exists photos_when_leaving on profiles;
create trigger photos_when_leaving after update of status on profiles
  for each row execute function retire_photos_on_leaving();