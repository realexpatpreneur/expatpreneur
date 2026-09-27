# Switching email on

Thirteen moments in the platform send an email. All of them are built
and all of them are silent, because there is no key. Nothing fails; the
action completes and the person is simply not told.

## Why this one really does need the domain

Resend will not send from an address you cannot prove you own. That is
not Resend being awkward, it is what stops everybody else sending as
you. So the order is: buy the domain, point it at Vercel, verify it in
Resend, then add the key.

Until then, every one of the thirteen is skipped, and the platform
still works. The two most visible gaps while you wait: somebody whose
invitation is approved is not told, and a business enquiry reaches
nobody. If you go live before email, a person has to do both by hand.

## The steps, once you have the domain

1. Resend, add your domain. It gives you three DNS records, an SPF, a
   DKIM and usually a return path.
2. Put those records wherever the domain's DNS lives. If the domain is
   on Vercel, that is Vercel, Domains, your domain, DNS records.
3. Wait for Resend to say verified. Usually minutes, sometimes hours.
4. Resend, API keys, create one with sending permission.
5. In Vercel, Settings, Environment Variables:

       RESEND_API_KEY   re_...
       EMAIL_FROM       ExpatPreneurs <hello@yourdomain.com>
       NEXT_PUBLIC_SITE_URL   https://yourdomain.com

The address in EMAIL_FROM has to be at the domain you verified.

## What starts sending, the same hour

An invitation request received, approved, declined or waitlisted.
Being placed in a Circle. A reply to your Ask or Offer. A new message.
An event registration, the reminder the day before, the hour before,
and the thank you afterwards. A business enquiry. A course sale, to
both sides. A member care note from a Local Admin. Anything sent from
the Global emails page. The weekly digest.

The reminders are already scheduled hourly and have been running and
finding nothing to do, so they start working by themselves.

## Where the wording lives

Global team, Emails. Eight templates, each editable, each with a
preview. The platform uses the template if there is one and falls back
to wording written into the code if somebody deletes it, so an email
always goes.

Two of the eight were seeded and never actually used. Event
registration now uses its template, and so does being placed in a
Circle. That second one was not only unused, it was not sent at all:
somebody could be placed in a Circle and never hear about it.

## Testing before you trust it

Resend's dashboard shows every send, whether it landed, and what
bounced. Approve a test invitation to yourself first, then look there
rather than only in your inbox.