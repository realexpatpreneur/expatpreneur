-- ExpatPreneurs Global, Phase 3: learning
-- A course belongs to an educator. Lessons sit in order inside it. A member
-- enrols, works through it, and what they finished is theirs to see.
-- Run after 0005_re_enrolment.sql.

create type course_status as enum ('draft','published','retired');
create type course_tier   as enum ('all','paid');

create table courses (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  summary     text,
  description text,
  educator_id uuid references profiles(id) on delete set null,
  level       text not null default 'anyone',      -- anyone, starting out, running it
  duration    text,                                 -- '4 lessons, about an hour'
  tier        course_tier not null default 'all',
  status      course_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger courses_updated before update on courses
  for each row execute function set_updated_at();

create table lessons (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses(id) on delete cascade,
  position   int not null default 1,
  title      text not null,
  body       text,
  video_url  text,
  duration   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);
create trigger lessons_updated before update on lessons
  for each row execute function set_updated_at();

create table enrolments (
  course_id    uuid not null references courses(id) on delete cascade,
  profile_id   uuid not null references profiles(id) on delete cascade,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  primary key (course_id, profile_id)
);

create table lesson_progress (
  lesson_id  uuid not null references lessons(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  done_at    timestamptz not null default now(),
  primary key (lesson_id, profile_id)
);

create view course_progress as
select e.course_id,
       e.profile_id,
       (select count(*) from lessons l where l.course_id = e.course_id)::int as lessons,
       (select count(*) from lesson_progress p
         join lessons l on l.id = p.lesson_id
        where l.course_id = e.course_id and p.profile_id = e.profile_id)::int as done
from enrolments e;

alter view course_progress set (security_invoker = on);

-- ------------------------------------------------------------------ rules

alter table courses         enable row level security;
alter table lessons         enable row level security;
alter table enrolments      enable row level security;
alter table lesson_progress enable row level security;

-- Members see published courses. A paid course is listed for everyone but
-- only opens for paid members, which the lesson rule below enforces.
create policy courses_read on courses
  for select using (
    (status = 'published' and is_member())
    or educator_id = auth.uid()
    or is_global_admin()
  );
create policy courses_write on courses
  for all using (educator_id = auth.uid() or is_global_admin())
  with check (educator_id = auth.uid() or is_global_admin());

create policy lessons_read on lessons
  for select using (
    exists (
      select 1 from courses c
      where c.id = course_id
        and (
          c.educator_id = auth.uid()
          or is_global_admin()
          or (c.status = 'published' and is_member() and (c.tier = 'all' or is_paid()))
        )
    )
  );
create policy lessons_write on lessons
  for all using (
    exists (select 1 from courses c where c.id = course_id
            and (c.educator_id = auth.uid() or is_global_admin()))
  )
  with check (
    exists (select 1 from courses c where c.id = course_id
            and (c.educator_id = auth.uid() or is_global_admin()))
  );

-- Members enrol themselves, and only where the course is open to them.
create policy enrolments_read on enrolments
  for select using (
    profile_id = auth.uid()
    or is_global_admin()
    or exists (select 1 from courses c where c.id = course_id and c.educator_id = auth.uid())
  );
create policy enrolments_join on enrolments
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1 from courses c
      where c.id = course_id and c.status = 'published'
        and (c.tier = 'all' or is_paid())
    )
  );
create policy enrolments_update on enrolments
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy enrolments_leave on enrolments
  for delete using (profile_id = auth.uid());

create policy progress_own on lesson_progress
  for select using (
    profile_id = auth.uid()
    or is_global_admin()
    or exists (
      select 1 from lessons l join courses c on c.id = l.course_id
      where l.id = lesson_id and c.educator_id = auth.uid()
    )
  );
create policy progress_mark on lesson_progress
  for insert with check (profile_id = auth.uid());
create policy progress_unmark on lesson_progress
  for delete using (profile_id = auth.uid());