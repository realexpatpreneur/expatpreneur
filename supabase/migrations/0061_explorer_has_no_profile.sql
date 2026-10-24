-- 0061_explorer_has_no_profile.sql
--
-- One line comes off the Explorer tile: 'Basic personal profile'.
--
-- Her framework gives an Explorer a profile because, in her model, an
-- Explorer registers. Here nobody has a profile until an invitation is
-- approved, so the line promised a visitor something that does not exist
-- for them. The other six are all reachable without an account, which is
-- why they stay.
--
-- This is a deliberate departure from her catalogue, agreed rather than
-- assumed. It goes back the day a visitor can make an account, which is
-- the open question about the front door.
--
-- Safe to run more than once.

update plans
set features = array_remove(features, 'Basic personal profile')
where slug = 'member'
  and 'Basic personal profile' = any (features);
