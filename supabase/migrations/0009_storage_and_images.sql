-- ExpatPreneurs Global: storage and images
-- Three buckets: faces and covers anyone may look at, and recordings that
-- only the people who could attend may open.
-- Run after 0008_live_sessions.sql.

-- A couple of places that needed somewhere to keep an image.
alter table businesses add column if not exists logo_url text;
alter table courses    add column if not exists cover_url text;
alter table industry_groups add column if not exists cover_url text;
alter table live_sessions   add column if not exists cover_url text;

-- ------------------------------------------------------------- buckets

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,
    array['image/jpeg','image/png','image/webp']),
  ('covers', 'covers', true, 5242880,
    array['image/jpeg','image/png','image/webp']),
  ('recordings', 'recordings', false, 5368709120,
    array['video/mp4','video/webm','audio/mpeg','audio/mp4'])
on conflict (id) do nothing;

-- --------------------------------------------------------------- rules
-- Everything is filed under the uploader's own id, so the first folder in
-- the path is the proof of who owns it.

drop policy if exists "avatars are public" on storage.objects;
create policy "avatars are public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "members upload their own avatar" on storage.objects;
create policy "members upload their own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "members replace their own avatar" on storage.objects;
create policy "members replace their own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "members remove their own avatar" on storage.objects;
create policy "members remove their own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "covers are public" on storage.objects;
create policy "covers are public" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "members upload covers" on storage.objects;
create policy "members upload covers" on storage.objects
  for insert with check (
    bucket_id = 'covers'
    and is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "members manage their covers" on storage.objects;
create policy "members manage their covers" on storage.objects
  for update using (
    bucket_id = 'covers'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_global_admin())
  );

drop policy if exists "members delete their covers" on storage.objects;
create policy "members delete their covers" on storage.objects
  for delete using (
    bucket_id = 'covers'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_global_admin())
  );

-- Recordings are private. A file is filed under the session id, and only
-- someone who could have been in that room may open it.
drop policy if exists "recordings for the room" on storage.objects;
create policy "recordings for the room" on storage.objects
  for select using (
    bucket_id = 'recordings'
    and exists (
      select 1 from live_sessions s
      where s.id::text = (storage.foldername(name))[1]
        and (is_session_host(s) or can_join_session(s))
    )
  );

drop policy if exists "hosts upload recordings" on storage.objects;
create policy "hosts upload recordings" on storage.objects
  for insert with check (
    bucket_id = 'recordings'
    and exists (
      select 1 from live_sessions s
      where s.id::text = (storage.foldername(name))[1] and is_session_host(s)
    )
  );