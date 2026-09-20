-- ExpatPreneurs Global: live sessions, part one
-- The community side of live video and audio: what a session is, who runs
-- it, who may come in, breakouts, recordings and where it streams out to.
-- No media provider is named here on purpose. Whatever carries the audio
-- and video later plugs into provider and provider_room, and nothing else
-- in this file changes.
-- Run after 0007_market_pathways.sql.

create type session_status    as enum ('scheduled','live','ended','cancelled');
create type session_role      as enum ('host','cohost','presenter','participant','observer');
create type participant_state as enum ('invited','waiting','admitted','removed','left');
create type recording_mode    as enum ('off','on_request','always');
create type recording_status  as enum ('pending','recording','processing','ready','failed');
create type stream_status     as enum ('idle','starting','live','ended','failed');

create table live_sessions (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  purpose         text,
  event_id        uuid references events(id) on delete set null,
  village_id      uuid references villages(id) on delete set null,

  -- Who it is for, using the same shape as events so one idea governs both.
  visibility      event_visibility not null default 'private',
  audience        scope_kind not null default 'village',
  audience_id     uuid,
  tier            event_tier not null default 'all',

  scheduled_start timestamptz not null,
  scheduled_end   timestamptz,
  timezone        text not null default 'Asia/Dubai',

  lobby           boolean not null default true,   -- hosts admit people
  chat            boolean not null default true,
  hand_raise      boolean not null default true,
  allow_guests    boolean not null default false,  -- people with no account
  max_participants int not null default 100 check (max_participants > 0),
  recording       recording_mode not null default 'off',

  status          session_status not null default 'scheduled',
  started_at      timestamptz,
  ended_at        timestamptz,

  provider        text,        -- filled in when a room is opened
  provider_room   text,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger live_sessions_updated before update on live_sessions
  for each row execute function set_updated_at();
create index live_sessions_when_idx on live_sessions(scheduled_start);
create index live_sessions_status_idx on live_sessions(status, scheduled_start);

-- Multi manager: several people can hold host powers at once, and the
-- community roles below grant them without anyone being listed here.
create table session_hosts (
  session_id uuid not null references live_sessions(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role       session_role not null default 'cohost',
  added_by   uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (session_id, profile_id)
);

create table session_participants (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references live_sessions(id) on delete cascade,
  profile_id   uuid references profiles(id) on delete cascade,
  guest_name   text,
  guest_email  citext,
  role         session_role not null default 'participant',
  state        participant_state not null default 'waiting',
  admitted_by  uuid references profiles(id) on delete set null,
  joined_at    timestamptz,
  left_at      timestamptz,
  seconds      int not null default 0,
  hand_raised  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint participant_member_or_guest check (
    (profile_id is not null and guest_email is null) or
    (profile_id is null and guest_email is not null)
  )
);
create trigger session_participants_updated before update on session_participants
  for each row execute function set_updated_at();
create unique index session_participant_member_unique
  on session_participants(session_id, profile_id) where profile_id is not null;
create unique index session_participant_guest_unique
  on session_participants(session_id, guest_email) where guest_email is not null;

-- A Circle of fifty splitting into tables is how these rooms actually work.
create table breakout_rooms (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  position   int not null default 1,
  name       text not null,
  topic      text,
  provider_room text,
  open       boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, position)
);

create table breakout_assignments (
  room_id        uuid not null references breakout_rooms(id) on delete cascade,
  participant_id uuid not null references session_participants(id) on delete cascade,
  primary key (room_id, participant_id)
);

-- Questions and hands, so a host can run a room rather than watch it.
create table session_questions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references live_sessions(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  body        text not null,
  votes       int not null default 0,
  answered_at timestamptz,
  created_at  timestamptz not null default now()
);

create table session_recordings (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references live_sessions(id) on delete cascade,
  provider_ref text,
  url          text,
  duration     text,
  size_bytes   bigint,
  status       recording_status not null default 'pending',
  consent_shown boolean not null default true,
  media_item_id uuid references media_items(id) on delete set null,
  lesson_id    uuid references lessons(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger session_recordings_updated before update on session_recordings
  for each row execute function set_updated_at();

-- Streaming out. The key is a secret, so only hosts and the Global team
-- can read these rows at all.
create table stream_targets (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references live_sessions(id) on delete cascade,
  platform    text not null,              -- youtube, linkedin, instagram, custom
  rtmp_url    text not null,
  stream_key  text not null,
  status      stream_status not null default 'idle',
  started_at  timestamptz,
  ended_at    timestamptz,
  error       text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------- roles and rules

-- Community roles become room roles without anyone setting it up: whoever
-- created it and anyone listed hosts; the Local Admin of the Village and
-- the host of the Circle co-host; the Global team hosts everywhere.
create or replace function session_role_for(s live_sessions, who uuid default auth.uid())
returns session_role
language sql stable security definer set search_path = public as $$
  select case
    when who is null then 'participant'::session_role
    when s.created_by = who then 'host'::session_role
    when exists (select 1 from session_hosts h where h.session_id = s.id and h.profile_id = who)
      then (select h.role from session_hosts h where h.session_id = s.id and h.profile_id = who)
    when exists (
      select 1 from member_roles r
      where r.profile_id = who and r.ended_at is null and r.role = 'global_admin'
    ) then 'host'::session_role
    when exists (
      select 1 from member_roles r
      where r.profile_id = who and r.ended_at is null
        and r.role = 'local_admin' and r.scope = 'village' and r.scope_id = s.village_id
    ) then 'cohost'::session_role
    when s.audience = 'circle' and exists (
      select 1 from circles c where c.id = s.audience_id and c.host_id = who
    ) then 'cohost'::session_role
    else 'participant'::session_role
  end
$$;

create or replace function is_session_host(s live_sessions, who uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select session_role_for(s, who) in ('host','cohost')
$$;

-- Who may come in. The same rules as events, so a member never has to
-- learn a second set.
create or replace function can_join_session(s live_sessions)
returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when s.visibility = 'public' and s.allow_guests then true
    when not is_member() then false
    when is_session_host(s) then true
    when s.tier = 'paid' and not is_paid() then false
    when s.audience = 'global' then true
    when s.audience = 'village' and s.audience_id = my_village() then true
    when s.audience = 'village' then is_paid()          -- visiting another Village
    when s.audience = 'circle' then s.audience_id = my_circle()
    when s.audience = 'group' then exists (
      select 1 from group_members g
      where g.group_id = s.audience_id and g.profile_id = auth.uid())
    when s.audience = 'pod' then exists (
      select 1 from pod_members p
      where p.pod_id = s.audience_id and p.profile_id = auth.uid())
    else is_member()
  end
$$;

alter table live_sessions        enable row level security;
alter table session_hosts        enable row level security;
alter table session_participants enable row level security;
alter table breakout_rooms       enable row level security;
alter table breakout_assignments enable row level security;
alter table session_questions    enable row level security;
alter table session_recordings   enable row level security;
alter table stream_targets       enable row level security;

create policy sessions_read on live_sessions
  for select using (
    (visibility = 'public' and status <> 'cancelled')
    or is_admin(village_id)
    or (is_member() and status <> 'cancelled')
  );
create policy sessions_write on live_sessions
  for all using (is_session_host(live_sessions) or is_admin(village_id))
  with check (is_session_host(live_sessions) or is_admin(village_id));

create policy session_hosts_read on session_hosts
  for select using (is_member() or is_admin());
create policy session_hosts_write on session_hosts
  for all using (
    exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  )
  with check (
    exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  );

-- A member puts themselves in the room, and only where they are allowed.
-- Hosts admit, promote and remove.
create policy participants_read on session_participants
  for select using (
    profile_id = auth.uid()
    or exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
    or exists (select 1 from live_sessions s where s.id = session_id and is_member() and can_join_session(s))
  );
create policy participants_join on session_participants
  for insert with check (
    (profile_id = auth.uid() and exists (
      select 1 from live_sessions s where s.id = session_id and can_join_session(s)))
    or (profile_id is null and exists (
      select 1 from live_sessions s
      where s.id = session_id and s.visibility = 'public' and s.allow_guests))
  );
create policy participants_update on session_participants
  for update using (
    profile_id = auth.uid()
    or exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  ) with check (true);

create policy breakouts_read on breakout_rooms
  for select using (
    exists (select 1 from live_sessions s where s.id = session_id
            and (is_session_host(s) or can_join_session(s)))
  );
create policy breakouts_write on breakout_rooms
  for all using (
    exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  ) with check (
    exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  );

create policy breakout_assign_read on breakout_assignments
  for select using (
    exists (select 1 from breakout_rooms b join live_sessions s on s.id = b.session_id
            where b.id = room_id and (is_session_host(s) or can_join_session(s)))
  );
create policy breakout_assign_write on breakout_assignments
  for all using (
    exists (select 1 from breakout_rooms b join live_sessions s on s.id = b.session_id
            where b.id = room_id and is_session_host(s))
  ) with check (
    exists (select 1 from breakout_rooms b join live_sessions s on s.id = b.session_id
            where b.id = room_id and is_session_host(s))
  );

create policy questions_read on session_questions
  for select using (
    exists (select 1 from live_sessions s where s.id = session_id
            and (is_session_host(s) or can_join_session(s)))
  );
create policy questions_ask on session_questions
  for insert with check (
    profile_id = auth.uid()
    and exists (select 1 from live_sessions s where s.id = session_id and can_join_session(s))
  );
create policy questions_manage on session_questions
  for update using (
    exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  ) with check (true);

-- A recording is open to the people the session was open to, once it is
-- ready. Hosts see it at every stage.
create policy recordings_read on session_recordings
  for select using (
    exists (
      select 1 from live_sessions s
      where s.id = session_id
        and (
          is_session_host(s)
          or (session_recordings.status = 'ready' and can_join_session(s))
        )
    )
  );
create policy recordings_write on session_recordings
  for all using (
    exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  ) with check (
    exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  );

-- Stream keys are secrets. Nobody but a host of that session reads them.
create policy streams_host_only on stream_targets
  for all using (
    exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  ) with check (
    exists (select 1 from live_sessions s where s.id = session_id and is_session_host(s))
  );

create view session_attendance as
select s.id as session_id,
       s.title,
       count(p.id) filter (where p.state in ('admitted','left'))::int as attended,
       count(p.id) filter (where p.state = 'waiting')::int as waiting,
       coalesce(round(avg(p.seconds) filter (where p.seconds > 0))::int, 0) as average_seconds
from live_sessions s
left join session_participants p on p.session_id = s.id
group by s.id;

alter view session_attendance set (security_invoker = on);