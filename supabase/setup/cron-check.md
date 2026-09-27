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