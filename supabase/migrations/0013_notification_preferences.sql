-- ExpatPreneurs Global: what reaches the inbox
-- Notifications inside the platform stay as they are. These say which of
-- them also go out by email. Everything is on until a member turns it off.
-- Run after 0012_photos.sql.

create table notification_prefs (
  profile_id    uuid primary key references profiles(id) on delete cascade,
  messages      boolean not null default true,  -- someone writes to you
  replies       boolean not null default true,  -- someone answers your post
  connections   boolean not null default true,  -- a request to connect
  events        boolean not null default true,  -- reminders and changes
  announcements boolean not null default true,  -- from your Local Admin
  renewal       boolean not null default true,  -- the yearly question
  updated_at    timestamptz not null default now()
);
create trigger notification_prefs_updated before update on notification_prefs
  for each row execute function set_updated_at();

alter table notification_prefs enable row level security;

create policy prefs_own on notification_prefs
  for all using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Anything the platform sends checks here first. A member with no row has
-- never changed anything, so everything is on.
create or replace function wants_email(who uuid, what text)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case what
       when 'messages'      then p.messages
       when 'replies'       then p.replies
       when 'connections'   then p.connections
       when 'events'        then p.events
       when 'announcements' then p.announcements
       when 'renewal'       then p.renewal
       else true
     end
     from notification_prefs p where p.profile_id = who),
    true
  )
$$;