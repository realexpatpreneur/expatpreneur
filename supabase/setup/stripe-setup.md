# Switching payments on

Everything below is built. None of it runs until the three settings at
the bottom exist in Vercel.

## What to make in Stripe

There is no product or price to make. Membership used to be one Stripe
price for the whole network, which cannot say AED 59 for Dubai and EUR 15
for Paris, nor the founding rate against the standard one, nor a month
against a year. Each Village's own price is sent to Stripe at the moment
of checkout instead. Set the prices in the platform, under Global team,
Plans, and Stripe charges whatever is there.

**1. The webhook.** Developers, Webhooks, add an endpoint pointing at:

    https://expatpreneur.vercel.app/api/stripe/webhook

Send it these five events and nothing else:

    checkout.session.completed
    charge.refunded
    invoice.payment_failed
    customer.subscription.updated
    customer.subscription.deleted

Copy the signing secret, which starts with `whsec_`.

**2. The card portal.** Settings, Billing, Customer portal, turn it on
and allow cancelling. That is what the Update card and Cancel buttons
in a member's settings open.

## The three settings, in Vercel

    STRIPE_SECRET_KEY     sk_live_... or sk_test_... to try it
    STRIPE_WEBHOOK_SECRET whsec_...
    NEXT_PUBLIC_SITE_URL  the address, once the domain exists

Set each one for Production, Preview and Development, then redeploy.
Nothing reads a new setting until a deploy goes out.

Use the test keys first. Stripe gives you a card number to pay with,
and nothing real moves.

## Two things to set inside the platform, not in Stripe

**The prices.** Global team, Plans, and each Village's own pricing.
This is the only place a membership price lives. It is what the
Membership page shows and what Stripe charges, so the two cannot
disagree.

**The educator share.** Global team, Plans, the educator share setting.
It is 70 percent until somebody decides otherwise. The payouts form
takes its default from that setting now.

## What starts working

Upgrading to the paid plan, and cancelling it. Paid event tickets, for
members and for guests. Buying a course at the member price or the
public one. Refunds, which close a course again and mark the payment.
Receipts. Educator earnings and payouts.

## How to know it worked

Upgrade yourself with a test card. Then check:

- Your settings say Paid member, with a renewal date.
- Global team, Payments, shows the payment.
- Stripe, Webhooks, shows a 200 against the event.

If the payment is in Stripe but not in the platform, it is the webhook:
wrong address, wrong secret, or the events not selected.