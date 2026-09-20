-- ExpatPreneurs Global, Phase 2: member businesses and the jobs board
-- A business belongs to a member. A job is posted by a member, usually for
-- their own business, and reaches their Village or every Village.
-- Run after 0003_groups_and_pods.sql.

create type job_kind   as enum ('job','freelance','partner');
create type job_status as enum ('open','filled','closed');

create table businesses (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  owner_id    uuid not null references profiles(id) on delete cascade,
  village_id  uuid references villages(id) on delete set null,
  name        text not null,
  tagline     text,
  description text,
  industry    text,
  website     text,
  founded     text,
  serves      text[] not null default '{}',   -- countries it sells into
  public      boolean not null default false, -- shown on the public site
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger businesses_updated before update on businesses
  for each row execute function set_updated_at();
create index businesses_owner_idx on businesses(owner_id);
create index businesses_village_idx on businesses(village_id);

create table jobs (
  id           uuid primary key default gen_random_uuid(),
  poster_id    uuid not null references profiles(id) on delete cascade,
  business_id  uuid references businesses(id) on delete set null,
  village_id   uuid references villages(id) on delete set null,
  reach        post_reach not null default 'village',
  kind         job_kind not null default 'job',
  title        text not null,
  description  text not null,
  location     text,
  remote       boolean not null default false,
  compensation text,
  apply_note   text,
  status       job_status not null default 'open',
  closes_on    date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger jobs_updated before update on jobs
  for each row execute function set_updated_at();
create index jobs_open_idx on jobs(status, created_at desc);

-- ------------------------------------------------------------------ rules

alter table businesses enable row level security;
alter table jobs       enable row level security;

-- Members see every business. The public sees only the ones the owner
-- chose to show, and only while that member is active.
create policy businesses_read on businesses
  for select using (
    is_member()
    or is_admin(village_id)
    or (public and exists (
      select 1 from profiles p
      where p.id = owner_id and p.status = 'active' and p.public_profile
    ))
  );
create policy businesses_own_write on businesses
  for all using (owner_id = auth.uid() or is_admin(village_id))
  with check (owner_id = auth.uid() or is_admin(village_id));

-- The jobs board follows the same reach as Ask & Offer: your own Village,
-- or every Village when the poster chooses that.
create policy jobs_read on jobs
  for select using (
    is_admin(village_id)
    or (is_member() and (reach = 'all_villages' or village_id = my_village()))
  );
create policy jobs_insert on jobs
  for insert with check (poster_id = auth.uid() and is_member());
create policy jobs_own_write on jobs
  for update using (poster_id = auth.uid() or is_admin(village_id))
  with check (poster_id = auth.uid() or is_admin(village_id));