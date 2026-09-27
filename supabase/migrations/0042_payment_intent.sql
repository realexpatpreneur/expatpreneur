-- Remembering which Stripe payment a row belongs to.
--
-- A refund arrives naming the payment intent. We were storing only the
-- checkout session, so finding the right row meant asking Stripe about
-- every paid row in turn until one matched. That is fine with ten
-- payments and unusable with a thousand.

alter table payments
  add column if not exists provider_intent text;

alter table course_purchases
  add column if not exists provider_intent text;

create index if not exists payments_intent_idx
  on payments(provider_intent) where provider_intent is not null;

create index if not exists course_purchases_intent_idx
  on course_purchases(provider_intent) where provider_intent is not null;