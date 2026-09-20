-- ExpatPreneurs Global: what an educator earns
-- Courses can be sold. Nothing said what the educator is owed, what the
-- platform keeps, or what happens when a learner wants their money back.
-- Run after 0021_course_sales.sql.

-- The share is a number the Global team can change without a deploy, and
-- it is recorded on each payout so an old one does not change when it does.
create table settings (
  key        text primary key,
  value      text not null,
  note       text,
  updated_at timestamptz not null default now()
);
create trigger settings_updated before update on settings
  for each row execute function set_updated_at();

alter table settings enable row level security;
create policy settings_read on settings for select using (is_member());
create policy settings_write on settings
  for all using (is_global_admin()) with check (is_global_admin());

insert into settings (key, value, note) values
  ('educator_share', '70', 'The percentage of a course sale that goes to the educator.')
on conflict (key) do nothing;

-- ----------------------------------------------------- asking for a refund

create table refund_requests (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references course_purchases(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  reason      text not null,
  status      text not null default 'new',    -- new, approved, refused
  note        text,
  handled_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger refund_requests_updated before update on refund_requests
  for each row execute function set_updated_at();

alter table refund_requests enable row level security;

create policy refunds_ask on refund_requests
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1 from course_purchases p
      where p.id = purchase_id and p.profile_id = auth.uid() and p.status = 'paid'
    )
  );
create policy refunds_read on refund_requests
  for select using (
    profile_id = auth.uid()
    or is_global_admin()
    or exists (
      select 1 from course_purchases p
      join courses c on c.id = p.course_id
      where p.id = purchase_id and c.educator_id = auth.uid()
    )
  );
create policy refunds_decide on refund_requests
  for update using (is_global_admin()) with check (is_global_admin());

-- ------------------------------------------------------------- payouts

create table payouts (
  id           uuid primary key default gen_random_uuid(),
  educator_id  uuid not null references profiles(id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  gross_cents  int not null default 0,
  share        int not null default 70,       -- what the share was at the time
  net_cents    int not null default 0,
  currency     text not null default 'EUR',
  status       text not null default 'due',   -- due, paid
  reference    text,
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (educator_id, period_start, period_end, currency)
);
create trigger payouts_updated before update on payouts
  for each row execute function set_updated_at();

alter table payouts enable row level security;

create policy payouts_read on payouts
  for select using (educator_id = auth.uid() or is_global_admin());
create policy payouts_write on payouts
  for all using (is_global_admin()) with check (is_global_admin());

-- Every sale, with what it earned, for the educator and the Global team.
create or replace view course_sales as
select
  p.id           as purchase_id,
  p.course_id,
  c.title        as course_title,
  c.educator_id,
  p.profile_id   as buyer_id,
  p.guest_email,
  p.guest_name,
  p.amount_cents,
  p.currency,
  p.status,
  p.refunded_at,
  date_trunc('month', p.created_at)::date as month,
  round(p.amount_cents *
        (select value::numeric from settings where key = 'educator_share') / 100
  )::int as educator_cents,
  p.created_at
from course_purchases p
join courses c on c.id = p.course_id;