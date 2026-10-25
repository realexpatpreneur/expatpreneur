-- The members who are already here.
-- Run after 0068_nobody_promotes_themselves.sql.
--
-- The re-enrolment list brings the people who are already in a Village
-- onto the platform. Kristiane named some of them as holding Village
-- Membership without paying: herself and the Global team, the Local
-- Admins, the Growth Pod Leaders, and the Industry Hub hosts and
-- moderators. Script 177 gave that to a member one at a time, after
-- their account exists. This gives it to somebody before it does, so an
-- admin can mark them while pasting the list and the membership is
-- waiting for them when they claim their place.
--
-- Nothing here changes what happens to anybody not marked. They claim
-- their place and land exactly where they land today. Whether the
-- members who are already here should be asked to pay is her decision
-- and it is not taken in this file.
--
-- Safe to run more than once.

alter table founding_invites
  add column if not exists complimentary        boolean not null default false,
  add column if not exists complimentary_reason text,
  add column if not exists added_by             uuid references profiles(id) on delete set null;

comment on column founding_invites.complimentary is
  'Village Membership waiting for this person when they claim their '
  'place, without going through checkout. Set by the admin who adds '
  'them to the list.';

comment on column founding_invites.complimentary_reason is
  'Why it was given, in the admin''s own words. It is copied onto the '
  'profile when the place is claimed.';

comment on column founding_invites.added_by is
  'The admin who put this person on the list.';
