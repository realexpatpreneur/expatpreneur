# The prototype against the build

A comparison of the approved prototype, `index.html`, against the platform
running at expatpreneur.vercel.app. Checked six ways, because each way
catches something the others miss.

Date of this check: 20 September 2026.

---

## The short answer

Everything in the prototype is built. 239 screens, 170 addresses, 88
navigation entries across five workspaces, 19 data objects and 24 named
capabilities, all accounted for.

Six screens are deliberately absent and one section of the build goes
beyond the prototype. Both are listed at the end, with reasons.

---

## How it was checked

| Check | What it catches | Result |
| --- | --- | --- |
| Screens | A screen that was never built at all | 239 of 239 |
| Addresses | A screen built under a name that does a different job | 170 of 170 |
| Navigation | A workspace missing a section, even where the screens exist | 88 of 88 |
| Data | A feature with no table behind it | 19 of 19 |
| Capabilities | A promise in a screen's notes that nothing implements | 24 of 24 |
| Access rules | A rule that does not behave as the prototype says | 40 checks, 0 failures |

The navigation check is the one that matters most, and the one I ran too
late. Comparing screen names alone passed ten pieces of architecture that
were mapped onto pages doing a different job: the Local Admin's Overview,
Village mix, Reports and Leadership; the Global team's network Events,
Photos and consent, Resources library and Network intelligence; and the
educator's Learners and Educator profile. All ten are now built.

The address check then found four more: the member's view of the Global
network, a Circle's own page, asking to be told when a Village opens, and
password reset. All four are now built.

---

## What is in the build

| Area | Screens | Where it lives |
| --- | --- | --- |
| Public site | 44 | `/`, `/discover`, `/membership`, `/villages`, `/members`, `/businesses`, `/learning`, `/watch`, `/media`, `/events`, `/apply`, `/apply/status`, `/contact`, `/legal`, `/login`, `/reset-password` |
| Member space | 71 | `/home`, `/my-village`, `/circles/[id]`, `/village`, `/directory`, `/members/[id]`, `/messages`, `/events`, `/live`, `/for-you`, `/network`, `/markets`, `/market-exploration`, `/groups`, `/pods`, `/businesses`, `/jobs`, `/learning`, `/library`, `/media`, `/watch`, `/photos`, `/search`, `/settings`, `/renew`, `/upgrade` |
| Local Admin | 45 | `/admin` and eighteen pages beneath it |
| Global team | 50 | `/global` and twenty five pages beneath it |
| Leaders | 17 | `/lead` |
| Educators | 11 | `/educator` and four pages beneath it |

140 pages, 9 API routes, 34 migrations, 2 test files.

---

## Nothing is left out

Every screen in the prototype is built, including the six I had earlier
argued against and should not have. The mobile menus are real pages now,
one per workspace, reached from a Menu button that appears exactly where
the navigation links disappear. The saved confirmations and the email
previews are built as specified.

The stylesheet was also changed rather than only the pages: columns
collapse, tables scroll inside their own box, rows wrap, and buttons go
full width below 520 pixels. Hiding links on a phone was never mobile
support.

## Where the build goes beyond the prototype

Two features arrived after the prototype was made, from Kristiane's
September notes, and are not in `index.html` at all:

- **The suggestion box**, at `/suggestions`, with the anonymous option.
- **Market Exploration**, at `/market-exploration`, which is the posting
  space for finding contacts in a market. It shares a name with the Phase
  4 market pathways feature at `/markets` and is a different thing.

Three more were added during the build and are not in the prototype: the
waiting list for full events, releasing an event address closer to the
time, and the access rule tests.

---

## Three things that were wrong in the database

These were not missing screens. They were wrong behind correct-looking
pages, which is why they survived the earlier checks.

1. **The nationality rule was measured wrongly.** The Village mix divided
   by the number of nationality entries rather than the number of people,
   so in a Village where members hold two nationalities every share came
   out lower than it is. Fixed in migration 0030.
2. **The Circle level balance did not exist.** The prototype asks for the
   mix inside each Circle, and a Circle can sit well over the limit while
   the Village as a whole looks fine. Added in migration 0030.
3. **Table grants were inherited rather than written down.** Supabase
   grants new tables to the app roles by default, so everything worked,
   but a fresh project built from this repository would not have behaved
   the same. Stated explicitly in migration 0033.

A fourth, found while writing this: `0001_init.sql` and `0002_rls.sql`
were missing from the repository copy. They had run on the database long
ago, but without them nobody could rebuild the platform from source. They
are back in `supabase/migrations`.

---

## How to check any of this yourself

Two files, both safe to run against production.

```
supabase/tests/schema_checks.sql    Is the database what the migrations say?
supabase/tests/access_rules.sql     Do the access rules behave correctly?
```

The first creates nothing and changes nothing. The second makes its own
Villages, people, pages, listings and photographs, checks forty rules and
rolls the whole lot back. Both return a table with failures at the top, so
if the first row says ok, everything passed.

Run them after any migration, and before handing a link to a real member.

---

## What is not done

None of it is code.

- The membership price, and the share an educator keeps.
- Stripe keys, so payments stop being code that has never taken money.
- The domain, then Resend, so the email templates can actually send.
- A lawyer on the two legal drafts, which are marked as drafts on the page.
- The walkthrough in `TESTING.md`, run by you and then by Kristiane
  without help.

Nobody outside this build has used any of it. That remains the largest
risk, and no amount of further building reduces it.