-- ExpatPreneurs Global, Phase 4: market pathways
-- Market Exploration is a question. A pathway is the route: the steps of
-- getting into one country, in order, with the members who have done it.
-- Run after 0006_learning.sql.

create type pathway_status as enum ('draft','published','retired');

create table market_pathways (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  country     text not null,
  city        text,
  title       text not null,
  summary     text,
  body        text,
  industry    text,                                  -- null means any trade
  tier        course_tier not null default 'all',
  status      pathway_status not null default 'draft',
  owner_id    uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger market_pathways_updated before update on market_pathways
  for each row execute function set_updated_at();
create index market_pathways_country_idx on market_pathways(country, status);

create table pathway_steps (
  id          uuid primary key default gen_random_uuid(),
  pathway_id  uuid not null references market_pathways(id) on delete cascade,
  position    int not null default 1,
  title       text not null,
  body        text,
  watch_out   text,                                  -- what people get wrong
  link        text,
  typical_cost text,
  typical_time text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (pathway_id, position)
);
create trigger pathway_steps_updated before update on pathway_steps
  for each row execute function set_updated_at();

create table pathway_followers (
  pathway_id  uuid not null references market_pathways(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  started_at  timestamptz not null default now(),
  note        text,
  primary key (pathway_id, profile_id)
);

create table pathway_step_progress (
  step_id    uuid not null references pathway_steps(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  done_at    timestamptz not null default now(),
  primary key (step_id, profile_id)
);

create view pathway_progress as
select f.pathway_id,
       f.profile_id,
       (select count(*) from pathway_steps s where s.pathway_id = f.pathway_id)::int as steps,
       (select count(*) from pathway_step_progress p
          join pathway_steps s on s.id = p.step_id
         where s.pathway_id = f.pathway_id and p.profile_id = f.profile_id)::int as done
from pathway_followers f;

alter view pathway_progress set (security_invoker = on);

-- ------------------------------------------------------------------ rules

alter table market_pathways       enable row level security;
alter table pathway_steps         enable row level security;
alter table pathway_followers     enable row level security;
alter table pathway_step_progress enable row level security;

create policy pathways_read on market_pathways
  for select using (
    (status = 'published' and is_member()) or owner_id = auth.uid() or is_global_admin()
  );
create policy pathways_write on market_pathways
  for all using (owner_id = auth.uid() or is_global_admin())
  with check (owner_id = auth.uid() or is_global_admin());

-- The steps are the substance, so a paid pathway keeps them closed.
create policy pathway_steps_read on pathway_steps
  for select using (
    exists (
      select 1 from market_pathways p
      where p.id = pathway_id
        and (
          p.owner_id = auth.uid()
          or is_global_admin()
          or (p.status = 'published' and is_member() and (p.tier = 'all' or is_paid()))
        )
    )
  );
create policy pathway_steps_write on pathway_steps
  for all using (
    exists (select 1 from market_pathways p where p.id = pathway_id
            and (p.owner_id = auth.uid() or is_global_admin()))
  )
  with check (
    exists (select 1 from market_pathways p where p.id = pathway_id
            and (p.owner_id = auth.uid() or is_global_admin()))
  );

create policy pathway_followers_read on pathway_followers
  for select using (profile_id = auth.uid() or is_global_admin());
create policy pathway_followers_join on pathway_followers
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1 from market_pathways p
      where p.id = pathway_id and p.status = 'published'
        and (p.tier = 'all' or is_paid())
    )
  );
create policy pathway_followers_leave on pathway_followers
  for delete using (profile_id = auth.uid());

create policy pathway_progress_own on pathway_step_progress
  for select using (profile_id = auth.uid() or is_global_admin());
create policy pathway_progress_mark on pathway_step_progress
  for insert with check (profile_id = auth.uid());
create policy pathway_progress_unmark on pathway_step_progress
  for delete using (profile_id = auth.uid());