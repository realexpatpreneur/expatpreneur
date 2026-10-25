-- 0066_membership_begins_at_payment.sql
--
-- Her flow, in her words: expression of interest, reviewed, approved,
-- invitation sent, account created, payment completed, membership
-- activated. The platform did the first six and then opened the whole
-- private side before anybody paid.
--
-- What changes is where the Circle is decided and where it is given.
-- The Local Admin still chooses it while approving, and it is held here
-- until the payment goes through rather than written onto the profile
-- straight away.
--
-- Nothing here changes who counts as a member. is_member() already
-- leaves out the 'invited' status, which is the state an approved
-- applicant now sits in until they pay, so no rule had to be loosened
-- or tightened and nobody already here is touched.
--
-- Safe to run more than once.

alter table applications
  add column if not exists circle_id uuid references circles(id) on delete set null;

comment on column applications.circle_id is
  'The Circle the Local Admin chose while approving. It is given to the '
  'member when their payment completes, not before.';
