"use client";

import Link from "next/link";
import { useState } from "react";
import { type Pricing, standardLine, foundingLine } from "@/lib/pricing";
import { Tick, Cross } from "@/components/design/parts";
import type { Plan } from "@/components/plans";

// The two membership cards as the design board draws them. The Village
// Member card leads with the standard rate and shows the founding rate
// beside it, so nobody reads the founding figure as the price for good.
export function MembershipPlans({
  plans,
  pricing,
  seats,
}: {
  plans: Plan[];
  pricing: Pricing[];
  seats: number;
}) {
  const [yearly, setYearly] = useState(false);
  const member = plans.find((p) => p.slug === "member");
  const paid = plans.find((p) => p.slug === "paid");
  if (!member || !paid) return null;

  const standard = standardLine(pricing, yearly);
  const founding = foundingLine(pricing, yearly);
  const per = yearly ? "per year" : "per month";

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24, paddingTop: 28, borderTop: "1px solid #E3E6EA" }}>
        {standard ? (
          <div className="d-toggle" role="group" aria-label="Billing period">
            <button type="button" className={yearly ? "" : "on"} aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
            <button type="button" className={yearly ? "on" : ""} aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly</button>
          </div>
        ) : <span />}
        <p className="d-small">
          Priced in your Village&apos;s currency.
          {founding ? ` The first ${seats} members of each Village pay the founding rate.` : ""}
        </p>
      </div>

      <div className="d-plans">
        <article className="d-plan d-plan-1">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>{member.name}</h2>
            {member.badge ? <span className="d-small" style={{ fontWeight: 600 }}>{member.badge}</span> : null}
          </div>
          {member.tagline ? <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600 }}>{member.tagline}</p> : null}
          <p className="d-price">By application</p>
          <p className="d-small" style={{ marginTop: 6 }}>Every request is read personally</p>
          {member.blurb ? <p className="d-body" style={{ marginTop: 18 }}>{member.blurb}</p> : null}
          <Link className="d-btn d-btn-line d-shine d-btn-wide" href="/apply" style={{ marginTop: 24 }}>Request your invitation</Link>
          <ul className="d-ticks">
            {(member.features ?? []).map((f) => (
              <li key={f}><Tick /><span>{f}</span></li>
            ))}
            {(member.not_included ?? []).map((f) => (
              <li className="no" key={f}><Cross /><span>{f}</span></li>
            ))}
          </ul>
        </article>

        <article className="d-plan d-plan-2">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", color: "#FFFFFF" }}>{paid.name}</h2>
            {paid.badge ? <span style={{ fontSize: 14, fontWeight: 600, color: "#B9C3CD" }}>{paid.badge}</span> : null}
          </div>
          {paid.tagline ? <p style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: "#B9C3CD" }}>{paid.tagline}</p> : null}
          <p className="d-price" style={{ color: "#FFFFFF" }}>{standard ?? "Not set yet"}</p>
          <p style={{ marginTop: 6, fontSize: 14, color: "#B9C3CD" }}>
            {standard ? `${per}, in your Village's currency` : "The price is still being decided"}
          </p>
          {founding ? (
            <div className="d-found">
              <span className="d-lbl" style={{ color: "#A8DCD1" }}>Founding rate, first {seats} in each Village</span>
              <span className="d-found-tag">While places last</span>
              <span style={{ fontSize: 15, color: "#FFFFFF" }}>
                <b style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>{founding}</b> {per}
              </span>
            </div>
          ) : null}
          {paid.blurb ? <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.6, color: "#B9C3CD" }}>{paid.blurb}</p> : null}
          <Link className="d-btn d-btn-mint d-shine d-glint d-btn-wide" href="/login" style={{ marginTop: 24 }}>Sign in</Link>
          <ul className="d-ticks d-ticks-2">
            {(paid.features ?? []).map((f) => (
              <li key={f}><Tick color="#A8DCD1" /><span>{f}</span></li>
            ))}
          </ul>
        </article>
      </div>
    </>
  );
}
