import Link from "next/link";
import { Ic } from "@/components/icon";
import { Av } from "@/components/bits";

// The Village photographs the prototype ships with, by slug. A Village
// it does not have a photograph for gets the hatched "future" block.
const VPHOTO: Record<string, string> = {
  dubai: "ph-dubai",
  lisbon: "ph-lisbon",
  paris: "ph-paris",
};

// The class carrying a Village's photograph, so the card and the Village
// page itself use the same one.
export function villagePhoto(slug: string) {
  return VPHOTO[slug] ?? "ph-future";
}

export const villageStatus: Record<string, [string, string]> = {
  open: ["Open for invitation requests", "chip-mint"],
  launching: ["Launching soon", "chip-sun"],
  exploring: ["Being explored", "chip-sun"],
  paused: ["Paused", ""],
  archived: ["Archived", ""],
};

export type VillageRow = {
  id?: string;
  slug: string;
  name: string;
  country: string | null;
  status: string;
  summary?: string | null;
  members?: number | null;
  circles?: number | null;
  cover_url?: string | null;
};

// vcard
export function VillageCard({ village }: { village: VillageRow }) {
  const [label, chip] = villageStatus[village.status] ?? [village.status, ""];
  const open = village.status === "open";
  return (
    <Link className="vcard" href={`/villages/${village.slug}`}>
      <div
        className={`vphoto ${villagePhoto(village.slug)}`}
        role="img"
        aria-label={village.name}
        style={
          village.cover_url
            ? {
                background: `linear-gradient(to top,rgba(20,32,44,.72) 0%,rgba(20,32,44,.1) 60%),url('${village.cover_url}') center/cover`,
              }
            : undefined
        }
      >
        <h3>{village.name}</h3>
      </div>
      <div className="vbody">
        <span className={`chip ${chip}`} style={{ alignSelf: "flex-start" }}>
          {label}
        </span>
        <p className="muted small">
          {village.country}.{" "}
          {open
            ? `${village.members ?? 0} members in ${village.circles ?? 0} Circle${
                (village.circles ?? 0) === 1 ? "" : "s"
              }.`
            : "Opening soon."}
        </p>
        <span
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: "flex-start", marginTop: "auto" }}
        >
          {open ? `Explore ${village.name}` : "Join the waitlist"}
        </span>
      </div>
    </Link>
  );
}

const TONES = ["ct-blue", "ct-mint", "ct-navy", "ct-sun", "ct-pink"];

export type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  summary: string | null;
  offer?: string | null;
  logo_url?: string | null;
  owner_name?: string | null;
  village_name?: string | null;
};

// bizCard. Where there is no photograph yet, a colour block carries the
// card, which is what the prototype does everywhere else.
export function BusinessCard({ biz, i = 0, href }: { biz: BusinessRow; i?: number; href?: string }) {
  return (
    <Link className="bizcard" href={href ?? `/businesses/${biz.slug}`}>
      {biz.logo_url ? (
        <div
          className="photo"
          role="img"
          aria-label={biz.name}
          style={{ height: 120, backgroundImage: `url('${biz.logo_url}')` }}
        />
      ) : (
        <span className={`ctile ${TONES[i % TONES.length]}`} style={{ margin: 0, height: 120 }}>
          <b>{biz.name}</b>
          {biz.category ? <span>{biz.category}</span> : null}
        </span>
      )}
      <div className="b">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <b>{biz.name}</b>
          {biz.category ? <span className="chip">{biz.category}</span> : null}
        </div>
        <p className="muted small">{biz.summary}</p>
        {biz.offer ? (
          <span className="chip chip-mint" style={{ alignSelf: "flex-start" }}>
            <Ic name="tag" style={{ width: 13, height: 13 }} />
            {biz.offer}
          </span>
        ) : null}
        {biz.owner_name ? (
          <div className="row small muted" style={{ marginTop: "auto" }}>
            <Av name={biz.owner_name} className="av-sm" />
            {biz.owner_name}
            {biz.village_name ? `, ${biz.village_name}` : ""}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export type CourseRow = {
  id: string;
  slug: string;
  title: string;
  level?: string | null;
  format?: string | null;
  price_cents?: number | null;
  currency?: string | null;
  cover_url?: string | null;
};

// The prototype's course card: a photograph, the format, the title and
// the price.
export function CourseCard({ course, i = 0, href }: { course: CourseRow; i?: number; href?: string }) {
  const price = course.price_cents
    ? `${(course.price_cents / 100).toFixed(0)} ${course.currency ?? "EUR"}`
    : "Free";
  return (
    <Link className="coursecard" href={href ?? `/learning/${course.slug}`}>
      {course.cover_url ? (
        <div
          className="photo"
          role="img"
          aria-label={course.title}
          style={{ height: 130, backgroundImage: `url('${course.cover_url}')` }}
        />
      ) : (
        <span className={`ctile ${TONES[i % TONES.length]}`} style={{ margin: 0, height: 130 }}>
          <b>{course.title}</b>
        </span>
      )}
      <div className="b">
        <span className="chip" style={{ alignSelf: "flex-start" }}>
          {course.format === "live" ? "Live workshop" : "Recorded"}
        </span>
        <b>{course.title}</b>
        <div className="row" style={{ justifyContent: "space-between", marginTop: "auto" }}>
          <b>{price}</b>
          {course.level ? <span className="small muted">{course.level}</span> : null}
        </div>
      </div>
    </Link>
  );
}

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  standfirst: string | null;
  kind?: string;
  cover_url?: string | null;
};

// The prototype's article card.
export function ArticleCard({ article, i = 0, href }: { article: ArticleRow; i?: number; href?: string }) {
  return (
    <Link className="artcard" href={href ?? `/media/${article.slug}`}>
      {article.cover_url ? (
        <div
          className="photo"
          role="img"
          aria-label={article.title}
          style={{ height: 170, backgroundImage: `url('${article.cover_url}')` }}
        />
      ) : (
        <span className={`ctile ${TONES[i % TONES.length]}`} style={{ margin: 0, height: 170 }}>
          <b>{article.title}</b>
        </span>
      )}
      {article.kind ? (
        <span className="chip chip-pink" style={{ alignSelf: "flex-start" }}>
          {article.kind}
        </span>
      ) : null}
      <b style={{ fontSize: 15 }}>{article.title}</b>
      {article.standfirst ? <p className="muted small">{article.standfirst}</p> : null}
    </Link>
  );
}