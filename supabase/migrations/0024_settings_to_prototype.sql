-- ExpatPreneurs Global: the settings screens, as the prototype specifies
-- The member, Village and system settings screens in the approved
-- prototype carry fields this build never had. This adds them.
-- Run after 0023_status_and_village_settings.sql.

-- ------------------------------------------------------------- a member

alter table profiles add column if not exists time_zone text not null default 'Gulf Standard Time (Dubai)';
alter table profiles add column if not exists language text not null default 'English';
alter table profiles add column if not exists show_business boolean not null default true;
alter table profiles add column if not exists findable_elsewhere boolean not null default true;

comment on column profiles.show_business is
  'Show my business in the public marketplace.';
comment on column profiles.findable_elsewhere is
  'Let members in other Villages find me.';

grant select (time_zone, language, show_business, findable_elsewhere)
  on profiles to authenticated;

-- The six switches the prototype lists, which is not the six this build
-- had. Digest and newsletter are new; the rest already existed.
alter table notification_prefs add column if not exists digest boolean not null default true;
alter table notification_prefs add column if not exists newsletter boolean not null default false;

-- Blocked members, which the Privacy tab lists.
create table if not exists blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  reason     text,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint not_yourself check (blocker_id <> blocked_id)
);

alter table blocks enable row level security;

create policy blocks_own on blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy blocks_read_admin on blocks
  for select using (is_global_admin());

-- ------------------------------------------------------------ a Village

alter table villages add column if not exists visitor_places int not null default 6;

comment on column villages.visitor_places is
  'Default places kept for visiting members at each event in this Village.';

-- --------------------------------------------------------- the network

-- System settings are rows rather than columns, so the Global team can
-- add one without a migration.
insert into settings (key, value, note) values
  ('network_name',        'ExpatPreneurs Global', 'Shown wherever the network names itself.'),
  ('domain',              'expatpreneurs.com',    'Placeholder until confirmed.'),
  ('default_language',    'English',              'The language the platform is written in.'),
  ('languages_prepared',  'French, Portuguese',   'Prepared but not live.'),
  ('support_email',       'hello@expatpreneurs.com', 'Where members are told to write.'),
  ('integration_payments','Not chosen yet',       'Stripe, or whoever takes the money.'),
  ('integration_youtube', 'Connected',            'Where recordings are streamed.'),
  ('integration_podcast', 'Not chosen yet',       'The podcast host.'),
  ('integration_newsletter','Not chosen yet',     'The newsletter tool.'),
  ('integration_crm',     'Not chosen yet',       'The CRM, if there is one.'),
  ('two_step_leaders',    'on',  'Two step sign in for everyone holding a role.'),
  ('two_step_members',    'off', 'Two step sign in for members. Optional.'),
  ('daily_backups',       'on',  'Kept for 30 days.'),
  ('access_ends_with_role','on', 'Remove access immediately when a role ends.')
on conflict (key) do nothing;

grant select on settings to anon;