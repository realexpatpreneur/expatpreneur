-- A course is either a live workshop on a date, or something recorded
-- that people work through in their own time. The catalogue filters on
-- it, and the card says which it is, so it has to be a real column
-- rather than something read out of the duration text.

create type course_format as enum ('live', 'recorded');

alter table courses
  add column if not exists format course_format not null default 'recorded';

-- When it is live, when it happens. Null for anything recorded.
alter table courses
  add column if not exists starts_at timestamptz;

create index if not exists courses_format_idx on courses(format, status);