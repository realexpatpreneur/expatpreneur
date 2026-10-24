-- ExpatPreneurs Global: a member's time zone as an IANA name
--
-- Villages, events and live sessions have always stored a real zone,
-- 'Asia/Dubai'. A member's own time zone stored the words on the button
-- instead, 'Gulf Standard Time (Dubai)', because that select had no
-- value on its options. Nothing can be worked out from those words, so
-- an event time could never be shown in a member's own zone.
--
-- This converts the four labels that could have been stored, and moves
-- the column default. Run after 0053_footer_menus.sql. Safe to run
-- twice: the second run matches nothing.

update profiles set time_zone = 'Asia/Dubai'
  where time_zone = 'Gulf Standard Time (Dubai)';

update profiles set time_zone = 'Europe/Lisbon'
  where time_zone = 'Western European Time (Lisbon)';

update profiles set time_zone = 'Europe/Paris'
  where time_zone = 'Central European Time (Paris)';

update profiles set time_zone = 'Europe/Madrid'
  where time_zone = 'Central European Time (Madrid)';

alter table profiles alter column time_zone set default 'Asia/Dubai';

comment on column profiles.time_zone is
  'An IANA zone name, the same as villages.timezone and events.timezone.';