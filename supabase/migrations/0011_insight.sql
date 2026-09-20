-- ExpatPreneurs Global: insight
-- What a Local Admin needs to know about their own Village, and what the
-- Global team needs to know about all of them. Counts only. Nothing here
-- reads anybody's messages or names who said what.
-- Run after 0010_leaders.sql.

-- People arriving, by month.
create view village_growth as
select p.village_id,
       date_trunc('month', coalesce(p.joined_on::timestamptz, p.created_at)) as month,
       count(*)::int as joined
from profiles p
where p.status <> 'removed'
group by p.village_id, month;

-- Whether asking for help here actually works, which is the one number
-- that says if a Village is alive.
create view village_asks as
select a.village_id,
       count(*)::int as posts,
       count(*) filter (where exists (
         select 1 from ask_replies r where r.ask_id = a.id))::int as answered,
       count(*) filter (where a.status = 'resolved')::int as resolved,
       count(*) filter (where a.created_at > now() - interval '30 days')::int as recent
from asks a
group by a.village_id;

-- Registering is easy. Turning up is the test.
create view village_turnout as
select e.village_id,
       count(distinct e.id)::int as events,
       count(r.id) filter (where r.status = 'confirmed')::int as registered,
       count(r.id) filter (where r.checked_in_at is not null)::int as attended
from events e
left join event_registrations r on r.event_id = e.id
where e.starts_at < now()
group by e.village_id;

create view village_rooms as
select s.village_id,
       count(distinct s.id)::int as sessions,
       count(p.id) filter (where p.state in ('admitted','left'))::int as came,
       coalesce(round(avg(p.seconds) filter (where p.seconds > 0) / 60)::int, 0)
         as average_minutes
from live_sessions s
left join session_participants p on p.session_id = s.id
where s.status = 'ended'
group by s.village_id;

-- One row per Village, for the Global team.
create view village_summary as
select v.id as village_id,
       v.name,
       v.status::text as status,
       (select count(*) from profiles p
         where p.village_id = v.id and p.status = 'active')::int as members,
       (select count(*) from profiles p
         where p.village_id = v.id and p.status = 'active' and p.plan = 'paid')::int as paid,
       (select count(*) from profiles p
         where p.village_id = v.id and p.status = 'quiet')::int as quiet,
       (select count(*) from circles c where c.village_id = v.id)::int as circles,
       (select count(*) from applications a
         where a.village_id = v.id and a.status in ('new','with_local','recommended'))::int
         as waiting,
       (select count(*) from events e
         where e.village_id = v.id and e.starts_at > now())::int as upcoming
from villages v;

-- Money, by month and by kind.
create view money_by_month as
select date_trunc('month', created_at) as month,
       kind::text as kind,
       currency,
       count(*)::int as payments,
       sum(amount_cents)::bigint as cents
from payments
where status = 'paid'
group by month, kind, currency;

-- Who stayed, when they were asked.
create view renewal_summary as
select cycle,
       village_id,
       count(*)::int as asked,
       count(*) filter (where status = 'staying')::int as staying,
       count(*) filter (where status = 'leaving')::int as leaving,
       count(*) filter (where status = 'pending')::int as waiting
from re_enrolments
group by cycle, village_id;

alter view village_growth   set (security_invoker = on);
alter view village_asks     set (security_invoker = on);
alter view village_turnout  set (security_invoker = on);
alter view village_rooms    set (security_invoker = on);
alter view village_summary  set (security_invoker = on);
alter view money_by_month   set (security_invoker = on);
alter view renewal_summary  set (security_invoker = on);