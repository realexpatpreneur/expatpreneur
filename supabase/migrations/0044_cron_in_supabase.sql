-- Scheduling the two jobs from the database instead of from Vercel.
--
-- Three reasons. Vercel's Hobby plan allows one run a day, and a
-- schedule it does not allow fails the whole deployment rather than
-- being reduced, which is how eight deployments were lost. Postgres has
-- no such limit. And a scheduler that lives beside the data cannot take
-- the website down when it is wrong.
--
-- pg_cron does the scheduling, pg_net makes the call. Both are Supabase
-- extensions; nothing new is being introduced.

create extension if not exists pg_cron with schema cron;
create extension if not exists pg_net with schema extensions;

-- Where the address and the shared secret live. No policies and no
-- grants, so only the database owner can read it. The jobs below run as
-- the owner, which is the only thing that needs to.
create schema if not exists private;

create table if not exists private.config (
  key   text primary key,
  value text not null
);

revoke all on private.config from anon, authenticated;
revoke all on schema private from anon, authenticated;

-- Calls one of the scheduled endpoints, with the same authorisation
-- header Vercel used to send.
create or replace function private.call_job(path text)
returns void
language plpgsql
security definer
set search_path = private, extensions, public
as $$
declare
  base   text;
  secret text;
begin
  select value into base   from private.config where key = 'site_url';
  select value into secret from private.config where key = 'cron_secret';

  if base is null then
    raise notice 'No site_url in private.config, so nothing was called.';
    return;
  end if;

  perform extensions.net.http_get(
    url := base || path,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || coalesce(secret, ''),
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 55000
  );
end;
$$;

-- Replacing a job of the same name is not automatic, so unschedule
-- first. This makes the whole file safe to run again.
do $$
begin
  perform cron.unschedule('expatpreneurs-reminders');
exception when others then null;
end;
$$;

do $$
begin
  perform cron.unschedule('expatpreneurs-tidy');
exception when others then null;
end;
$$;

-- Every hour, which is what the hour before reminder needs.
select cron.schedule(
  'expatpreneurs-reminders',
  '0 * * * *',
  $$select private.call_job('/api/cron/reminders')$$
);

-- And the recordings tidy, once a night.
select cron.schedule(
  'expatpreneurs-tidy',
  '0 3 * * *',
  $$select private.call_job('/api/cron/tidy')$$
);

-- ---------------------------------------------------------------------
-- Before this does anything, put the two values in. Run these two lines
-- with your own values, in the SQL editor:
--
--   insert into private.config (key, value)
--   values ('site_url', 'https://expatpreneur.vercel.app')
--   on conflict (key) do update set value = excluded.value;
--
--   insert into private.config (key, value)
--   values ('cron_secret', 'the same string as CRON_SECRET in Vercel')
--   on conflict (key) do update set value = excluded.value;
--
-- To see the jobs:            select * from cron.job;
-- To see what they did:       select * from cron.job_run_details
--                               order by start_time desc limit 20;
-- ---------------------------------------------------------------------