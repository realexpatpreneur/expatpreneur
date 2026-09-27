# Switching payments on

Everything below is built. None of it runs until the four settings at
the bottom exist in Vercel.

## What to make in Stripe

**1. The membership price.** Products, add a product called Paid
member, recurring, monthly, at whatever you decide the price is. Copy
its price identifier, which starts with `price_`.

**2. The webhook.** Developers, Webhooks, add an endpoint pointing at:

    https://expatpreneur.vercel.app/api/stripe/webhook

Send it these five events and nothing else:

    checkout.session.completed
    charge.refunded
    invoice.payment_failed
    customer.subscription.updated
    customer.subscription.deleted

Copy the signing secret, which starts with `whsec_`.

**3. The card portal.** Settings, Billing, Customer portal, turn it on
and allow cancelling. That is what the Update card and Cancel buttons
in a member's settings open.

## The four settings, in Vercel

    STRIPE_SECRET_KEY            sk_live_... or sk_test_... to try it
    STRIPE_MEMBERSHIP_PRICE_ID   price_...
    STRIPE_WEBHOOK_SECRET        whsec_...
    NEXT_PUBLIC_SITE_URL         the address, once the domain exists

Use the test keys first. Stripe gives you a card number to pay with,
and nothing real moves.

## Two things to set inside the platform, not in Stripe

**The price members see.** Global team, Plans. The price on the
Membership page comes from there, not from Stripe, so the page can say
what it costs before Stripe is connected. Put the same number in both
or the page will disagree with the checkout.

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