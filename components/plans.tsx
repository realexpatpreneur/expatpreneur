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
  blurb: string | null;
  price_cents: number;
  currency: string;
  interval: string;
  features: string[] | null;
};

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

  // What Village Membership adds is what the free one does not have.
  const adds = (paid.features ?? []).slice(0, 3);

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
          <div className="p2-top">
            <h3>{member.name}</h3>
            <span className="p2-tag">Your own Village</span>
          </div>
          <div className="p2-price">
            <b>By application</b>
            <span>Every request is read personally</span>
          </div>
          <Link className="btn btn-ghost" href="/apply">
            Request your invitation
          </Link>
          <ul className="p2-list">
            {(member.features ?? []).map((f) => (
              <li key={f}>
                <Ic name="check" />
                {f}
              </li>
            ))}
            {adds.map((f) => (
              <li className="no" key={f}>
                <Ic name="x" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="plan2 p2-best">
          <span className="p2-ribbon">Village Membership</span>
          <div className="p2-top">
            <h3>{paid.name}</h3>
            <span className="p2-tag">Every Village</span>
          </div>
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
          <Link className="btn btn-primary" href="/login">
            Sign in
          </Link>
          <ul className="p2-list">
            <li>
              <Ic name="check" />
              Everything included in {member.name}
            </li>
            {(paid.features ?? []).map((f) => (
              <li key={f}>
                <Ic name="check" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}