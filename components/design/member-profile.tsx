import Link from "next/link";
import type { ReactNode } from "react";

export type ProfilePersonM = {
  id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  business_name: string | null;
  industry: string | null;
  languages?: string[] | null;
  markets_known?: string[] | null;
  lived_in: string[] | null;
  can_help_with?: string | null;
  looking_for?: string | null;
  avatar_url?: string | null;
};

type Recent = { id: string; kind: string; title: string; status: string; created_at: string };

const tagOf = (kind: string) =>
  kind === "offer" ? ["offer", "Offer"] : kind === "introduction" ? ["introduction", "Hello"] : ["ask", "Ask"];

const andList = (items: string[]) => items.join(", ").replace(/, ([^,]*)$/, " and $1");

// A person in the member space: the portrait first, big, then what they
// can help with and what they are looking for, their business and what
// they have posted. Used for somebody else's profile and for your own.
export function MemberProfileView({
  person,
  villageName,
  circleName,
  relation,
  self = false,
  publicView = false,
  recent = [],
  crumbs,
  actions,
  below,
  notice,
  top,
  aside,
}: {
  person: ProfilePersonM;
  villageName: string | null;
  circleName: string | null;
  relation?: string | null;
  self?: boolean;
  /* Your own preview of the public page, which leaves out what a visitor
     is never handed. */
  publicView?: boolean;
  recent?: Recent[];
  crumbs?: [string, string][];
  actions?: ReactNode;
  below?: ReactNode;
  notice?: ReactNode;
  top?: ReactNode;
  aside?: ReactNode;
}) {
  const first = person.full_name.split(" ")[0];
  const lived = (person.lived_in ?? []).filter(Boolean);
  const initials = person.full_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const place = [villageName ? `${villageName} Village` : null, publicView ? null : circleName]
    .filter(Boolean)
    .join(", ");
  const languages = publicView ? [] : person.languages ?? [];
  const markets = publicView ? [] : person.markets_known ?? [];

  return (
    <>
      {crumbs ? (
        <nav className="m-crumb" aria-label="Breadcrumb">
          {crumbs.map(([label, href]) => (
            <span key={href} style={{ display: "contents" }}>
              <Link href={href}>{label}</Link>
              <span>/</span>
            </span>
          ))}
          <span>{person.full_name}</span>
        </nav>
      ) : null}

      {top}

      <section className="m-phero">
        <div className="m-portrait">
          {person.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={person.avatar_url} alt={person.full_name} />
          ) : (
            <span className="m-big" style={{ background: "#E6F4F1" }}>
              {initials}
            </span>
          )}
        </div>
        <div>
          {place || relation ? (
            <span className="m-kind" style={{ color: "#2F8F77" }}>
              {[place, relation].filter(Boolean).join(". ")}
            </span>
          ) : null}
          <h1>{person.full_name}</h1>
          {person.headline || person.business_name ? (
            <p style={{ margin: "8px 0 0", fontSize: 18, color: "#3B4650" }}>
              {person.headline ?? person.business_name}
            </p>
          ) : null}
          {lived.length || villageName ? (
            <div className="m-route">
              {lived.map((p) => (
                <span key={p} style={{ display: "contents" }}>
                  <span>{p}</span>
                  <i>/</i>
                </span>
              ))}
              {villageName ? <span className="now">{villageName}, now</span> : null}
            </div>
          ) : null}
          {languages.length ? (
            <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14 }}>
              Works in {andList(languages)}.
            </p>
          ) : null}
          {actions ? <div className="m-pacts">{actions}</div> : null}
          {below}
          {notice ? <div style={{ marginTop: 24, maxWidth: 560 }}>{notice}</div> : null}
        </div>
      </section>

      <div className="m-pcols">
        <div style={{ minWidth: 0 }}>
          {person.bio ? (
            <>
              <h2 className="m-h2">About</h2>
              <p style={{ margin: "12px 0 0", fontSize: 16, lineHeight: 1.7, color: "#3B4650", maxWidth: "62ch", whiteSpace: "pre-line" }}>
                {person.bio}
              </p>
            </>
          ) : null}

          <div className="m-two" style={{ marginTop: person.bio ? 28 : 0 }}>
            {publicView ? null : (
              <div className="m-need">
                <span className="m-kind m-offer">Can help with</span>
                <p>{person.can_help_with || <span className="m-muted">Not said yet</span>}</p>
              </div>
            )}
            <div className="m-need">
              <span className="m-kind m-ask">Looking for</span>
              <p>
                {publicView ? (
                  <span className="m-muted">Visible to members</span>
                ) : (
                  person.looking_for || <span className="m-muted">Not said yet</span>
                )}
              </p>
            </div>
          </div>

          {person.business_name ? (
            <>
              <h2 className="m-h2" style={{ marginTop: 44 }}>
                {self ? "Your business" : `${first}'s business`}
              </h2>
              <div className="m-biz">
                <span className="m-bizmark">{person.business_name.slice(0, 1)}</span>
                <span style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, padding: "22px 24px" }}>
                  {person.industry ? <span className="m-kind m-muted">{person.industry}</span> : null}
                  <b style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>{person.business_name}</b>
                </span>
              </div>
            </>
          ) : null}

          {recent.length && !publicView ? (
            <>
              <h2 className="m-h2" style={{ marginTop: 44 }}>Recently on Ask &amp; Offer</h2>
              <div className="m-ao" style={{ marginTop: 12 }}>
                {recent.map((r) => {
                  const [cls, label] = tagOf(r.kind);
                  return (
                    <Link key={r.id} className="m-aorow" href={`/village/${r.id}`}>
                      <span className={`m-tag ${cls}`}>{label}</span>
                      <span style={{ minWidth: 0 }}>
                        <b>{r.title}</b>
                        <span className="m-aometa">
                          {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
                        </span>
                      </span>
                      <span className="m-status" style={{ color: r.status === "open" ? "#24675A" : "#6B7683" }}>
                        {r.status === "open" ? "Open" : "Resolved"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <aside style={{ display: "grid", gap: 20, alignContent: "start" }}>
          <div className="m-card">
            <h3>Details</h3>
            <dl className="m-dl">
              {villageName ? (
                <>
                  <dt>Village</dt>
                  <dd>{villageName}</dd>
                </>
              ) : null}
              {circleName && !publicView ? (
                <>
                  <dt>Circle</dt>
                  <dd>{circleName}</dd>
                </>
              ) : null}
              {person.industry ? (
                <>
                  <dt>Industry</dt>
                  <dd>{person.industry}</dd>
                </>
              ) : null}
              {markets.length ? (
                <>
                  <dt>Markets</dt>
                  <dd>{markets.join(", ")}</dd>
                </>
              ) : null}
              {languages.length ? (
                <>
                  <dt>Languages</dt>
                  <dd>{languages.join(", ")}</dd>
                </>
              ) : null}
            </dl>
          </div>
          {aside}
          <div className="m-card" style={{ background: "#F4F6F8", borderColor: "#F4F6F8" }}>
            <h3>What is never shown</h3>
            <p className="m-muted" style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.5 }}>
              Email, phone and anything written for admins stay private.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
