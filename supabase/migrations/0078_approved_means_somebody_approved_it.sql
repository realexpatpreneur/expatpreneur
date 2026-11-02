-- Approved means somebody approved it.
-- Run after 0077. Safe to run more than once.

-- ------------------------------------------- a course marks itself read
--
-- course_review_is_globals_alone is wired `before update` only, and
-- courses_create checks nothing but educator_id and is_paid. review is
-- plain text with no constraint. So a paying member could POST straight
-- at the data API with
--
--     {educator_id: <self>, status: 'published', review: 'approved'}
--
-- and courses_read and courses_public_read both treat that as live. The
-- course is on sale to the whole network, and on the public catalogue,
-- without the Global team ever seeing it.

create or replace function course_review_on_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_global_admin() then
    new.review      := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
  end if;
  return new;
end $$;

drop trigger if exists courses_review_on_insert on courses;
create trigger courses_review_on_insert before insert on courses
  for each row execute function course_review_on_insert();

comment on function course_review_on_insert() is
  'A course starts unread. Only the Global team decides otherwise, and '
  'only through the update guard beside this one.';

-- And the update guard sends a course back to be read again when the
-- things that were actually reviewed change. It compared the title, the
-- description and the summary, which left the price, the tier and what
-- the course promises free to change after approval.
create or replace function course_review_is_globals_alone()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_global_admin() then
    new.review      := old.review;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.review_note := old.review_note;

    if old.review = 'approved' and new.status = 'published'
       and (
         new.title, coalesce(new.description,''), coalesce(new.summary,''),
         new.price_cents, coalesce(new.member_price_cents, -1),
         new.tier, coalesce(new.outcomes, '{}'), new.public_listing
       ) is distinct from (
         old.title, coalesce(old.description,''), coalesce(old.summary,''),
         old.price_cents, coalesce(old.member_price_cents, -1),
         old.tier, coalesce(old.outcomes, '{}'), old.public_listing
       )
    then
      new.review := 'pending';
    end if;
  end if;
  return new;
end $$;

-- The comment on the old one said changing the lessons after approval
-- sends it back to be read again. lessons is a different table and had no
-- trigger at all, so an educator could get a free three lesson course
-- approved and then rewrite every lesson. Now it is true.
create or replace function lesson_change_reopens_review()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  the_course uuid := coalesce(new.course_id, old.course_id);
begin
  if not is_global_admin() then
    update courses
       set review = 'pending'
     where id = the_course
       and review = 'approved'
       and status = 'published';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists lessons_reopen_review on lessons;
create trigger lessons_reopen_review
  after insert or update or delete on lessons
  for each row execute function lesson_change_reopens_review();

-- ------------------------------------------ an announcement is local
--
-- announcements_read is `is_member() or is_admin(village_id)`, with no
-- Village in it, so every member of every Village can read every
-- Village's announcements through the data API, drafts included, because
-- the sent_at check lives only in the page. The home feed then shows the
-- three most recent in the network and labels each one with the reader's
-- own Village name.

drop policy if exists announcements_read on announcements;
create policy announcements_read on announcements
  for select using (
    is_admin(village_id)
    or (is_member() and village_id = my_village() and sent_at is not null)
  );

-- -------------------------------------------- marking a message read
--
-- The page sets read_at on the other person's messages when you open a
-- thread. messages has exactly two policies, read and insert, and no
-- update policy at all, so that statement has always matched zero rows,
-- which is not an error. The New chip on an inbox has never once cleared,
-- for anybody.

drop policy if exists messages_mark_read on messages;
create policy messages_mark_read on messages
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

grant update (read_at) on messages to authenticated;

comment on policy messages_mark_read on messages is
  'Only the person it was sent to, and only to mark it read. The column '
  'grant is what keeps it to that one column.';

-- ------------------------------------- putting a proposer in their Pod
--
-- Approving a Pod proposal creates the Pod with the proposer as its lead
-- and then inserts them into pod_members. pod_members_join is
-- `profile_id = auth.uid() and is_paid()`, and the acting Global admin is
-- not the proposer, so that insert has always been refused. The page says
-- it puts them in it and the proposer is notified that they lead it, and
-- the Pod shows nobody in it.

drop policy if exists pod_members_global_add on pod_members;
create policy pod_members_global_add on pod_members
  for insert with check (is_global_admin());

drop policy if exists group_members_global_add on group_members;
create policy group_members_global_add on group_members
  for insert with check (is_global_admin());
