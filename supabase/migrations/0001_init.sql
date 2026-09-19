-- ExpatPreneurs Global, Phase 1 schema
-- Run order: 0001_init.sql, then 0002_rls.sql, then seed.sql
-- Everything here matches the prototype at expatpreneur.godwinmayaki.info

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------- types

create type village_status      as enum ('exploring','launching','open','paused','archived');
create type member_status       as enum ('invited','onboarding','active','quiet','left','removed');
create type plan_tier           as enum ('member','paid');
create type app_role            as enum ('local_admin','global_admin','circle_host','industry_lead','pod_lead','educator','media');
create type scope_kind          as enum ('global','village','circle','group','pod');
create type application_status  as enum ('new','with_local','recommended','waitlisted','declined','approved');
create type ask_kind            as enum ('ask','offer');
create type ask_status          as enum ('open','resolved','closed');
create type post_reach          as enum ('village','all_villages');
create type suggestion_about    as enum ('village','community');
create type suggestion_status   as enum ('new','read','discussing','actioned','not_now');
create type market_stage        as enum ('exploring','have_plan','ready','selling');
create type event_visibility    as enum ('public','private');
create type event_tier          as enum ('all','paid');
create type event_status        as enum ('draft','published','cancelled','past');
create type registration_status as enum ('pending','confirmed','waitlist','declined','cancelled');
create type payment_status      as enum ('pending','paid','refunded','failed');
create type resource_kind       as enum ('guide','template','recording');
create type report_status       as enum ('new','in_progress','escalated','closed');
create type whatsapp_task_kind  as enum ('add','remove','move');
create type media_kind          as enum ('article','video','episode');

-- ------------------------------------------------------------ utilities

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------- villages

create table villages (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  city        text not null,
  country     text not null,
  timezone    text not null default 'UTC',
  status      village_status not null default 'exploring',
  summary     text,
  cover_url   text,
  launched_on date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger villages_updated before update on villages
  for each row execute function set_updated_at();

create table circles (
  id          uuid primary key default gen_random_uuid(),
  village_id  uuid not null references villages(id) on delete cascade,
  name        text not null,
  capacity    int  not null default 50 check (capacity > 0 and capacity <= 50),
  host_id     uuid,                      -- profiles(id), set after profiles exists
  whatsapp_url text,
  status      text not null default 'preparing',   -- preparing, welcoming, full, closed
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (village_id, name)
);
create trigger circles_updated before update on circles
  for each row execute function set_updated_at();

-- ------------------------------------------------------------- profiles

create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null,
  headline       text,
  bio            text,
  avatar_url     text,
  email          citext not null,
  phone          text,
  village_id     uuid references villages(id) on delete set null,
  circle_id      uuid references circles(id) on delete set null,
  status         member_status not null default 'invited',
  plan           plan_tier not null default 'member',
  founding       boolean not null default false,
  industry       text,
  business_name  text,
  nationalities  text[] not null default '{}',   -- up to five, collected at application
  languages      text[] not null default '{}',
  markets_known  text[] not null default '{}',
  lived_in       text[] not null default '{}',
  can_help_with  text,
  looking_for    text,                            -- members only, never public
  public_profile boolean not null default true,
  joined_on      date,
  last_active_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint nationalities_max_five check (array_length(nationalities, 1) is null or array_length(nationalities, 1) <= 5)
);
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

create index profiles_village_idx    on profiles(village_id);
create index profiles_circle_idx     on profiles(circle_id);
create index profiles_nat_idx        on profiles using gin (nationalities);
create index profiles_lang_idx       on profiles using gin (languages);
create index profiles_markets_idx    on profiles using gin (markets_known);

alter table circles
  add constraint circles_host_fk foreign key (host_id) references profiles(id) on delete set null;

-- Scoped roles. A person can hold several.
create table member_roles (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  role        app_role not null,
  scope       scope_kind not null default 'global',
  scope_id    uuid,                       -- village, circle, group or pod
  starts_on   date not null default current_date,
  review_on   date,
  ended_at    timestamptz,
  created_at  timestamptz not null default now(),
  unique (profile_id, role, scope, scope_id)
);
create index member_roles_lookup on member_roles(profile_id, role, scope, scope_id) where ended_at is null;

-- --------------------------------------------------- invitation requests

create table applications (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  email          citext not null,
  phone          text,
  city           text,
  country        text,
  village_id     uuid references villages(id) on delete set null,
  business_name  text,
  industry       text,
  nationalities  text[] not null default '{}',
  languages      text[] not null default '{}',
  answers        jsonb not null default '{}'::jsonb,   -- the founder's own questions
  status         application_status not null default 'new',
  local_note     text,
  global_note    text,
  decline_reason text,
  reviewed_by    uuid references profiles(id) on delete set null,
  decided_by     uuid references profiles(id) on delete set null,
  decided_at     timestamptz,
  profile_id     uuid references profiles(id) on delete set null,  -- set when approved
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger applications_updated before update on applications
  for each row execute function set_updated_at();
create index applications_status_idx on applications(status, village_id);

create table city_suggestions (
  id            uuid primary key default gen_random_uuid(),
  city          text not null,
  country       text not null,
  email         citext,
  name          text,
  offers_admin  boolean not null default false,
  admin_answers jsonb not null default '{}'::jsonb,
  note          text,
  status        text not null default 'watching',   -- watching, exploring, not_now
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------- ask & offer

create table asks (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles(id) on delete cascade,
  kind        ask_kind not null,
  reach       post_reach not null default 'village',
  village_id  uuid references villages(id) on delete set null,
  category    text,
  title       text not null,
  body        text not null,
  status      ask_status not null default 'open',
  outcome     text,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger asks_updated before update on asks
  for each row execute function set_updated_at();
create index asks_village_idx on asks(village_id, status, created_at desc);

create table ask_replies (
  id         uuid primary key default gen_random_uuid(),
  ask_id     uuid not null references asks(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index ask_replies_ask_idx on ask_replies(ask_id, created_at);

-- -------------------------------------------------------- market exploration

create table market_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles(id) on delete cascade,
  title       text not null,
  body        text not null,
  industry    text not null,
  country     text not null,
  city        text,
  stage       market_stage not null default 'exploring',
  status      ask_status not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger market_posts_updated before update on market_posts
  for each row execute function set_updated_at();
create index market_posts_country_idx on market_posts(country, status, created_at desc);

create table market_replies (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references market_posts(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index market_replies_post_idx on market_replies(post_id, created_at);

-- ---------------------------------------------------------- suggestion box

-- author_id is null when the member chose to send it anonymously.
-- Nothing else identifying is stored on an anonymous suggestion.
create table suggestions (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references profiles(id) on delete set null,
  anonymous   boolean not null default false,
  about       suggestion_about not null default 'village',
  village_id  uuid references villages(id) on delete set null,
  title       text not null,
  body        text not null,
  status      suggestion_status not null default 'new',
  admin_note  text,
  to_global   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint anonymous_has_no_author check (not anonymous or author_id is null)
);
create trigger suggestions_updated before update on suggestions
  for each row execute function set_updated_at();
create index suggestions_status_idx on suggestions(status, created_at desc);

-- ----------------------------------------------------------------- events

create table events (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  village_id       uuid references villages(id) on delete set null,
  host_id          uuid references profiles(id) on delete set null,
  title            text not null,
  description      text,
  cover_url        text,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  timezone         text not null default 'Asia/Dubai',
  venue            text,
  is_online        boolean not null default false,
  online_url       text,                       -- released after registration
  visibility       event_visibility not null default 'private',
  audience         scope_kind not null default 'village',
  audience_id      uuid,                       -- village, circle, group or pod
  tier             event_tier not null default 'all',
  requires_approval boolean not null default false,
  show_guest_list  boolean not null default true,
  capacity         int not null default 30 check (capacity > 0),
  visitor_places   int not null default 0 check (visitor_places >= 0),
  waitlist         boolean not null default true,
  price_cents      int not null default 0 check (price_cents >= 0),
  currency         text not null default 'AED',
  refund_policy    text default '48h',
  reminders        jsonb not null default '{"week":false,"day":true,"hour":true,"changes":true,"thanks":true}'::jsonb,
  status           event_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger events_updated before update on events
  for each row execute function set_updated_at();
create index events_when_idx on events(starts_at) where status = 'published';
create index events_village_idx on events(village_id, starts_at);

-- A registration is either a member or a guest from outside the platform.
create table event_registrations (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  profile_id   uuid references profiles(id) on delete cascade,
  guest_name   text,
  guest_email  citext,
  is_visitor   boolean not null default false,   -- member from another Village
  status       registration_status not null default 'confirmed',
  note         text,                              -- what a visitor hopes to explore
  dietary      text,
  checked_in_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint member_or_guest check (
    (profile_id is not null and guest_email is null) or
    (profile_id is null and guest_email is not null)
  )
);
create trigger event_registrations_updated before update on event_registrations
  for each row execute function set_updated_at();
create unique index event_reg_member_unique on event_registrations(event_id, profile_id) where profile_id is not null;
create unique index event_reg_guest_unique  on event_registrations(event_id, guest_email) where guest_email is not null;

create table event_reminders_sent (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  registration_id uuid not null references event_registrations(id) on delete cascade,
  kind            text not null,     -- week, day, hour, change, thanks
  sent_at         timestamptz not null default now(),
  unique (registration_id, kind)
);

-- -------------------------------------------------------------- community

create table announcements (
  id          uuid primary key default gen_random_uuid(),
  village_id  uuid references villages(id) on delete cascade,
  author_id   uuid references profiles(id) on delete set null,
  audience    text not null default 'village',   -- village, circle:<id>, event:<id>
  title       text not null,
  body        text not null,
  send_at     timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table resources (
  id          uuid primary key default gen_random_uuid(),
  village_id  uuid references villages(id) on delete cascade,
  kind        resource_kind not null default 'guide',
  title       text not null,
  description text,
  url         text,
  all_villages boolean not null default false,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger resources_updated before update on resources
  for each row execute function set_updated_at();

create table media_items (
  id          uuid primary key default gen_random_uuid(),
  kind        media_kind not null,
  slug        text unique not null,
  title       text not null,
  summary     text,
  body        text,
  cover_url   text,
  external_url text,                     -- YouTube or podcast link
  duration    text,
  published_at timestamptz,
  member_only boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger media_items_updated before update on media_items
  for each row execute function set_updated_at();

create table messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index messages_pair_idx on messages(sender_id, recipient_id, created_at desc);

create table connection_requests (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  reason       text not null,
  status       text not null default 'pending',   -- pending, accepted, declined
  created_at   timestamptz not null default now(),
  unique (requester_id, recipient_id)
);

create table reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references profiles(id) on delete set null,
  subject_id   uuid references profiles(id) on delete set null,
  context      text,
  body         text not null,
  status       report_status not null default 'new',
  handled_by   uuid references profiles(id) on delete set null,
  action_note  text,
  escalated    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger reports_updated before update on reports
  for each row execute function set_updated_at();

create table whatsapp_tasks (
  id          uuid primary key default gen_random_uuid(),
  village_id  uuid references villages(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  kind        whatsapp_task_kind not null,
  group_name  text not null,
  done_at     timestamptz,
  done_by     uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_inbox_idx on notifications(profile_id, created_at desc);

-- ---------------------------------------------------------------- money

create table subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references profiles(id) on delete cascade,
  plan               plan_tier not null default 'paid',
  status             text not null default 'active',   -- active, past_due, cancelled
  provider           text not null default 'stripe',
  provider_customer  text,
  provider_subscription text,
  current_period_end timestamptz,
  cancel_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger subscriptions_updated before update on subscriptions
  for each row execute function set_updated_at();
create index subscriptions_profile_idx on subscriptions(profile_id, status);

create table payments (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references profiles(id) on delete set null,
  guest_email   citext,
  kind          text not null,             -- membership, event_ticket
  event_id      uuid references events(id) on delete set null,
  amount_cents  int not null,
  currency      text not null default 'EUR',
  status        payment_status not null default 'pending',
  provider      text not null default 'stripe',
  provider_ref  text,
  created_at    timestamptz not null default now()
);
create index payments_profile_idx on payments(profile_id, created_at desc);

-- ------------------------------------------------------------- audit log

create table audit_log (
  id          bigserial primary key,
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_entity_idx on audit_log(entity, entity_id, created_at desc);

-- ----------------------------------------------------------------- views

-- Internal only. Never exposed on any public page or in writing to members.
create view village_nationality_mix as
select v.id as village_id,
       v.name as village,
       n.nationality,
       count(*)::int as members,
       round(100.0 * count(*) / nullif(sum(count(*)) over (partition by v.id), 0), 1) as percent
from villages v
join profiles p on p.village_id = v.id and p.status = 'active'
cross join lateral unnest(p.nationalities) as n(nationality)
group by v.id, v.name, n.nationality;

create view circle_capacity as
select c.id as circle_id, c.village_id, c.name, c.capacity,
       count(p.id)::int as members,
       c.capacity - count(p.id)::int as places_left
from circles c
left join profiles p on p.circle_id = c.id and p.status in ('active','onboarding')
group by c.id;

create view event_attendance as
select e.id as event_id, e.title, e.capacity,
       count(*) filter (where r.status = 'confirmed')::int as confirmed,
       count(*) filter (where r.status = 'pending')::int   as awaiting_approval,
       count(*) filter (where r.status = 'waitlist')::int  as waitlisted,
       count(*) filter (where r.checked_in_at is not null)::int as checked_in,
       count(*) filter (where r.is_visitor and r.status = 'confirmed')::int as visitors
from events e
left join event_registrations r on r.event_id = e.id
group by e.id;

-- Views run with the caller's rights, so the access rules below still apply
-- to anyone reading them.
alter view village_nationality_mix set (security_invoker = on);
alter view circle_capacity        set (security_invoker = on);
alter view event_attendance       set (security_invoker = on);
