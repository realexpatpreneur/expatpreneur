-- ExpatPreneurs Global: recognition, and partnered events
-- Two things the prototype specifies that this build never had. The first
-- is a monthly thank you to the people who run Villages, Circles, Groups
-- and Pods, paid through the same system as educators. The second is a
-- sponsored event, approved by Global with conditions attached before
-- anything is agreed.
-- Run after 0026_pages.sql.

-- ----------------------------------------------------------- recognition

-- Payouts were written for educators alone. They now carry what they are
-- for, so a recognition run and a course payout sit in one place.
alter table payouts add column if not exists kind text not null default 'course';
alter table payouts add column if not exists role text;
alter table payouts rename column educator_id to person_id;

comment on column payouts.kind is 'course or recognition.';
comment on column payouts.role is 'For a recognition payout, the role it recognises.';

-- The amounts, which the Global team sets and can change.
insert into settings (key, value, note) values
  ('recognition_local_admin',  '0', 'Monthly recognition for a Local Admin.'),
  ('recognition_circle_host',  '0', 'Monthly recognition for a Circle Host.'),
  ('recognition_lead',         '0', 'Monthly recognition for an Industry Lead or Pod Lead.'),
  ('recognition_currency',     'EUR', 'The currency recognition is paid in.'),
  ('recognition_paid_from',    'Membership and ticket income',
   'Where the money comes from.')
on conflict (key) do nothing;

-- Everyone who would be recognised this month, with the role that decides
-- the amount. One row per person, taking the highest amount they qualify
-- for rather than paying somebody twice.
create or replace view recognition_due as
select
  r.profile_id,
  min(case r.role
        when 'local_admin'    then 1
        when 'circle_host'    then 2
        when 'industry_lead'  then 3
        when 'pod_lead'       then 3
      end) as rank,
  (array_agg(r.role order by case r.role
        when 'local_admin'    then 1
        when 'circle_host'    then 2
        when 'industry_lead'  then 3
        when 'pod_lead'       then 3 end))[1] as role,
  (select value from settings where key = 'recognition_currency') as currency
from member_roles r
where r.ended_at is null
  and r.role in ('local_admin', 'circle_host', 'industry_lead', 'pod_lead')
group by r.profile_id;

-- ------------------------------------------------------ partnered events

create table partnered_events (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references events(id) on delete set null,
  village_id   uuid references villages(id) on delete set null,
  proposed_by  uuid references profiles(id) on delete set null,
  title        text not null,
  partner      text not null,
  partner_gets text not null,
  members_get  text not null,
  conditions   text,
  status       text not null default 'new',   -- new, approved, declined
  decided_by   uuid references profiles(id) on delete set null,
  decided_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger partnered_events_updated before update on partnered_events
  for each row execute function set_updated_at();

alter table partnered_events enable row level security;

-- A Local Admin proposes one for their own Village. Only Global decides.
create policy partners_propose on partnered_events
  for insert with check (is_admin(village_id));
create policy partners_read on partnered_events
  for select using (is_admin(village_id) or is_global_admin());
create policy partners_decide on partnered_events
  for update using (is_global_admin()) with check (is_global_admin());