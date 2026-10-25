-- A Village has a picture.
-- Run after 0069_the_members_already_here.sql.
--
-- villages.cover_url has existed since 0001 and nothing could ever
-- write to it: the Village form in the Global workspace had no image
-- field and saveVillage never set the column. So it is null for every
-- Village, and three things that read it have been showing a flat
-- gradient instead of a photograph: the public Village page, the
-- Village cards, and the cover behind a profile.
--
-- The form has the field now. This fills in the three Villages that
-- already exist with the same photographs the stylesheet has been
-- using for them since the build began, at the width the prototype
-- asks for behind a profile. Anything already set is left alone, so a
-- picture chosen in the Global workspace is never overwritten and this
-- file is safe to run again.
--
-- These are the stock photographs from the prototype. Replace them
-- with the Village's own, from the Village page in the Global
-- workspace, whenever there is one.

update villages set cover_url =
  'https://images.unsplash.com/photo-1610809760161-efa84d5e3722?auto=format&fit=crop&w=1400&q=70'
where slug = 'dubai' and cover_url is null;

update villages set cover_url =
  'https://images.unsplash.com/photo-1569864971636-e9ea6f2ad857?auto=format&fit=crop&w=1400&q=70'
where slug = 'lisbon' and cover_url is null;

update villages set cover_url =
  'https://images.unsplash.com/photo-1499621574732-72324384dfbc?auto=format&fit=crop&w=1400&q=70'
where slug = 'paris' and cover_url is null;

comment on column villages.cover_url is
  'The Village photograph. The Village page shows it, the Village cards '
  'show it, and it is the cover behind every profile in that Village.';
