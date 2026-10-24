// What each Village charges, read from the village_pricing view.
//
// Prices live per Village because the Membership Offer and Access
// Framework bills Dubai in AED and Paris and Lisbon in EUR. A Village
// charges its founding rate while founding is still open there, and its
// standard rate once it is not.

export type Pricing = {
  village_slug: string;
  village_name: string;
  currency: string;
  month_cents: number;
  year_cents: number;
  founding_month_cents: number | null;
  founding_year_cents: number | null;
  founding_open: boolean;
};

export function money(cents: number, currency: string) {
  return (cents / 100).toLocaleString("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

// What this Village charges today, in cents, or null if it has no price.
export function rateOf(p: Pricing, yearly: boolean): number | null {
  if (p.founding_open) {
    const f = yearly ? p.founding_year_cents : p.founding_month_cents;
    if (f && f > 0) return f;
  }
  const s = yearly ? p.year_cents : p.month_cents;
  return s > 0 ? s : null;
}

// The lowest figure in each currency, cheapest first, which is how the
// framework's own sales page writes it: "From EUR 15 / AED 59".
export function fromRates(pricing: Pricing[], yearly: boolean): string[] {
  const low = new Map<string, number>();
  for (const p of pricing) {
    const cents = rateOf(p, yearly);
    if (cents == null) continue;
    const have = low.get(p.currency);
    if (have == null || cents < have) low.set(p.currency, cents);
  }
  return [...low.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([currency, cents]) => money(cents, currency));
}

// The one line a plan card shows. More than one figure means more than
// one currency, so it reads as a starting price.
export function priceLine(pricing: Pricing[], yearly: boolean): string | null {
  const rates = fromRates(pricing, yearly);
  if (!rates.length) return null;
  return (rates.length > 1 ? "From " : "") + rates.join(" / ");
}

// Whether any Village is still inside its founding window.
export function anyFounding(pricing: Pricing[]): boolean {
  return pricing.some((p) => p.founding_open);
}
