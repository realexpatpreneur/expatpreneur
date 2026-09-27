-- What a guest tells the host when they register for an open event.
--
-- A stranger coming to an open evening is the top of the funnel: the
-- host wants to know who is walking in, and what they came for. Three
-- columns, on the registration rather than on a person, because a guest
-- is not a member and may never be one.

alter table event_registrations
  add column if not exists guest_company text,
  add column if not exists guest_city text,
  add column if not exists guest_hopes text;