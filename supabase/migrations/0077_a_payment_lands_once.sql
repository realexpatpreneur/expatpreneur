-- A payment lands once, and a subscription can be written at all.
-- Run after 0076. Safe to run more than once.
--
-- The webhook upserts subscriptions with onConflict profile_id. The only
-- index on that table is
--
--     create index subscriptions_profile_idx on subscriptions(profile_id, status)
--
-- which is neither unique nor on profile_id alone. PostgREST turns the
-- upsert into INSERT ... ON CONFLICT (profile_id) DO UPDATE and Postgres
-- refuses it outright with 42P10, there is no unique or exclusion
-- constraint matching the ON CONFLICT specification. The call does not
-- destructure its error, so the handler carries on and answers Stripe
-- with a 200.
--
-- So the subscriptions table is empty for every paying member and always
-- has been, and everything built on it has never worked: cancelling a
-- membership, changing a card, seeing invoices, the renewal date, and the
-- notice when a payment fails. A returning payer also becomes a second
-- Stripe customer every time, because the code looks for the stored
-- customer id here and never finds one.
--
-- Separately, nothing about the webhook is idempotent. Stripe delivers at
-- least once and redelivers on a timeout, and payments and
-- course_purchases have only non-unique indexes on the provider
-- reference, so a redelivery writes the payment twice, pays the educator
-- twice, raises a second WhatsApp task and sends the notifications again.

-- ---------------------------------------------- one row per member

-- Should be a no-op: the upsert has never succeeded, so the table is
-- empty. Written to be safe if any row was ever put there by hand.
delete from subscriptions a
 using subscriptions b
 where a.profile_id = b.profile_id
   and a.created_at < b.created_at;

alter table subscriptions
  drop constraint if exists subscriptions_profile_key;

alter table subscriptions
  add constraint subscriptions_profile_key unique (profile_id);

comment on constraint subscriptions_profile_key on subscriptions is
  'What the webhook upserts against. Without it the upsert is refused by '
  'Postgres and the table stays empty.';

-- -------------------------------------------- one row per payment

-- provider_ref is Stripe's own id for the thing that happened. Two rows
-- carrying the same one are the same event delivered twice.
delete from payments a
 using payments b
 where a.provider_ref is not null
   and a.provider_ref = b.provider_ref
   and a.id > b.id;

create unique index if not exists payments_provider_ref_key
  on payments (provider_ref) where provider_ref is not null;

delete from course_purchases a
 using course_purchases b
 where a.provider_ref is not null
   and a.provider_ref = b.provider_ref
   and a.id > b.id;

create unique index if not exists course_purchases_provider_ref_key
  on course_purchases (provider_ref) where provider_ref is not null;

comment on index payments_provider_ref_key is
  'Stripe delivers at least once. A redelivery now collides here instead '
  'of writing the payment a second time.';
