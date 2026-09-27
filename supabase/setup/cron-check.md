# The two scheduled jobs

Both are in vercel.json and run on Vercel's schedule. Neither has ever
run before today, because nothing was scheduling them.

## What they do

**/api/cron/reminders, once a day at seven in the morning.** Looks at
every published event
from yesterday to a week out, works out which reminder is due, and
sends it. A day before, an hour before, and a thank you afterwards,
whichever the host switched on for that event. Every send is recorded,
so running hourly cannot send the same reminder twice.

It does nothing at all until the email key is set. It returns
"skipped: No email key set" and stops, which is why it is safe to
schedule now.

Once a day is a limit of the Hobby plan, not a choice. It means the day
before reminder and the thank you afterwards both work, and the hour
before reminder cannot. Leave that one switched off on events until the
account is on Pro, where the schedule can go back to hourly.

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

## The Hobby plan, and why this matters more than it sounds

Vercel does not quietly reduce a schedule it does not allow. It refuses
the whole deployment. A cron of "0 * * * *" on a Hobby account fails
the build, which means nothing at all reaches the site, including
changes that have nothing to do with cron.

That is what happened here: eight pushes in a row built and failed, and
the live site sat ten hours behind the repository while both of us
assumed it was current.

If the account moves to Pro, hourly is allowed and the hour before
reminder starts working:

    "schedule": "0 * * * *"

## Checking it ran

Vercel, your project, the Cron Jobs tab, shows the last run and what it
returned. You can also call it yourself:

    curl https://expatpreneur.vercel.app/api/cron/reminders \
      -H "Authorization: Bearer <your CRON_SECRET>"