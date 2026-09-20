-- ExpatPreneurs Global: waiting lists and the address
-- Two things an event needs that were missing. A place that frees up should
-- go to the next person waiting, by itself. And the full address should not
-- sit on a page for weeks; it goes out nearer the time.
-- Run after 0013_notification_preferences.sql.

alter table events add column if not exists address text;
alter table events add column if not exists release_hours int not null default 48;

comment on column events.address is
  'The full address, shown to people who are going, nearer the time.';
comment on column events.release_hours is
  'How many hours before it starts the address and the link are shown.';

-- The promotion itself is done by the platform when a place frees up, so
-- that the person can be emailed the address at the same time.