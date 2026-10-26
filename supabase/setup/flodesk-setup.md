# Switching the newsletter on

The signup on Watch and Listen already works and already keeps every
address in our own table. What follows sends each one to Flodesk as well,
so the list Kristiane writes to is the list the site fills.

Nothing reaches Flodesk until the key below is set. Until then the signup
behaves exactly as it does today.

## What to make in Flodesk

**1. The segment.** Audience, Segments, add one called something like
`Website newsletter`. Open it and copy the identifier out of the address
bar. That is what every signup from the site joins, so Kristiane can mail
the people who came in through the site without mailing everybody.

**2. The API key.** Account, Integrations, API, create a key and copy it.
It is shown once.

**3. The webhook, so unsubscribes come back.** Flodesk does not sign what
it sends, so the address itself carries the secret. Pick a long random
string, anything nobody would guess, and use it in both places below.

Register the webhook pointing at:

    https://expatpreneur.vercel.app/api/flodesk/webhook?key=YOUR_SECRET

and send it this one event and nothing else:

    subscriber.unsubscribed

If Flodesk has no screen for adding a webhook on the plan we are on, it
can be created over the API instead:

    curl -X POST https://api.flodesk.com/v1/webhooks \
      -u 'YOUR_API_KEY:' \
      -H 'Content-Type: application/json' \
      -d '{"name":"Unsubscribes back to the platform",
           "post_url":"https://expatpreneur.vercel.app/api/flodesk/webhook?key=YOUR_SECRET",
           "events":["subscriber.unsubscribed"]}'

## The three settings, in Vercel

    FLODESK_API_KEY         the key from step 2
    FLODESK_SEGMENT_ID      the segment from step 1
    FLODESK_WEBHOOK_SECRET  the same string used in the webhook address

Set each one for Production, Preview and Development, then redeploy.
Nothing reads a new setting until a deploy goes out.

## What starts working

Every signup on Watch and Listen lands in Flodesk, in that segment, with
the page it came from recorded against it and the address and time the
person consented from. When somebody unsubscribes in Flodesk, our own
table is marked too, so the two never disagree about who wants the
newsletter.

## A thing worth deciding

Flodesk can send a confirmation email before it counts somebody as
subscribed. It is off here, because the person has just typed their
address into a form on the site and the page tells them they are on the
list. If Kristiane would rather have the confirmation step, say so and it
is one word in the code.

## How to know it worked

Sign up on Watch and Listen with an address you can read. Then check:

- Flodesk, the segment, shows that address.
- Supabase, `newsletter_signups`, shows the same row.

Unsubscribe from the footer of a Flodesk email, and `unsubscribed_at` on
that row fills in within a few seconds.

If the address is in our table but not in Flodesk, it is the key or the
segment id. If it is in both but the unsubscribe never comes back, it is
the webhook: wrong address, wrong secret, or the event not selected.
