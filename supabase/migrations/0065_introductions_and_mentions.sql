-- 0065_introductions_and_mentions.sql
--
-- Two small additions that let a new member arrive properly.
--
-- An introduction is a third kind of post in the Village, beside an ask
-- and an offer. It reuses Ask and Offer rather than inventing a second
-- place to write, because a Village already has one and because what a
-- member is looking for and what they can help with is the same shape as
-- an ask and an offer put together.
--
-- A reply can name the members it is pointing at. They are stored as
-- identifiers rather than parsed out of the text, so a name typed two
-- ways still reaches one person, and so the people named can be told.
--
-- Safe to run more than once.

alter type ask_kind add value if not exists 'introduction';

alter table ask_replies
  add column if not exists mentions uuid[] not null default '{}';

comment on column ask_replies.mentions is
  'Members this reply points at. They are told, and their names link.';

create index if not exists ask_replies_mentions_idx
  on ask_replies using gin (mentions);
