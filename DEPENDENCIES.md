# What is built but waiting on something outside the code

Every item here is finished as code. None of it works until the thing
in the "needs" line exists. Where a feature is waiting, the platform
says so on the page rather than failing, so nothing here breaks
anything; it is just quiet.

Written 26 September 2026, from the environment variables the build
actually reads and the places it reads them.

## Payments

**Needs: a Stripe account, then STRIPE_SECRET_KEY,
STRIPE_MEMBERSHIP_PRICE_ID and STRIPE_WEBHOOK_SECRET in Vercel.**

Waiting on it:

- The paid plan. /upgrade says "not switched on yet" and offers nothing
  to click.
- The price on the Membership page, which reads "Not set yet". The
  monthly and yearly switch stays hidden until a price exists, because
  a switch between two blanks is worse than no switch.
- Paid event tickets. Free events register normally.
- Buying a course, and the member price.
- Educator payouts, and the share they are paid.
- Receipts, which have nothing to list.

Also needed, and not a key: the membership price itself, and the
educator's share, which is sitting at 70 percent as a placeholder
because nobody has decided it.

## Email

**Needs: a domain, then that domain verified in Resend, then
RESEND_API_KEY and EMAIL_FROM in Vercel.**

Thirteen moments in the platform send an email. Until the key is set
every one of them is silently skipped, which means the action still
works and the person is simply not told. They are:

- An invitation request approved or declined.
- The welcome, when somebody is placed in a Circle.
- A reply to an Ask or an Offer.
- A new message, which matters because daily talk is on WhatsApp and
  the platform is where the quiet ones arrive.
- Event registration, the reminder the day before, and a cancellation.
- A business enquiry, which currently reaches nobody.
- A contact page message. The Global team has to open Requests to find
  it.
- A course sale, to the educator and to the buyer.
- A member care check in from a Local Admin.
- Anything sent from the Global emails page.
- The weekly digest.
- The newsletter.

## Scheduled jobs

**Needs: a vercel.json with a cron entry, and CRON_SECRET in Vercel.**

Two jobs exist and nothing calls them, so neither has ever run:

- /api/cron/reminders, which sends the event reminder the day before
  and the weekly digest.
- /api/cron/tidy, which deletes recordings past their keeping period.

I have not added the cron entries because they are pointless until
email is on. Say when, and it is a five line file.

## Live rooms

**Needs: a LiveKit account, then LIVEKIT_URL, LIVEKIT_API_KEY,
LIVEKIT_API_SECRET and NEXT_PUBLIC_LIVEKIT_URL.**

Everything around the room is built and works: who may come in, the
lobby, the door, roles, the tables, the questions and the attendance
record. The audio and video themselves need the keys. The room page
says so plainly rather than showing a broken player.

Recording needs the same keys plus storage, and streaming out to
YouTube or LinkedIn needs the destination and key, which are entered
per session.

## The domain

**Needs: buying it, pointing it at Vercel, then NEXT_PUBLIC_SITE_URL.**

Everything still works on the vercel.app address, but these are wrong
or weaker until the domain exists:

- Every link inside an email.
- The re-enrolment links you send by WhatsApp.
- Sharing links for Watch and Listen.
- Email deliverability, because Resend needs a domain to verify.
- The look of the address itself, on a page where you are asking
  somebody to trust a private community.

## WhatsApp

**Needs: a decision, and possibly a Business API account.**

There is no WhatsApp integration and nothing pretends there is. Local
Admins add and remove people by hand, and the platform gives them the
list to work from: the WhatsApp sync page, the group links on Circles,
and each person's re-enrolment link to paste. If you want messages sent
from the platform, that is a WhatsApp Business account and a separate
piece of work.

## The law

**Needs: a lawyer.**

Privacy, Terms and Cookies are drafts that describe what the platform
actually does, which is the right starting point but not a substitute.
Each says so on the page. The entity, the registered address, the
governing law, the retention periods and the fee terms are all
placeholders written as [this].

## Content and data

**Needs: somebody to put it in.**

The pages are built and hide themselves when empty, which is why the
site currently looks thinner than it is:

- Villages: Circle statuses are not set to open, so every Circle reads
  "opens when it reaches 45 members", including Circle 01 in Dubai.
- No events, so Discover and the home page show no events section.
- No businesses, so the marketplace and the home page section are
  empty.
- No courses, so Learning is empty.
- No articles and no videos, so Media and Watch and Listen are empty.
- No resources, so the library is empty.
- The podcast show has no Spotify, Apple or YouTube address.
- Village photographs: the cards use colour blocks where there is no
  photograph.
- One test profile is public and visible on Discover, named cdcxzc.

## Security and abuse

**Needs: decisions.**

- No captcha on the public forms. The invitation form, the contact form
  and the city suggestion form each carry a hidden field that catches
  simple robots, which is not the same thing.
- auth.json, the file Playwright wrote when you signed in for the
  audit, is in the repository history. Removing it does not unpublish
  it. Sign out everywhere in Supabase to make the token worthless.
- No rate limiting on the public forms.