-- ExpatPreneurs Global: reviewing what goes out, and the plans
-- Anyone holding the Educator role could publish a course straight to
-- members with nobody reading it first. And the plans and their prices
-- lived only in Stripe and in the code, so nothing could say what
-- membership costs without a developer.
-- Run after 0019_proposals_and_requests.sql.

-- ------------------------------------------------- reviewing a course

alter table courses add column if not exists review text not null default 'pending';
alter table courses add column if not exists reviewed_by uuid references profiles(id) on delete set null;
alter table courses add column if not exists reviewed_at timestamptz;
alter table courses add column if not exists review_note text;

comment on column courses.review is
  'pending, approved or refused. A course reaches members only once approved.';

-- Anything already published was live before this existed, so it keeps its
-- place rather than disappearing from under its learners.
update courses set review = 'approved', reviewed_at = now()
where status = 'published' and review = 'pending';

drop policy if exists courses_read on courses;
create policy courses_read on courses
  for select using (
    (status = 'published' and review = 'approved' and is_member())
    or educator_id = auth.uid()
    or is_global_admin()
  );

-- The public page shows only what has been read and approved.
drop policy if exists courses_public_read on courses;
create policy courses_public_read on courses
  for select using (status = 'published' and review = 'approved');

-- An educator writes their own course but does not decide its review.
create or replace function course_review_is_globals_alone()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_global_admin() then
    new.review      := old.review;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.review_note := old.review_note;

    -- Changing the lessons after approval sends it back to be read again.
    if old.review = 'approved' and new.status = 'published'
       and (new.title, coalesce(new.description,''), coalesce(new.summary,''))
        is distinct from (old.title, coalesce(old.description,''), coalesce(old.summary,''))
    then
      new.review := 'pending';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists courses_review_guard on courses;
create trigger courses_review_guard before update on courses
  for each row execute function course_review_is_globals_alone();

-- --------------------------------------------------------- the plans

create table plans (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,          -- member, paid
  name            text not null,
  blurb           text,
  price_cents     int not null default 0 check (price_cents >= 0),
  currency        text not null default 'EUR',
  interval        text not null default 'month', -- month, year, none
  stripe_price_id text,
  features        text[] not null default '{}',
  position        int not null default 1,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger plans_updated before update on plans
  for each row execute function set_updated_at();

alter table plans enable row level security;

create policy plans_read on plans for select using (active or is_global_admin());
create policy plans_write on plans
  for all using (is_global_admin()) with check (is_global_admin());

grant select on plans to anon;

insert into plans (slug, name, blurb, price_cents, currency, interval, position, features)
values
  ('member', 'Member',
   'Free, for as long as you are here. It comes with an accepted invitation.',
   0, 'EUR', 'none', 1,
   array[
     'Your Village, your Circle and its WhatsApp group',
     'Ask and Offer in your own Village',
     'The Directory of your Village',
     'Your Village''s events and resources',
     'Reading every Market Exploration post',
     'The suggestion box'
   ]),
  ('paid', 'Paid member',
   'The one paid plan. Members take it when their business starts needing the other cities.',
   0, 'EUR', 'month', 2,
   array[
     'Replying to members in any Village',
     'Asking to connect, and messaging once they accept',
     'The Directory of every Village',
     'Events in other Villages, as a visiting member',
     'Resources from every Village'
   ])
on conflict (slug) do nothing;