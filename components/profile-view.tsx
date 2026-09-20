import Link from "next/link";
import { Av, Flag } from "@/components/bits";
import { Ic } from "@/components/icon";
import { ProfileTabs } from "@/components/profile";

export type ProfilePerson = {
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
  founding?: boolean | null;
};

const handleOf = (name: string) =>
  "@" + name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "");

// The cover behind a profile, tinted by the Village it belongs to.
const COVER: Record<string, string> = {
  dubai: "ph-dubai",
  lisbon: "ph-lisbon",
  paris: "ph-paris",
};

// xprofile: the cover, the card with everything about a person, then
// the tabs and what sits under them.
export function ProfileView({
  person,
  villageName,
  villageSlug,
  circleName,
  country,
  relation,
  actions,
  notice,
  stats,
  publicView = false,
  activity,
}: {
  person: ProfilePerson;
  villageName?: string | null;
  villageSlug?: string | null;
  circleName?: string | null;
  country?: string | null;
  relation?: string | null;
  actions: React.ReactNode;
  notice?: React.ReactNode;
  stats?: [number | string, string][];
  publicView?: boolean;
  activity?: React.ReactNode;
}) {
  const lived = (person.lived_in ?? []).filter(Boolean);

  const about = (
    <div className="sp-about">
      {person.languages?.length ? (
        <div>
          <span className="sp-label">Languages</span>
          <div className="tags">
            {person.languages.map((l) => (
              <span className="chip" key={l}>
                {l}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {person.can_help_with ? (
        <div>
          <span className="sp-label">Can help with</span>
          <p>{person.can_help_with}</p>
        </div>
      ) : null}
      {person.markets_known?.length ? (
        <div>
          <span className="sp-label">Markets known</span>
          <div className="tags">
            {person.markets_known.map((m) => (
              <span className="chip" key={m}>
                <Flag country={m} /> {m}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div>
        <span className="sp-label">Looking for</span>
        <p>
          {publicView ? (
            <span className="muted">Visible to members</span>
          ) : (
            person.looking_for ?? <span className="muted">Not said yet</span>
          )}
        </p>
      </div>
    </div>
  );

  const tabs = [
    ...(activity ? [{ id: "activity", label: "Activity", content: activity }] : []),
    { id: "about", label: "About", content: about },
  ];

  return (
    <div className="sp">
      <div className={`sp-cover ${villageSlug ? COVER[villageSlug] ?? "" : ""}`}>
        {villageName ? (
          <span className="sp-cover-chip">
            <Ic name="pin" />
            {villageName}
            {country ? `, ${country}` : ""}
          </span>
        ) : null}
      </div>

      <div className="sp-card">
        <div className="sp-row">
          <span className="sp-avatar">
            <Av name={person.full_name} className="sp-av" />
            {person.founding ? (
              <span className="sp-badge" title="Founding member">
                <Ic name="star" />
              </span>
            ) : null}
          </span>
          <div className="sp-actions-top">{actions}</div>
        </div>

        <div className="sp-name">
          <h1>{person.full_name}</h1>
          {person.founding ? (
            <span className="sp-pill sp-pill-gold">Founding member</span>
          ) : null}
          {relation ? <span className="sp-pill">{relation}</span> : null}
        </div>
        <div className="sp-handle">{handleOf(person.full_name)}</div>
        {person.headline || person.bio ? (
          <p className="sp-bio">
            {[person.headline, person.bio].filter(Boolean).join(". ")}
          </p>
        ) : null}

        <div className="sp-chips">
          {person.industry ? (
            <span className="sp-chip">
              <Ic name="briefcase" />
              {person.industry}
            </span>
          ) : null}
          {person.business_name ? (
            <span className="sp-chip">
              <Ic name="star" />
              {person.business_name}
            </span>
          ) : null}
          {circleName ? (
            <span className="sp-chip sp-chip-mint">
              <Ic name="rings" />
              {circleName}
            </span>
          ) : null}
        </div>

        {villageName || lived.length ? (
          <div className="sp-journey">
            <span className="sp-journey-l">
              <Ic name="globe" />
              Expat journey
            </span>
            {villageName ? (
              <span className="sp-stop sp-now">
                {country ? <Flag country={country} /> : null} {villageName}{" "}
                <em>now</em>
              </span>
            ) : null}
            {lived.map((place) => (
              <span className="sp-stop" key={place}>
                <Flag country={place} /> {place}
              </span>
            ))}
          </div>
        ) : null}

        {stats?.length ? (
          <div className="sp-stats">
            {stats.map(([n, label]) => (
              <div className="sp-stat" key={label}>
                <b>{n}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {notice}

      <ProfileTabs tabs={tabs} />
    </div>
  );
}

// sp-side: the small cards down the right of a profile.
export function SideCard({
  href,
  icon,
  title,
  line,
  note,
}: {
  href?: string;
  icon: string;
  title: string;
  line?: string | null;
  note?: string | null;
}) {
  const inner = (
    <>
      <span className="sp-side-ic">
        <Ic name={icon} />
      </span>
      <span className="sp-side-body">
        <b>{title}</b>
        {line ? <span>{line}</span> : null}
        {note ? <em>{note}</em> : null}
      </span>
    </>
  );
  return href ? (
    <Link className="sp-side" href={href}>
      {inner}
    </Link>
  ) : (
    <div className="sp-side">{inner}</div>
  );
}