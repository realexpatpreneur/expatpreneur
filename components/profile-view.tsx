import Link from "next/link";
import { Av, Flag, NationalityFlag } from "@/components/bits";
import { Ic } from "@/components/icon";

export type ProfilePerson = {
  id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  business_name: string | null;
  industry: string | null;
  nationalities?: string[] | null;
  languages?: string[] | null;
  markets_known?: string[] | null;
  lived_in: string[] | null;
  can_help_with?: string | null;
  looking_for?: string | null;
  founding?: boolean | null;
  avatar_url?: string | null;
  joined_on?: string | null;
};

export type Row = [string, React.ReactNode];

// journey(): where somebody is now, and where they have been. The
// prototype keeps this on one line under the name, with a flag against
// each place.
function Journey({
  city,
  country,
  lived,
}: {
  city: string | null;
  country: string | null;
  lived: string[];
}) {
  const here = [city, country].filter(Boolean).join(", ");
  if (!here && !lived.length) return null;
  return (
    <div className="journey">
      {here ? (
        <span>
          <b>Currently based in:</b> {here}{" "}
          {country ? <Flag country={country} /> : null}
        </span>
      ) : null}
      {here && lived.length ? <span className="jsep">|</span> : null}
      {lived.length ? (
        <span>
          <b>Lived in:</b>{" "}
          {lived.map((place, i) => (
            <span key={place}>
              {i ? ", " : ""}
              <Flag country={place} /> {place}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

// The prototype's profile: one panel with the head of it, then two
// columns, the facts on the left and whatever belongs beside them on
// the right.
export function ProfileView({
  person,
  villageName,
  villageCity,
  country,
  circleName,
  roleChip,
  actions,
  notice,
  extraRows,
  aside,
  publicView = false,
}: {
  person: ProfilePerson;
  villageName?: string | null;
  villageCity?: string | null;
  country?: string | null;
  circleName?: string | null;
  roleChip?: string | null;
  actions?: React.ReactNode;
  notice?: React.ReactNode;
  extraRows?: Row[];
  aside?: React.ReactNode;
  publicView?: boolean;
}) {
  const lived = (person.lived_in ?? []).filter(Boolean);

  const rows: Row[] = [];
  if (person.nationalities?.length) {
    rows.push([
      "Nationalities",
      <div className="tags" key="nat">
        {person.nationalities.map((n) => (
          <span className="chip" key={n}>
            <NationalityFlag nationality={n} /> {n}
          </span>
        ))}
      </div>,
    ]);
  }
  if (person.languages?.length) rows.push(["Languages", person.languages.join(", ")]);
  if (person.can_help_with) rows.push(["I can help with", person.can_help_with]);
  if (person.markets_known?.length) {
    rows.push([
      "Markets I know",
      <div className="tags" key="mk">
        {person.markets_known.map((m) => (
          <span className="chip" key={m}>
            <Flag country={m} /> {m}
          </span>
        ))}
      </div>,
    ]);
  }
  rows.push([
    "I am looking for",
    publicView ? (
      <span className="muted">Members only</span>
    ) : (
      person.looking_for ?? <span className="muted">Not said yet</span>
    ),
  ]);
  for (const row of extraRows ?? []) rows.push(row);

  return (
    <>
      <div className="panel">
        <div className="profhead">
          <Av
            name={person.full_name}
            className="av-lg"
            src={person.avatar_url ?? null}
          />
          <div>
            <h1 style={{ fontSize: 22 }}>{person.full_name}</h1>
            {person.headline || person.bio ? (
              <p className="muted">
                {[person.headline, person.bio].filter(Boolean).join(". ")}
              </p>
            ) : null}
            <Journey city={villageCity ?? null} country={country ?? null} lived={lived} />
            <div className="tags" style={{ marginTop: 8 }}>
              {villageName ? (
                <span className="chip chip-blue">
                  <Ic name="pin" style={{ width: 13, height: 13 }} />
                  {villageName} Village
                </span>
              ) : null}
              {person.industry ? <span className="chip">{person.industry}</span> : null}
              {person.founding ? (
                <span className="chip chip-founding">
                  <Ic name="star" style={{ width: 13, height: 13 }} />
                  Founding member
                </span>
              ) : null}
              {roleChip ? <span className="chip chip-mint">{roleChip}</span> : null}
              {circleName ? <span className="chip">{circleName}</span> : null}
            </div>
          </div>
          {actions ? <div className="actions row">{actions}</div> : null}
        </div>
        {notice}
      </div>

      <div className="gside" style={{ marginTop: 18 }}>
        <div className="panel">
          <dl className="kv">
            {rows.map(([label, value]) => (
              <div key={label} style={{ display: "contents" }}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="stack">{aside}</div>
      </div>
    </>
  );
}

// The panels down the right of a profile, as the prototype writes them:
// a heading, a line under it, and the whole thing a link when there is
// somewhere to go.
export function SideCard({
  href,
  title,
  line,
  cta,
}: {
  href?: string;
  title: string;
  line?: string | null;
  cta?: string | null;
}) {
  const inner = (
    <>
      <h3 style={{ fontSize: 14 }}>{title}</h3>
      {line ? (
        <p className="muted small" style={{ marginTop: 4 }}>
          {line}
        </p>
      ) : null}
      {cta ? (
        <span className="small" style={{ fontWeight: 600, color: "var(--blue)" }}>
          {cta}
        </span>
      ) : null}
    </>
  );
  return href ? (
    <Link className="panel linkrow" href={href}>
      {inner}
    </Link>
  ) : (
    <div className="panel">{inner}</div>
  );
}

// The Activity panel, counted rather than guessed at.
export function ActivityCard({ rows }: { rows: [string, number][] }) {
  return (
    <div className="panel">
      <h3 style={{ fontSize: 14 }}>Activity</h3>
      <dl className="kv" style={{ gridTemplateColumns: "1fr auto", marginTop: 8 }}>
        {rows.map(([label, n]) => (
          <div key={label} style={{ display: "contents" }}>
            <dt>{label}</dt>
            <dd>{n}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}