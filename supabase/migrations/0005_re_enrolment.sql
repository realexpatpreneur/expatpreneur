-- ExpatPreneurs Global, Phase 2: re-enrolment and member care
-- Membership is renewed by a decision once a year, not by silence. A round
-- is opened by an admin, every active member is asked, and the answer is
-- theirs to give.
-- Run after 0004_businesses_and_jobs.sql.

create type renewal_status as enum ('pending','staying','leaving','no_answer');

create table re_enrolments (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  village_id  uuid references villages(id) on delete set null,
  cycle       text not null,                    -- '2027', or '2027 H1'
  status      renewal_status not null default 'pending',
  note        text,                             -- what the member said
  admin_note  text,                             -- kept internally
  asked_at    timestamptz not null default now(),
  decided_at  timestamptz,
  unique (profile_id, cycle)
);
create index re_enrolments_cycle_idx on re_enrolments(cycle, status);

-- What a Local Admin needs to see about how someone is doing. Counts only,
-- no reading of anybody's messages.
create view member_activity as
select p.id as profile_id,
       p.village_id,
       (select count(*) from asks a where a.author_id = p.id)::int as posts,
       (select count(*) from ask_replies r where r.author_id = p.id)::int as replies,
       (select count(*) from event_registrations e
         where e.profile_id = p.id and e.status = 'confirmed')::int as events,
       (select count(*) from event_registrations e
         where e.profile_id = p.id and e.checked_in_at is not null)::int as attended,
       greatest(
         coalesce(p.last_active_at, p.created_at),
         coalesce((select max(a.created_at) from asks a where a.author_id = p.id), p.created_at),
         coalesce((select max(r.created_at) from ask_replies r where r.author_id = p.id), p.created_at)
       ) as last_seen
from profiles p;

alter view member_activity set (security_invoker = on);

alter table re_enrolments enable row level security;

-- A member sees and answers their own. Admins see their Village.
create policy re_enrolments_own_read on re_enrolments
  for select using (profile_id = auth.uid() or is_admin(village_id));
create policy re_enrolments_own_answer on re_enrolments
  for update using (profile_id = auth.uid() or is_admin(village_id))
  with check (profile_id = auth.uid() or is_admin(village_id));
create policy re_enrolments_admin_open on re_enrolments
  for insert with check (is_admin(village_id));