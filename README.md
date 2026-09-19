# ExpatPreneurs Global, build repository

The platform behind the prototype: a public website, a member space, and
workspaces for Local Admins, the Global team, leaders and educators.

- Database and auth: Supabase
- Hosting: Vercel
- Source: GitHub

## What is in here now

```
app/                       Next.js App Router pages
  page.tsx                 public home
  villages/                Villages, read from the database
  apply/                   invitation request form and confirmation
  login/                   sign in by emailed link
  auth/callback/           completes the sign in
  home/                    member home, signed in only
components/                shared header and footer
lib/supabase/              browser, server and proxy clients
proxy.ts                   keeps the session fresh, guards the member area
supabase/
  migrations/0001_init.sql tables, types, indexes, views
  migrations/0002_rls.sql  access rules for every table
  seed.sql                 the first Villages, Circles and a resource
```

## Running it

```bash
npm install
cp .env.example .env.local     # fill in the Supabase values
npm run dev
```

Sign in creates no accounts: `shouldCreateUser` is false, so only people
whose invitation has been approved and who have an auth user can log in.

The schema covers Phase 1: invitation requests and review, profiles,
Villages, Circles, the Directory, Ask & Offer, Market Exploration, the
suggestion box, events with tickets and approvals, resources, media,
messages, reports, WhatsApp sync tasks, payments and the audit log.

## Setting it up

1. Create the project in Supabase, then take the connection string from
   Project settings, Database.
2. Run the three files in order:

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0002_rls.sql
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql
```

   With the Supabase CLI instead: `supabase link` then `supabase db push`.

3. Make the first Global Admin. Sign up through the app or the Supabase
   dashboard, then run:

```sql
insert into profiles (id, full_name, email, status)
values ('<auth user id>', 'Kristiane Charrier', 'kristiane@example.com', 'active');

insert into member_roles (profile_id, role, scope)
values ('<auth user id>', 'global_admin', 'global');
```

## Environment variables

Set these in Vercel, and in `.env.local` for development. Never put the
service role key in anything the browser can read.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server side only: webhooks, admin jobs
STRIPE_SECRET_KEY=                # membership and event tickets
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=                   # or another sender, for the emails
NEXT_PUBLIC_SITE_URL=
```

## How access works

Written into the database, not into the application, so a mistake in the
UI cannot leak anything.

- Anyone can request an invitation and register for a public event.
- Active members see the network: profiles, Ask & Offer in their reach,
  every Market Exploration post, published events, resources and media.
- The paid plan is what allows replying to a member in another Village,
  starting a connection request, messaging outside your Village, and
  attending another Village's events.
- Local Admins hold their own Village. The Global team holds everything.
- The suggestion box takes posts from any member, paid or not. When it is
  sent anonymously the author column is null, so there is nothing to trace,
  and members cannot read the box at all.
- Nationality balance lives in the `village_nationality_mix` view. It is
  internal and must never appear on a public page or in writing to members.

## Payments

Stripe writes to `subscriptions` and `payments` through a webhook using the
service role key, which bypasses the access rules. Members read their own
rows, the Global team reads all of them. Nothing in the browser writes there.

## Still to build

1. The Next.js application: public site, member space, the four workspaces.
2. Supabase auth with email sign in, and the invitation to account flow.
3. Stripe checkout for membership and event tickets.
4. The transactional emails and the event reminder job.
5. Storage buckets for avatars, event covers and resources.
