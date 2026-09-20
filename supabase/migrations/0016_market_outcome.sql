-- ExpatPreneurs Global: what came of a market question
-- Ask & Offer posts can be closed with a line about what happened. Market
-- Exploration posts could not, so the board filled up with questions that
-- had long since been answered.
-- Run after 0015_profile_privacy.sql.

alter table market_posts add column if not exists outcome text;
alter table market_posts add column if not exists resolved_at timestamptz;