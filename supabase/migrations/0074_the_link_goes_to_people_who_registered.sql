-- The link goes to people who are registered.
-- Run after 0073_an_admin_of_somewhere.sql. Safe to run more than once.
--
-- events.online_url is declared in 0001 with the comment "released after
-- registration", and the event page honours it to the letter: the Zoom
-- link and the full address appear only once somebody is registered and
-- only inside release_hours of the start, otherwise the page says the
-- link goes to people who are registered.
--
-- The database never honoured any of that. events_read admits
--
--     (visibility = 'public' and status = 'published')
--
-- with no role restriction, and select on events was never revoked from
-- anybody, so the public key that ships in every visitor's browser reads
-- every column. One unauthenticated request returns the Zoom room and the
-- street address of every published public event in the network. No
-- account, no registration, no waiting for release_hours.
--
-- A signed in member gets more: the second branch of events_read is
-- (is_member() and status = 'published'), so they read online_url for
-- every published event including private ones in Villages they cannot
-- attend. can_attend() is never consulted on a read.
--
-- 0067 solved this exact shape for a Circle's WhatsApp link: take the
-- column back and serve it through a view that asks the question the
-- product actually asks. The same pattern here.

-- ------------------------------------------------ take them back

revoke select on events from anon;
revoke select on events from authenticated;

-- Everything an event is, minus the two things that are earned. Keeping
-- this list explicit rather than using a revoke on two columns, because a
-- column revoke does nothing while a table grant stands, which is the
-- rule 0067 wrote down and this file is the fourth place it applies.
grant select (
  id, slug, village_id, host_id, title, description, cover_url,
  starts_at, ends_at, timezone, venue, is_online,
  visibility, audience, audience_id, tier,
  requires_approval, show_guest_list, capacity, visitor_places, waitlist,
  price_cents, member_price_cents, currency, refund_policy,
  reminders, status, release_hours, created_at, updated_at
) on events to anon, authenticated;

-- ------------------------------------------------ give them back

-- The view runs as its owner so the two columns can be served at all,
-- which means it has to ask the question itself rather than leaning on
-- row level security, exactly as circle_rooms does.
create or replace view event_details as
select
  e.id,
  e.slug,
  e.online_url,
  e.address
from events e
where
  -- Whoever is running it, at any time.
  is_admin(e.village_id)
  -- Or somebody who is actually going, once the details are released.
  or (
    e.starts_at - make_interval(hours => e.release_hours) <= now()
    and exists (
      select 1
      from event_registrations r
      where r.event_id = e.id
        and r.profile_id = auth.uid()
        and r.status in ('confirmed', 'pending')
    )
  );

alter view event_details set (security_invoker = off);

comment on view event_details is
  'The Zoom link and the full address of an event, to the people the '
  'product promises them to: whoever runs it, and whoever is registered '
  'once release_hours has come round. A cancelled, declined or waitlisted '
  'registration is not going, so it does not qualify.';

revoke all on event_details from anon;
grant select on event_details to authenticated;
