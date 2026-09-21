-- Messages sent from the public contact page: general questions,
-- partnership offers and press requests. Anybody may write one, only the
-- Global team may read them.

create type enquiry_kind as enum ('general', 'partnership', 'press');
create type enquiry_status as enum ('new', 'answered', 'closed');

create table enquiries (
  id           uuid primary key default gen_random_uuid(),
  kind         enquiry_kind not null default 'general',
  full_name    text not null,
  email        citext not null,
  organisation text,
  village_id   uuid references villages(id) on delete set null,
  message      text not null,
  status       enquiry_status not null default 'new',
  answered_by  uuid references profiles(id) on delete set null,
  answered_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index enquiries_status_idx on enquiries(status, created_at desc);

alter table enquiries enable row level security;

-- Anyone, signed in or not, can send one.
create policy enquiries_insert_anyone on enquiries
  for insert to anon, authenticated
  with check (true);

-- Only the Global team reads or answers them. Local Admins do not: a
-- partnership or a press request is a network decision.
create policy enquiries_read_global on enquiries
  for select to authenticated
  using (is_global_admin());

create policy enquiries_update_global on enquiries
  for update to authenticated
  using (is_global_admin())
  with check (is_global_admin());

grant insert on enquiries to anon, authenticated;
grant select, update on enquiries to authenticated;