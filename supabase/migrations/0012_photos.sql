-- ExpatPreneurs Global: photographs
-- What a Village looked like. Photographs belong to an event, and are put
-- up by the people who were actually there.
-- Run after 0011_insight.sql.

create table event_photos (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  village_id  uuid references villages(id) on delete set null,
  uploader_id uuid not null references profiles(id) on delete cascade,
  url         text not null,
  caption     text,
  created_at  timestamptz not null default now()
);
create index event_photos_event_idx on event_photos(event_id, created_at desc);
create index event_photos_village_idx on event_photos(village_id, created_at desc);

alter table event_photos enable row level security;

-- Anyone who could have come to the event can see them.
create policy photos_read on event_photos
  for select using (
    is_admin(village_id)
    or exists (
      select 1 from events e where e.id = event_id and (
        e.visibility = 'public'
        or (is_member() and (
          e.audience = 'global'
          or e.village_id = my_village()
          or is_paid()
        ))
      )
    )
  );

-- Putting one up takes having been there, which the register already knows.
create policy photos_add on event_photos
  for insert with check (
    uploader_id = auth.uid()
    and (
      is_admin(village_id)
      or exists (
        select 1 from event_registrations r
        where r.event_id = event_photos.event_id
          and r.profile_id = auth.uid()
          and r.status = 'confirmed'
      )
    )
  );

create policy photos_remove on event_photos
  for delete using (uploader_id = auth.uid() or is_admin(village_id));

create view village_gallery as
select p.id, p.event_id, p.village_id, p.url, p.caption, p.created_at,
       e.title as event_title, e.slug as event_slug, e.starts_at
from event_photos p
join events e on e.id = p.event_id;

alter view village_gallery set (security_invoker = on);