import Stripe from "stripe";
import { siteUrl } from "@/lib/site";

// Payments stay switched off until the keys are set, so the pages can say
// so plainly instead of failing.
export const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY);

// Membership used to be one Stripe price for the whole network, which
// cannot say AED 59 for Dubai and EUR 15 for Paris, nor the founding
// rate against the standard one, nor a month against a year. The price
// is built from the member's own Village at checkout instead, the way a
// ticket already was, so there is nothing here to keep in step.

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  return new Stripe(key);
}

// Kept exported here because the checkout pages import it from this file.
export { siteUrl };