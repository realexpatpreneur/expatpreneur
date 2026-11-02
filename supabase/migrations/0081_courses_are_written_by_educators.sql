-- Courses are written by Educators.
-- Run after 0080. Safe to run more than once.
--
-- The Educator page tells a member that courses are written by Educators,
-- that they should ask the Global team about the role, and that until
-- then saving will be refused. None of that was true. Across all eighty
-- migrations the word educator appears twice: once in the enum that
-- lists the roles, and once inside holds_a_role(), which is about who may
-- open a live room. No policy anywhere referenced it.
--
-- courses_create asked only that the row be yours and that you pay, so
-- any paying member could write, price and publish a course, and the
-- warning above the form was decorative. The role is now what it says it
-- is, and only the Global team hands it out, which is what
-- roles_global_write already enforced.

create or replace function is_educator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from member_roles
    where profile_id = auth.uid()
      and role = 'educator'
      and ended_at is null
  )
$$;

comment on function is_educator() is
  'Holds the Educator role, which only a Global Admin can give, because '
  'roles_global_write is the only write policy on member_roles.';

drop policy if exists courses_create on courses;
create policy courses_create on courses
  for insert with check (
    (educator_id = auth.uid() and is_paid() and is_educator())
    or is_global_admin()
  );

-- Deliberately not touching courses_manage or courses_remove. Somebody
-- whose role is taken away keeps the courses they already wrote, and the
-- Global team can unpublish one through the review they already own.
-- Taking a role should not orphan work.
