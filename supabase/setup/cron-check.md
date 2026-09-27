# The two scheduled jobs

Both are in vercel.json and run on Vercel's schedule. Neither has ever
run before today, because nothing was scheduling them.

## What they do

**/api/cron/reminders, every hour.** Looks at every published event
from yesterday to a week out, works out which reminder is due, and
sends it. A day before, an hour before, and a thank you afterwards,
whichever the host switched on for that event. Every send is recorded,
so running hourly cannot send the same reminder twice.

It does nothing at all until the email key is set. It returns
"skipped: No email key set" and stops, which is why it is safe to
schedule now.

**/api/cron/tidy, at three in the morning.** Deletes recordings past
their keeping time, which is 180 days unless RECORDING_KEEP_DAYS says
otherwise. Anything published into Watch and Listen, or attached to a
lesson, is content now and is left alone.

## One setting to add

In Vercel, Settings, Environment Variables, add:

    CRON_SECRET = <any long random string>

Vercel sends that as the authorisation header when it calls the job,
and both routes refuse anything else. Without it the jobs still run,
but anyone who knows the address could trigger them.

## If you are on the Hobby plan

Vercel only allows one run a day on Hobby. The hourly schedule will be
reduced, which means the hour-before reminder will not go out on time.
If you are staying on Hobby, change the reminders schedule to daily and
switch the hour-before reminder off on events:

    "schedule": "0 7 * * *"

## Checking it ran

Vercel, your project, the Cron Jobs tab, shows the last run and what it
returned. You can also call it yourself:

    curl https://expatpreneur.vercel.app/api/cron/reminders \
      -H "Authorization: Bearer <your CRON_SECRET>"