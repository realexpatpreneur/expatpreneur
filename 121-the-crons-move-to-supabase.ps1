# 121-the-crons-move-to-supabase.ps1
# You are right, and it is better for a reason beyond the plan limit.
# One migration: 0044_cron_in_supabase.sql.
#
# Three reasons, in the order they matter here.
#
# The scheduler stops being able to break the website. A wrong cron line
# in vercel.json does not fail the cron, it fails the deployment, and
# today that cost eight of them including work that had nothing to do
# with scheduling. A wrong schedule in Postgres fails the schedule and
# nothing else.
#
# The hour limit goes away. Hobby allows one run a day; Postgres has no
# such limit, so the reminders job is back to hourly and the hour before
# reminder works again.
#
# And the schedule can be changed without a deployment. Two lines in the
# SQL editor, no build, no risk.
#
# pg_cron does the scheduling and pg_net makes the call. Both are
# Supabase's own extensions, so nothing new is being introduced. The
# address and the shared secret live in a private table with no policies
# and no grants, readable by the database owner and nobody else: not
# members, not admins, not the site.
#
# vercel.json now holds no crons at all, so the two cannot both fire.
#
# After running the migration, two inserts, which are written at the
# foot of the migration file and again in cron-check.md:
#
#   the site address
#   the same secret you put in CRON_SECRET in Vercel
#
# Until those exist the job runs, finds no address and does nothing,
# which is the right way round.
#
# Run the migration in Supabase:
#   supabase/migrations/0044_cron_in_supabase.sql
#
#   powershell -ExecutionPolicy Bypass -File .\121-the-crons-move-to-supabase.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $relativePath"
}

$f0 = @'
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
'@
Write-File "supabase\migrations\0044_cron_in_supabase.sql" $f0

$f1 = @'
{
  "$schema": "https://openapi.vercel.sh/vercel.json"
}
'@
Write-File "vercel.json" $f1

$f2 = @'
# The two scheduled jobs

They are scheduled by Postgres, not by Vercel.

## Why not Vercel

Vercel's Hobby plan allows one cron run a day, and a schedule it does
not allow does not get reduced: it fails the whole deployment. That is
how eight deployments were lost in one afternoon, none of which had
anything to do with cron.

Postgres has no such limit, the schedule can be changed without a
deployment, and a mistake in it cannot take the website down. pg_cron
and pg_net are both Supabase's own extensions.

## What they do

**Reminders, every hour.** Looks at every published event from
yesterday to a week out, works out which reminder is due, and sends it:
the day before, the hour before, and the thank you afterwards,
whichever the host switched on. Every send is recorded, so running
hourly cannot send the same one twice.

It does nothing until the email key is set. It returns "skipped: No
email key set" and stops.

**Tidy, at three in the morning.** Deletes recordings past their
keeping time, 180 days unless RECORDING_KEEP_DAYS says otherwise.
Anything published into Watch and Listen or attached to a lesson is
content now and is left alone.

## Two settings, in two places

In Vercel, Settings, Environment Variables:

    CRON_SECRET = any long random string

In Supabase, the SQL editor, the same string:

    insert into private.config (key, value)
    values ('cron_secret', 'the same string')
    on conflict (key) do update set value = excluded.value;

    insert into private.config (key, value)
    values ('site_url', 'https://expatpreneur.vercel.app')
    on conflict (key) do update set value = excluded.value;

They have to match. The job sends the secret, the endpoint checks it,
and anything else is refused. The address is where the job calls, so it
changes on the day the domain does.

private.config has no policies and no grants, so nobody but the
database owner can read it. Not members, not admins, not the site.

## Seeing whether it ran

    select * from cron.job;

    select jobid, status, return_message, start_time
    from cron.job_run_details
    order by start_time desc
    limit 20;

A run that says succeeded means Postgres made the call. What the
endpoint then did is in Vercel's logs, under the function.

## Running one by hand

    select private.call_job('/api/cron/reminders');

Or over HTTP, which shows you the answer:

    curl https://expatpreneur.vercel.app/api/cron/reminders \
      -H "Authorization: Bearer <your CRON_SECRET>"

## Changing the schedule

Reschedule by name; there is no deployment involved.

    select cron.unschedule('expatpreneurs-reminders');
    select cron.schedule('expatpreneurs-reminders', '*/30 * * * *',
      $$select private.call_job('/api/cron/reminders')$$);
'@
Write-File "supabase\setup\cron-check.md" $f2

git add vercel.json supabase
git commit -m "Schedule the jobs from Postgres, where a mistake cannot take the site down"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Then in Supabase:"
    Write-Host "  1. Run supabase/migrations/0044_cron_in_supabase.sql"
    Write-Host "  2. Run the two inserts at the foot of that file, with your"
    Write-Host "     own address and the same secret as CRON_SECRET in Vercel"
    Write-Host "  3. select * from cron.job;  to see them scheduled"
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
