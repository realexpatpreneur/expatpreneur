# ExpatPreneurs Global, how the platform is built and run

Everything a new person needs to keep this running, add to it, or hand it
to somebody else. Written for a developer who has never seen it.

---

## What it is

A members' platform for a network of expat entrepreneurs, organised as
Villages (one per city) made of Circles (up to fifty people each).
Membership is free and by invitation. A paid plan opens the rest of the
network.

Live at https://expatpreneur.vercel.app

---

## The stack, and why

| Piece | What it does | Why |
| --- | --- | --- |
| Next.js 16, App Router | The whole application, pages and server actions | One codebase, server rendering, no separate API to keep in step |
| Supabase Postgres | Every row of data | Row level security means the rules live with the data, not in the pages |
| Supabase Auth | Signing in, by emailed link | Members never choose a password |
| Supabase Storage | Photographs, covers, recordings | Same rules engine as the database |
| Vercel | Hosting and deployment | Pushes to `main` deploy |
| Stripe | Membership and event tickets | Checkout and the card portal are theirs, not ours |
| Resend | Transactional email | Called over plain HTTP, no library |
| LiveKit | Live audio and video, recording, streaming out | Self hostable later if the bills get uncomfortable |
| GitHub Actions | The scheduled jobs | Vercel Hobby allows one cron run a day, which is not enough |

**The single most important idea.** Access rules are written in the
database, in row level security policies, not in the pages. A page that
forgets to filter still cannot show a member something they are not
allowed to see. When you add a feature, add the policy first and let the
page discover what it can read.

---

## Getting it running locally

```bash
git clone https://github.com/realexpatpreneur/expatpreneur.git
cd expatpreneur
npm install
cp .env.example .env.local     # then fill it in, see below
npm run dev
```

---

## Environment variables

Set in Vercel, Settings, Environment Variables, for all environments.

**Needed for anything to work**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        server only, never in the browser
NEXT_PUBLIC_SITE_URL             https://expatpreneur.vercel.app
```

**Payments**

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET            from the webhook endpoint in Stripe
STRIPE_MEMBERSHIP_PRICE_ID       a recurring price, created in Stripe
```

**Email**

```
RESEND_API_KEY
EMAIL_FROM                       needs a verified domain in Resend
CRON_SECRET                      protects the scheduled jobs
```

**Live rooms**

```
LIVEKIT_URL                      wss://your-project.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL          the same value
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

**Recordings** (Supabase Storage speaks S3; keys from Project settings,
Storage, S3 access keys)

```
S3_ENDPOINT                      https://<project>.storage.supabase.co/storage/v1/s3
S3_REGION
S3_ACCESS_KEY
S3_SECRET_KEY
S3_BUCKET                        recordings
RECORDING_KEEP_DAYS              optional, 180 by default
```

Anything not set switches its feature off rather than breaking the page.
That is deliberate: every feature checks whether its keys exist and says
so plainly if not.

**GitHub repository secrets**, at Settings, Secrets and variables,
Actions: `CRON_SECRET` and `SITE_URL`.

**External setup**

- Supabase, Authentication, URL configuration: add
  `https://expatpreneur.vercel.app/auth/callback`.
- Stripe, Developers, Webhooks: endpoint `/api/stripe/webhook`, listening
  for `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `charge.refunded`,
  `invoice.payment_failed`.
- LiveKit, Settings, Webhooks: endpoint `/api/live/webhook`, signed with
  the same API key as `LIVEKIT_API_KEY`.

---

## The database

Migrations are in `supabase/migrations`, numbered, and must be run in
order in the Supabase SQL editor. They are additive: no migration drops a
table or deletes a row.

| File | What it adds |
| --- | --- |
| 0001_init | Villages, Circles, profiles, applications, asks, events, messages, everything the first version needed |
| 0002_rls | Row level security on every table, and the helper functions the policies use |
| 0003_groups_and_pods | Industry Groups and Pods |
| 0004_businesses_and_jobs | Member businesses and the jobs board |
| 0005_re_enrolment | The yearly renewal, and the member activity view |
| 0006_learning | Courses, lessons, enrolments, progress |
| 0007_market_pathways | Market pathways and their steps |
| 0008_live_sessions | Live rooms, room roles, the lobby, breakouts, recordings, stream targets |
| 0009_storage_and_images | Three storage buckets and their rules |
| 0010_leaders | Who may open a live room, and the leadership view |
| 0011_insight | The views behind Insight and Reporting |
| 0012_photos | Event photographs |
| 0013_notification_preferences | What reaches a member's inbox |
| 0014_waitlist_and_address | The event address, and when it is shown |
| 0015_profile_privacy | Narrowed rows, column grants, and `member_records` |
| 0016_market_outcome | Closing a market question |

**The helper functions to know**, defined in 0002 and used all over the
policies: `me()`, `is_member()`, `is_paid()`, `my_village()`,
`my_circle()`, `is_global_admin()`, `is_local_admin()`, `is_admin()`,
`can_attend()`. Later migrations add `session_role_for()`,
`is_session_host()`, `can_join_session()`, `holds_a_role()`,
`wants_email()`.

**Two things that will bite you if you forget them.**

1. `profiles` no longer exposes email, phone or nationalities to anybody
   signed in. Those columns are revoked at the grant level. Admin pages
   read `member_records`, a view that checks the Village. Anything
   sending email uses the service role.
2. `member_records` is a `security_invoker = off` view. Its guard is
   inside the view, not a policy.

---

## How the code is laid out

```
app/
  (public pages)     /, /villages, /apply, /how-it-works, /contact, /legal
  home, my-village   the member's own landing pages
  village            Ask & Offer
  directory, members the people
  messages           one to one, with connection requests across Villages
  events, e/[slug]   events, and their public pages
  live               live rooms, /live/[slug]/room is the room itself
  learning, educator courses, taking and writing
  markets            market pathways
  groups, pods       Industry Groups and Pods
  businesses, jobs   what members do, and who is hiring
  library, watch     resources and Watch and Listen
  photos             event galleries
  admin              the Local Admin workspace
  global             the Global team workspace
  lead               what a Circle Host, Group or Pod lead runs
  settings, renew    the member's own account
  api/               webhooks and scheduled jobs
lib/
  supabase/          three clients: browser, server, service role
  access.ts          requireAdmin, requireGlobal, the nationality limit
  member.ts          requireMember, isPaid, timeAgo
  events.ts          when and price formatting, the registration rules
  live.ts            live session helpers
  livekit.ts         tokens and rooms
  egress.ts          recording and streaming out
  email.ts           Resend, and the preference check
  notify.ts          in platform notifications
  audit.ts           the audit log
  stripe.ts          the Stripe client
components/
  site-header, site-footer, uploader
supabase/migrations/ the numbered SQL files
```

**Conventions worth keeping.**

- A folder has `page.tsx` for the page, `actions.ts` for server actions,
  and `forms.tsx` for the client components. Actions never trust the
  form: the database checks again.
- Anything that sends email goes through `sendEmailToMember`, which asks
  the database whether that member wants it.
- Anything a person may have to answer for later goes through
  `record()` in `lib/audit.ts`.

---

## Running it day to day

**Local Admin**, at `/admin`

- Requests: read a request, see the Village balance, approve, waitlist or
  decline. Approving creates the account and sends the sign in link.
- Members: place people in Circles, change status and plan.
- Circles: capacity, and the WhatsApp group link members see after joining.
- Care: who has gone quiet, and the yearly re-enrolment round.
- WhatsApp: the list of group changes the platform cannot make itself.
- Events and Live rooms: create, run, check people in, record, stream.
- Announcements, Resources, Watch and Listen, Suggestion box, Insight.

**Global team**, at `/global`

Villages, the internal nationality balance, cities people are asking for,
Groups and Pods, market pathways, roles, moderation, suggestions across
every Village, money and reporting.

**Scheduled jobs**, in GitHub Actions

- Hourly: event reminders, the week, day, hour and thank you messages.
- Nightly: clearing out recordings past their keeping time.
- Both have a Run workflow button for testing.

---

## Delivering changes

This codebase was built through numbered PowerShell scripts that write
files and push. That was a working method for one person, not a
requirement. Any normal workflow is fine: branch, change, pull request,
merge to `main`, Vercel deploys.

Two things to keep:

1. Run `npm run build` before pushing. Type errors do not show up until
   the build.
2. A change that needs a migration is not finished until the migration
   has been run in Supabase. The code and the database go out separately,
   and code that expects a table which is not there yet will fail
   quietly, in ways that look like a broken page.

---

## What is not done

- The two legal pages are drafts, marked as such on the page, with
  placeholders for the entity, the address, the fee, the jurisdiction and
  the retention periods. A lawyer signs them off before launch.
- No automated tests anywhere. The access rules were tested by hand
  against a local Postgres, with real member rows.
- English only.
- The apply form has a honeypot and a daily limit per address, but no
  captcha. If it gets hammered, that is the next step.
- The platform has never been used by anyone except the people who built
  it.

---

## If something breaks

| What you see | Where to look |
| --- | --- |
| A page 404s that should exist | The deploy. Vercel, Deployments, check the newest one built the newest commit |
| A page loads but shows nothing | A migration that has not been run |
| A member sees a refusal they should not | The policy on that table, not the page |
| Email is not arriving | `RESEND_API_KEY` and whether the domain is verified |
| A live room will not open | The four LiveKit variables, and that they are set for all environments |
| A recording stays on processing | The LiveKit webhook, and whether it is signed with the key in `LIVEKIT_API_KEY` |
| Payments do nothing | The Stripe webhook secret, and that the endpoint lists the five events |