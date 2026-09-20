-- ExpatPreneurs Global: the public Business and Offers marketplace
-- Members list their businesses, and nobody outside could see them. The
-- prototype has a public marketplace with services, a current offer, and
-- a contact form that goes straight to the business.
-- Run after 0027_recognition_and_partners.sql.

alter table businesses add column if not exists category text;
alter table businesses add column if not exists services text[] not null default '{}';
alter table businesses add column if not exists offer text;
alter table businesses add column if not exists logo_url text;
alter table businesses add column if not exists hidden boolean not null default false;
alter table businesses add column if not exists hidden_reason text;

comment on column businesses.offer is
  'The current offer, shown on the public page.';
comment on column businesses.hidden is
  'Taken down by the Global team. The owner keeps the listing but nobody sees it.';

-- Whether the owner allows their business to be seen publicly. A function
-- rather than a subquery, so reading a listing never requires the reader
-- to be able to read profiles.
create or replace function owner_allows_listing(owner uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = owner and p.status = 'active' and p.show_business
  )
$$;

grant execute on function owner_allows_listing(uuid) to anon, authenticated;

-- A listing is public when the member ticked it, their profile allows it,
-- and the Global team has not taken it down.
drop policy if exists businesses_read on businesses;
create policy businesses_read on businesses
  for select using (
    owner_id = auth.uid()
    or is_global_admin()
    or (is_member() and not hidden)
    or (public and not hidden and owner_allows_listing(owner_id))
  );

drop policy if exists businesses_moderate on businesses;
create policy businesses_moderate on businesses
  for update using (is_global_admin()) with check (is_global_admin());

revoke select on businesses from anon;
grant select (
  id, slug, owner_id, village_id, name, tagline, description, industry,
  website, founded, serves, public, category, services, offer, logo_url,
  created_at
) on businesses to anon;

-- Somebody outside writing to a business. ExpatPreneurs does not take
-- part in the transaction; this only carries the message.
create table if not exists business_enquiries (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  from_name   text not null,
  from_email  citext not null,
  body        text not null,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table business_enquiries enable row level security;

-- Anybody may write one. Only the owner and the Global team may read them.
drop policy if exists enquiries_write on business_enquiries;
create policy enquiries_write on business_enquiries
  for insert with check (true);
drop policy if exists enquiries_read on business_enquiries;
create policy enquiries_read on business_enquiries
  for select using (
    is_global_admin()
    or exists (
      select 1 from businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

grant insert on business_enquiries to anon;