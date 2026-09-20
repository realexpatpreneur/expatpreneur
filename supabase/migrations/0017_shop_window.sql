-- ExpatPreneurs Global: the shop window
-- The public Discover page shows what the network is made of: Villages,
-- Circles, Industry Groups and the courses members write. Circles, Groups
-- and courses were readable by members only, so a stranger saw an empty
-- page. This opens the names and descriptions to everybody, and nothing
-- else: WhatsApp links stay with members, as they always were.
-- Run after 0016_market_outcome.sql.

-- ------------------------------------------------------------- circles

create policy circles_public_read on circles
  for select using (true);

revoke select on circles from anon;
grant select (id, village_id, name, capacity, status, created_at)
  on circles to anon;

-- ------------------------------------------------------ industry groups

create policy groups_public_read on industry_groups
  for select using (true);

revoke select on industry_groups from anon;
grant select (id, slug, name, industry, description, status, created_at)
  on industry_groups to anon;

-- --------------------------------------------------------------- courses

-- Published courses only. A draft is nobody's business but its educator's.
create policy courses_public_read on courses
  for select using (status = 'published');

revoke select on courses from anon;
grant select (id, slug, title, summary, level, duration, tier, status, created_at)
  on courses to anon;