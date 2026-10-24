"use client";

import Link from "next/link";
import { useState } from "react";
import { Ic } from "@/components/icon";
import {
  type Pricing,
  priceLine,
  anyFounding,
} from "@/lib/pricing";

export type Plan = {
  id: string;
  slug: string;
  name: string;
  badge: string | null;
  tagline: string | null;
  blurb: string | null;
  price_cents: number;
  currency: string;
  interval: string;
  features: string[] | null;
  not_included: string[] | null;
};

// Her framework writes a tier as a badge, a price, a line in bold, a
// sentence of who it is for, and then everything it includes. The card
// used to list the free tier and what paying adds on top, which counts
// differently and is why her lists could not be dropped into it.
function Tier({
  plan,
  children,
}: {
  plan: Plan;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="p2-top">
        <h3>{plan.name}</h3>
        {plan.badge ? <span className="p2-tag">{plan.badge}</span> : null}
      </div>
      {children}
      {plan.tagline ? (
        <p className="p2-note">
          <b>{plan.tagline}</b>
        </p>
      ) : null}
      {plan.blurb ? <p className="p2-note">{plan.blurb}</p> : null}
    </>
  );
}

function Included({ plan }: { plan: Plan }) {
  return (
    <ul className="p2-list">
      {(plan.features ?? []).map((f) => (
        <li key={f}>
          <Ic name="check" />
          {f}
        </li>
      ))}
      {(plan.not_included ?? []).map((f) => (
        <li className="no" key={f}>
          <Ic name="x" />
          {f}
        </li>
      ))}
    </ul>
  );
}

// The two plan cards and the billing switch above them, as the
// prototype draws them. The price comes from the Village, since each one
// bills in its own currency, at its founding rate while that is open.
export function Plans({
  plans,
  pricing = [],
}: {
  plans: Plan[];
  pricing?: Pricing[];
}) {
  const [yearly, setYearly] = useState(false);

  const member = plans.find((p) => p.slug === "member");
  const paid = plans.find((p) => p.slug === "paid");
  if (!member || !paid) return null;

  const monthly = priceLine(pricing, false);
  const year = priceLine(pricing, true);
  const priced = monthly !== null;
  const founding = anyFounding(pricing);

  return (
    <>
      {priced ? (
        <div className="billing" role="group" aria-label="Billing period">
          <button
            type="button"
            className={yearly ? "" : "on"}
            onClick={() => setYearly(false)}
          >
            Monthly
          </button>
          <button
            type="button"
            className={yearly ? "on" : ""}
            onClick={() => setYearly(true)}
          >
            Yearly
          </button>
        </div>
      ) : null}

      <div className="plans">
        <div className="plan2">
          <Tier plan={member}>
            <div className="p2-price">
              <b>By application</b>
              <span>Every request is read personally</span>
            </div>
          </Tier>
          <Link className="btn btn-ghost" href="/apply">
            Request your invitation
          </Link>
          <Included plan={member} />
        </div>

        <div className="plan2 p2-best">
          {founding ? (
            <span className="p2-ribbon">First 50 per village</span>
          ) : null}
          <Tier plan={paid}>
            <div className="p2-price">
              <b>{(yearly ? year : monthly) ?? "Not set yet"}</b>
              <span>
                {priced
                  ? (yearly ? "per year" : "per month") +
                    ", in your Village's currency" +
                    (founding ? ", while founding places last" : "")
                  : "The price is still being decided"}
              </span>
            </div>
          </Tier>
          <Link className="btn btn-primary" href="/login">
            Sign in
          </Link>
          <Included plan={paid} />
        </div>
      </div>
    </>
  );
}