-- ExpatPreneurs Global: selling a course
-- Courses existed and could be taken. Nothing could be charged for, so an
-- educator writing for a week was writing for nothing. This adds a price,
-- a record of who bought what, and the rule that a paid course opens only
-- to somebody who paid for it.
-- Run after 0020_review_and_plans.sql.

alter table courses add column if not exists price_cents int not null default 0
  check (price_cents >= 0);
alter table courses add column if not exists member_price_cents int
  check (member_price_cents is null or member_price_cents >= 0);
alter table courses add column if not exists currency text not null default 'EUR';
alter table courses add column if not exists public_listing boolean not null default true;

comment on column courses.member_price_cents is
  'What a member pays. Null means the same as everybody else.';
comment on column courses.public_listing is
  'Whether somebody who is not a member can see and buy it.';

-- ------------------------------------------------------- what was bought

create table course_purchases (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id) on delete cascade,
  profile_id    uuid references profiles(id) on delete set null,
  guest_email   citext,
  guest_name    text,
  amount_cents  int not null default 0,
  currency      text not null default 'EUR',
  status        payment_status not null default 'pending',
  provider_ref  text,
  refunded_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint buyer_is_named check (profile_id is not null or guest_email is not null)
);
create trigger course_purchases_updated before update on course_purchases
  for each row execute function set_updated_at();
create index course_purchases_course_idx on course_purchases(course_id, created_at desc);

alter table course_purchases enable row level security;

-- The buyer, the educator whose course it is, and the Global team.
create policy purchases_read on course_purchases
  for select using (
    profile_id = auth.uid()
    or is_global_admin()
    or exists (
      select 1 from courses c
      where c.id = course_id and c.educator_id = auth.uid()
    )
  );

-- Writing is the payment webhook's job, which runs as the service role and
-- is not bound by these rules. Nobody marks their own purchase paid.
create policy purchases_refund on course_purchases
  for update using (is_global_admin()) with check (is_global_admin());

-- ------------------------------------------------ paying for the lessons

create or replace function has_paid_for(course uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from course_purchases p
    where p.course_id = course
      and p.profile_id = auth.uid()
      and p.status = 'paid'
  )
$$;

-- A free course works as it always did. A course with a price opens only
-- to somebody who paid, its educator, or the Global team.
drop policy if exists lessons_read on lessons;
create policy lessons_read on lessons
  for select using (
    exists (
      select 1 from courses c
      where c.id = course_id
        and (
          c.educator_id = auth.uid()
          or is_global_admin()
          or (
            c.status = 'published'
            and c.review = 'approved'
            and is_member()
            and (c.tier = 'all' or is_paid())
            and (
              coalesce(c.member_price_cents, c.price_cents) = 0
              or has_paid_for(c.id)
            )
          )
        )
    )
  );

drop policy if exists enrolments_join on enrolments;
create policy enrolments_join on enrolments
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1 from courses c
      where c.id = course_id
        and c.status = 'published'
        and c.review = 'approved'
        and (c.tier = 'all' or is_paid())
        and (
          coalesce(c.member_price_cents, c.price_cents) = 0
          or has_paid_for(c.id)
        )
    )
  );

grant select (
  id, slug, title, summary, level, duration, tier, status, created_at,
  price_cents, member_price_cents, currency, public_listing
) on courses to anon;