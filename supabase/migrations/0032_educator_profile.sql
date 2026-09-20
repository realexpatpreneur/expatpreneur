-- ExpatPreneurs Global: the educator's own profile
-- A course page names its educator but has nothing to say about them.
-- The prototype has an educator profile, separate from the member
-- profile, because what makes somebody worth learning from is not what
-- makes them worth meeting.
-- Run after 0031_photos_consent.sql.

create table educator_profiles (
  profile_id uuid primary key references profiles(id) on delete cascade,
  headline   text,
  about      text,
  teaches_in text[] not null default '{}',   -- the languages they teach in
  markets    text[] not null default '{}',   -- the markets they know
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger educator_profiles_updated before update on educator_profiles
  for each row execute function set_updated_at();

alter table educator_profiles enable row level security;

-- Shown wherever a course is shown, so anybody who can see the course can
-- see who wrote it. Written by the educator alone.
create policy educator_profiles_read on educator_profiles
  for select using (true);
create policy educator_profiles_write on educator_profiles
  for all using (profile_id = auth.uid() or is_global_admin())
  with check (profile_id = auth.uid() or is_global_admin());

grant select on educator_profiles to anon;