-- A group link is an invitation to a private room.
-- Run after 0074. Safe to run more than once.
--
-- 0067 found this and wrote it down: "any signed in member could read
-- every Circle's WhatsApp link, in any Village, because the public read
-- policy says true for everybody and the column was granted to every
-- signed in role. A group link is an invitation to a private room." It
-- fixed circles and left industry_groups and pods alone, even though
-- 0057 had just moved both inside the paid membership.
--
-- So today any signed in token reads every Hub's and every Pod's invite
-- link: a member who joined nothing, a member who never paid, and a
-- member removed from the community who still holds a token. The
-- interface gates the link on having joined. The database does not.
--
-- The same file also closes the views that forgot security_invoker. A
-- view without it runs as its owner, so the row level security on
-- everything underneath is simply skipped.

-- ------------------------------------------------- the room links

revoke select on industry_groups from anon, authenticated;
grant select (
  id, slug, name, industry, description, lead_id, status,
  cover_url, created_at, updated_at
) on industry_groups to anon, authenticated;

revoke select on pods from anon, authenticated;
grant select (
  id, slug, name, purpose, village_id, lead_id, capacity, cadence,
  status, created_at, updated_at
) on pods to anon, authenticated;

-- Served the way circle_rooms serves a Circle's: as the owner, so the
-- column can be read at all, with the question asked inside the view.
create or replace view group_rooms as
select g.id, g.slug, g.name, g.whatsapp_url
from industry_groups g
where is_global_admin()
   or g.lead_id = auth.uid()
   or (
     is_paid()
     and exists (
       select 1 from group_members m
       where m.group_id = g.id and m.profile_id = auth.uid()
     )
   );

alter view group_rooms set (security_invoker = off);
revoke all on group_rooms from anon;
grant select on group_rooms to authenticated;

comment on view group_rooms is
  'A Hub''s WhatsApp link, to its lead, to the Global team, and to a '
  'paying member who has joined it. Nobody else.';

create or replace view pod_rooms as
select p.id, p.slug, p.name, p.whatsapp_url
from pods p
where is_global_admin()
   or p.lead_id = auth.uid()
   or (
     is_paid()
     and exists (
       select 1 from pod_members m
       where m.pod_id = p.id and m.profile_id = auth.uid()
     )
   );

alter view pod_rooms set (security_invoker = off);
revoke all on pod_rooms from anon;
grant select on pod_rooms to authenticated;

comment on view pod_rooms is
  'A Pod''s WhatsApp link, to its lead, to the Global team, and to a '
  'paying member who has joined it. Nobody else.';

-- --------------------------------- the views that skipped the rules

-- The nationality balance. 0001 set security_invoker on this view and
-- said why: views run with the caller's rights, so the access rules still
-- apply. 0030 dropped and recreated it and never put it back, and made
-- circle_mix the same way.
--
-- Turning the setting back on would break both pages, because the views
-- read profiles.nationalities and 0015 revoked that column from every
-- signed in role on purpose. So the guard goes inside the view, which is
-- how member_records and circle_rooms already do it.

drop view if exists circle_mix;
drop view if exists village_nationality_mix;

create view village_nationality_mix as
select
  v.id   as village_id,
  v.name as village,
  n.nationality,
  count(*)::int as members,
  (select count(*) from profiles p2
    where p2.village_id = v.id and p2.status = 'active')::int as people,
  round(
    100.0 * count(*) / nullif(
      (select count(*) from profiles p3
        where p3.village_id = v.id and p3.status = 'active'), 0
    ), 1
  ) as percent
from villages v
join profiles p on p.village_id = v.id and p.status = 'active'
cross join lateral unnest(p.nationalities) as n(nationality)
where is_global_admin() or is_local_admin(v.id)
group by v.id, v.name, n.nationality;

alter view village_nationality_mix set (security_invoker = off);
revoke all on village_nationality_mix from anon;
grant select on village_nationality_mix to authenticated;

comment on view village_nationality_mix is
  'Internal only. The balance rule is never shown on a public page or '
  'written to a member, so the view answers nobody but the Global team '
  'and the Local Admin of that Village.';

create view circle_mix as
select
  c.id   as circle_id,
  c.village_id,
  c.name as circle_name,
  n.nationality,
  count(*)::int as members,
  (select count(*) from profiles p2
    where p2.circle_id = c.id and p2.status = 'active')::int as people,
  round(
    100.0 * count(*) / nullif(
      (select count(*) from profiles p3
        where p3.circle_id = c.id and p3.status = 'active'), 0
    ), 1
  ) as percent
from circles c
join profiles p on p.circle_id = c.id and p.status = 'active'
cross join lateral unnest(p.nationalities) as n(nationality)
where is_global_admin() or is_local_admin(c.village_id)
group by c.id, c.village_id, c.name, n.nationality;

alter view circle_mix set (security_invoker = off);
revoke all on circle_mix from anon;
grant select on circle_mix to authenticated;

comment on view circle_mix is
  'Internal only, and narrower than the Village view: a Circle holds at '
  'most fifty people, so a nationality held by one of them names that '
  'person.';

-- Who is owed a recognition payment. It enumerated every role holder in
-- the network, with their role, to any signed in member. The body is
-- unchanged; only the guard is new, so the columns the page reads stay
-- exactly as they were.
drop view if exists recognition_due;
create view recognition_due as
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
  and is_global_admin()
group by r.profile_id;

alter view recognition_due set (security_invoker = off);
revoke all on recognition_due from anon;
grant select on recognition_due to authenticated;

-- Every purchase on the platform, with buyer ids, guest email addresses,
-- amounts and each educator's cut, readable by anybody signed in. The
-- body is unchanged and the guard is new, so /global/money and
-- /educator/sales keep the columns they read.
drop view if exists course_sales;
create view course_sales as
select
  p.id           as purchase_id,
  p.course_id,
  c.title        as course_title,
  c.educator_id,
  p.profile_id   as buyer_id,
  p.guest_email,
  p.guest_name,
  p.amount_cents,
  p.currency,
  p.status,
  p.refunded_at,
  date_trunc('month', p.created_at)::date as month,
  round(p.amount_cents *
        (select value::numeric from settings where key = 'educator_share') / 100
  )::int as educator_cents,
  p.created_at
from course_purchases p
join courses c on c.id = p.course_id
where is_global_admin() or c.educator_id = auth.uid();

alter view course_sales set (security_invoker = off);
revoke all on course_sales from anon;
grant select on course_sales to authenticated;

comment on view course_sales is
  'A sale, to the Global team and to the educator who made it. It carries
   a guest email address, so it answers nobody else.';

-- How the re-enrolment of each Village is going. Aggregates, but they are
-- the shape of a private WhatsApp roster, and 0038 granted the view to
-- every signed in account. Body unchanged, guard added.
drop view if exists founding_progress;
create view founding_progress as
  select
    village_id,
    count(*) as on_the_list,
    count(*) filter (where status = 're_enrolled') as re_enrolled,
    count(*) filter (where status in ('invited', 'reminded')) as waiting,
    count(*) filter (where status = 'declined') as declined,
    count(*) filter (where status = 'removed') as removed
  from founding_invites
  where is_global_admin() or is_local_admin(village_id)
  group by village_id;

alter view founding_progress set (security_invoker = off);
revoke all on founding_progress from anon;
grant select on founding_progress to authenticated;

-- Deliberately as it was: this one exists so a visitor who cannot read
-- profiles can still see how many members a Village has. Saying so in the
-- file, so nobody tidies it into a fault later.
alter view village_public_counts set (security_invoker = off);

comment on view village_public_counts is
  'Runs as its owner on purpose. It serves counts to visitors who cannot '
  'read profiles, which is the whole point of it.';
