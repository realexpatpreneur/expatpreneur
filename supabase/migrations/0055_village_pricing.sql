-- 0055_village_pricing.sql
--
-- Pricing per Village, from the Membership Offer and Access Framework,
-- October 2026.
--
-- Each Village bills in its own currency and carries four prices for the
-- one paid membership: the standard rate monthly and yearly, and the
-- founding rate monthly and yearly. Founding is a protected rate on the
-- same membership, not a tier of its own, so it lives in columns beside
-- the standard price rather than in a plan of its own.
--
-- Founding closes when the seats are filled or when the window from that
-- Village's paid launch runs out, whichever comes first.
--
-- Safe to run more than once.

alter table villages add column if not exists currency       text not null default 'EUR';
alter table villages add column if not exists paid_launch_on date;

create table if not exists village_plans (
  id                   uuid primary key default gen_random_uuid(),
  village_id           uuid not null references villages(id) on delete cascade,
  plan_id              uuid not null references plans(id)    on delete cascade,
  currency             text not null default 'EUR',
  month_cents          int  not null default 0 check (month_cents >= 0),
  year_cents           int  not null default 0 check (year_cents  >= 0),
  founding_month_cents int  check (founding_month_cents >= 0),
  founding_year_cents  int  check (founding_year_cents  >= 0),
  founding_seats       int  not null default 50 check (founding_seats >= 0),
  founding_days        int  not null default 90 check (founding_days  >= 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (village_id, plan_id)
);

create index if not exists village_plans_village_idx on village_plans(village_id);

create or replace trigger village_plans_updated before update on village_plans
  for each row execute function set_updated_at();

alter table village_plans enable row level security;

drop policy if exists village_plans_read on village_plans;
create policy village_plans_read on village_plans for select using (true);

drop policy if exists village_plans_write on village_plans;
create policy village_plans_write on village_plans
  for all using (is_global_admin()) with check (is_global_admin());

grant select on village_plans to anon;

-- How many founding seats a Village has given out. It counts paying
-- members, which is what the framework counts, and it is reachable from
-- the public pricing view without exposing a single profile row.
create or replace function founding_seats_taken(v uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from profiles
  where village_id = v
    and plan = 'paid'
    and founding
    and status = 'active'
$$;

grant execute on function founding_seats_taken(uuid) to anon, authenticated;

-- One row per Village with the price a visitor should be shown, and
-- whether the founding rate is still open there.
create or replace view village_pricing as
select
  v.id                               as village_id,
  v.slug                             as village_slug,
  v.name                             as village_name,
  p.slug                             as plan_slug,
  vp.currency,
  vp.month_cents,
  vp.year_cents,
  vp.founding_month_cents,
  vp.founding_year_cents,
  vp.founding_seats,
  founding_seats_taken(v.id)         as founding_taken,
  v.paid_launch_on,
  (v.paid_launch_on + vp.founding_days) as founding_closes_on,
  (
        vp.founding_month_cents is not null
    and founding_seats_taken(v.id) < vp.founding_seats
    and (v.paid_launch_on is null
         or current_date <= v.paid_launch_on + vp.founding_days)
  )                                  as founding_open
from village_plans vp
join villages v on v.id = vp.village_id
join plans    p on p.id = vp.plan_id;

alter view village_pricing set (security_invoker = on);

grant select on village_pricing to anon, authenticated;

-- The currency each Village bills in.
update villages set currency = 'AED'
  where slug = 'dubai' and currency is distinct from 'AED';
update villages set currency = 'EUR'
  where slug in ('paris', 'lisbon') and currency is distinct from 'EUR';

-- The prices themselves. Standard first, founding second.
insert into village_plans
  (village_id, plan_id, currency, month_cents, year_cents,
   founding_month_cents, founding_year_cents)
select v.id, p.id, x.currency, x.month_cents, x.year_cents, x.fm, x.fy
from (values
  ('dubai',  'AED', 9900, 99900, 5900, 59900),
  ('paris',  'EUR', 2500, 25900, 1500, 15900),
  ('lisbon', 'EUR', 2500, 25900, 1500, 15900)
) as x(slug, currency, month_cents, year_cents, fm, fy)
join villages v on v.slug = x.slug
join plans    p on p.slug = 'paid'
on conflict (village_id, plan_id) do nothing;
