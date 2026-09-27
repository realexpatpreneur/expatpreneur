-- What somebody will be able to do after taking a course.
--
-- The course page leads with this in the prototype, before the lessons
-- and before the price, because it is the only thing a buyer actually
-- wants to know.

alter table courses
  add column if not exists outcomes text[] not null default '{}';