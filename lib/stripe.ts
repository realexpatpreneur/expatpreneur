import Stripe from "stripe";

// Payments stay switched off until the keys are set, so the pages can say
// so plainly instead of failing.
export const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY);

export const membershipPriceId = process.env.STRIPE_MEMBERSHIP_PRICE_ID ?? "";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  return new Stripe(key);
}

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://expatpreneur.vercel.app";