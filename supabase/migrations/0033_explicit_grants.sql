-- ExpatPreneurs Global: say the grants out loud
-- Supabase grants new tables to the anon and authenticated roles by
-- default, so everything has worked. Nothing in these migrations said so,
-- which means the platform depends on a project setting nobody can see
-- from the code. This states it for every table added since 0019.
--
-- Row level security still decides who sees which rows. A grant only says
-- the role may ask the question.
--
-- Deliberately not listed: profiles, circles, businesses and courses.
-- Those carry column grants written in earlier migrations, and granting
-- them again here would undo the privacy work.
-- Run after 0032_educator_profile.sql.

grant select, insert, update, delete on
  pod_proposals,
  transfer_requests,
  data_requests,
  refund_requests,
  payouts,
  course_purchases,
  articles,
  story_suggestions,
  notification_prefs,
  blocks,
  email_templates,
  pages,
  partnered_events,
  business_enquiries,
  newsletter_signups,
  photo_uses,
  leadership_suggestions,
  educator_profiles,
  shows,
  plans,
  settings
to authenticated;

-- The public reads these, and writes nothing but an enquiry or a sign up.
grant select on pages, shows, plans, educator_profiles, settings to anon;
grant insert on business_enquiries, newsletter_signups to anon;