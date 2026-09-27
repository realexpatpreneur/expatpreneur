-- Stopping somebody sending the same form a thousand times.
--
-- No third party service and nothing kept about a person: the address a
-- request came from is hashed before it is stored, the row holds only
-- that hash and which form it was, and anything older than a day is
-- deleted on the next call.

create table form_hits (
  id         bigserial primary key,
  form       text not null,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);

create index form_hits_lookup on form_hits(form, ip_hash, created_at desc);

alter table form_hits enable row level security;
-- No policy at all: nobody reads this table. It is written and counted
-- only through the function below, which runs as its owner.

-- Records one attempt and says how many there have been in the window.
-- The caller decides what to do with the number.
create or replace function note_form_hit(
  p_form text,
  p_ip_hash text,
  p_minutes int default 60
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  delete from form_hits where created_at < now() - interval '1 day';

  insert into form_hits (form, ip_hash) values (p_form, p_ip_hash);

  select count(*) into recent
  from form_hits
  where form = p_form
    and ip_hash = p_ip_hash
    and created_at > now() - make_interval(mins => p_minutes);

  return recent;
end;
$$;

grant execute on function note_form_hit(text, text, int) to anon, authenticated;