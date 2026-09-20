-- ExpatPreneurs Global: three smaller things
-- Somebody who asked for an invitation had no way to find out where it
-- stood, which is the most asked question of any application. And a Local
-- Admin had no settings of their own: the welcome a new member reads and
-- the Village's main WhatsApp group lived nowhere.
-- Run after 0022_educator_earnings.sql.

-- ------------------------------------------------- where my request stands

-- A short reference, given when the form is sent, so somebody can ask
-- about their own request without anybody else being able to.
alter table applications add column if not exists reference text unique;

create or replace function make_reference()
returns text
language sql volatile as $$
  select 'EP-' || upper(substr(md5(gen_random_uuid()::text), 1, 5))
$$;

create or replace function set_application_reference()
returns trigger language plpgsql as $$
begin
  if new.reference is null then
    new.reference := make_reference();
  end if;
  return new;
end $$;

drop trigger if exists applications_reference on applications;
create trigger applications_reference before insert on applications
  for each row execute function set_application_reference();

update applications set reference = make_reference() where reference is null;

-- Email and reference together, or nothing. The answer is deliberately
-- coarse: where it is, not what anybody wrote about it.
create or replace function application_status_for(the_email text, the_reference text)
returns text
language sql stable security definer set search_path = public as $$
  select case status
    when 'new'         then 'with us'
    when 'with_local'  then 'with the Village'
    when 'recommended' then 'with the Global team'
    when 'waitlisted'  then 'on the waiting list'
    when 'approved'    then 'approved'
    when 'declined'    then 'closed'
  end
  from applications
  where email = the_email::citext
    and reference = upper(the_reference)
  limit 1
$$;

grant execute on function application_status_for(text, text) to anon, authenticated;

-- -------------------------------------------------------- Village settings

alter table villages add column if not exists welcome_message text;
alter table villages add column if not exists whatsapp_url text;
alter table villages add column if not exists quiet_days int not null default 45;
alter table villages add column if not exists meeting_note text;

comment on column villages.welcome_message is
  'What a new member of this Village reads first, written by its Local Admin.';
comment on column villages.quiet_days is
  'How long before member care counts somebody as having gone quiet.';

-- A Local Admin may change their own Village. Creating one, renaming it or
-- closing it stays with the Global team.
drop policy if exists villages_local_settings on villages;
create policy villages_local_settings on villages
  for update using (is_admin(id)) with check (is_admin(id));