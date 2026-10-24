# 126-the-photographs.ps1
# You were right and I was wrong. One migration:
# 0046_photographs_from_prototype.sql.
#
# I said the prototype's images were generated in the browser and there
# was nothing to port. They are Unsplash photographs referenced by id,
# fourteen of them, sitting in the file you sent me, and the flags come
# from flagcdn. I should have looked instead of assuming.
#
# Four things were wrong, and only one was the data.
#
# The Village page had no photographic hero. The prototype opens with a
# 230 pixel photograph of the city and the Village name over it. The
# build opened with a plain heading. It has the hero now, and it reads
# the photograph from the database so it can be replaced without code.
#
# Event rows had no thumbnail. Every event row in the prototype carries
# one. They do now, on the home page, the events page, the Village page
# and the admin list.
#
# The business card was reading a column that does not exist. It asked
# for image_url; the column is logo_url. Every business photograph would
# have stayed invisible no matter what was in the database.
#
# And the flag table had 30 countries in it, out of the prototype's 83,
# so most members' journeys showed a bare country name. All 83 are in
# now, and nationalities appear on profiles with their flags, which the
# build was not showing at all.
#
# Then the migration: the same fourteen photographs, on the Villages,
# the seven events, the three articles, the eight videos, the six
# businesses and the shows. Each is stored in the database rather than
# written into the code, so replacing one is an edit in the Global
# workspace.
#
# They are placeholders, as the prototype's own first line says.
# Unsplash photography, to be replaced with your own before launch.
# What I have not done is port the member portraits: the prototype
# gives each member a stock photograph of a stranger, which is right for
# a mockup and wrong on a live site where those are real people's
# profiles. Say if you want them anyway for the demo.
#
# Run the migration in Supabase:
#   supabase/migrations/0046_photographs_from_prototype.sql
#
#   powershell -ExecutionPolicy Bypass -File .\126-the-photographs.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $relativePath"
}

$f0 = @'
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
'@
Write-File "components\cards.tsx" $f0

$f1 = @'
import { Ic } from "@/components/icon";

// The avatar: initials on one of the prototype's seven tints, chosen
// from the name so a person always gets the same colour.
const AVC = ["#A8DCD1", "#FEEEEC", "#CFE0F2", "#FBDDB9", "#D9E9D2", "#E8DDF3", "#FFE3A8"];

export function Av({ name, className = "" }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span className={`av ${className}`} style={{ background: AVC[h % AVC.length] }} aria-hidden="true">
      {initials}
    </span>
  );
}

// Flags come from flagcdn, as in the prototype, because Windows has no
// flag emoji and falls back to a pair of letters.
const ISO: Record<string, string> = {
  "Algeria": "DZ",
  "Angola": "AO",
  "Argentina": "AR",
  "Australia": "AU",
  "Austria": "AT",
  "Bahrain": "BH",
  "Bangladesh": "BD",
  "Belgium": "BE",
  "Brazil": "BR",
  "Cameroon": "CM",
  "Canada": "CA",
  "Chile": "CL",
  "China": "CN",
  "Colombia": "CO",
  "Cyprus": "CY",
  "Czechia": "CZ",
  "Denmark": "DK",
  "Egypt": "EG",
  "Estonia": "EE",
  "Ethiopia": "ET",
  "Finland": "FI",
  "France": "FR",
  "Germany": "DE",
  "Ghana": "GH",
  "Greece": "GR",
  "Hong Kong": "HK",
  "Hungary": "HU",
  "India": "IN",
  "Indonesia": "ID",
  "Iran": "IR",
  "Iraq": "IQ",
  "Ireland": "IE",
  "Italy": "IT",
  "Japan": "JP",
  "Jordan": "JO",
  "Kenya": "KE",
  "Kuwait": "KW",
  "Lebanon": "LB",
  "Luxembourg": "LU",
  "Malaysia": "MY",
  "Malta": "MT",
  "Mauritius": "MU",
  "Mexico": "MX",
  "Morocco": "MA",
  "Nepal": "NP",
  "Netherlands": "NL",
  "New Zealand": "NZ",
  "Nigeria": "NG",
  "Norway": "NO",
  "Oman": "OM",
  "Pakistan": "PK",
  "Peru": "PE",
  "Philippines": "PH",
  "Poland": "PL",
  "Portugal": "PT",
  "Qatar": "QA",
  "Romania": "RO",
  "Russia": "RU",
  "Rwanda": "RW",
  "Saudi Arabia": "SA",
  "Senegal": "SN",
  "Singapore": "SG",
  "South Africa": "ZA",
  "South Korea": "KR",
  "Spain": "ES",
  "Sri Lanka": "LK",
  "Sweden": "SE",
  "Switzerland": "CH",
  "Syria": "SY",
  "Taiwan": "TW",
  "Tanzania": "TZ",
  "Thailand": "TH",
  "Tunisia": "TN",
  "T\u00fcrkiye": "TR",
  "Uganda": "UG",
  "Ukraine": "UA",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  "Venezuela": "VE",
  "Vietnam": "VN",
  "Zambia": "ZM",
  "Zimbabwe": "ZW",
};

// A nationality names a country, so a nationality chip carries its flag.
export const NAT_COUNTRY: Record<string, string> = {
  "American": "United States",
  "Brazilian": "Brazil",
  "British": "United Kingdom",
  "Cameroonian": "Cameroon",
  "Canadian": "Canada",
  "Egyptian": "Egypt",
  "Emirati": "United Arab Emirates",
  "Ethiopian": "Ethiopia",
  "French": "France",
  "German": "Germany",
  "Ghanaian": "Ghana",
  "Indian": "India",
  "Italian": "Italy",
  "Japanese": "Japan",
  "Lebanese": "Lebanon",
  "Moroccan": "Morocco",
  "Nigerian": "Nigeria",
  "Portuguese": "Portugal",
  "Spanish": "Spain",
  "Swedish": "Sweden",
};

export function NationalityFlag({ nationality }: { nationality: string }) {
  const country = NAT_COUNTRY[nationality];
  return country ? <Flag country={country} /> : null;
}

export function Flag({ country, className = "flg" }: { country: string; className?: string }) {
  const code = ISO[country];
  if (!code) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      width={80}
      height={60}
      alt={country}
      loading="lazy"
    />
  );
}

// The hero's product preview: a profile, an event, a new connection and
// the cities, laid out as the prototype composes them.
export function HeroPreview() {
  return (
    <div
      className="preview"
      role="img"
      aria-label="Preview of a member profile, a Dubai event and a new connection"
    >
      <div className="pv pv-profile">
        <div className="row" style={{ gap: 12 }}>
          <span className="pv-portrait noimg">
            <i>TR</i>
          </span>
          <div>
            <b style={{ display: "block" }}>Tom&aacute;s Ribeiro</b>
            <span className="muted small">Brand designer, Norte Studio</span>
          </div>
        </div>
        <div className="path" style={{ marginTop: 12, padding: 6, gap: 4 }}>
          <span className="pnode" style={{ padding: "5px 8px", fontSize: 12 }}>
            <Ic name="globe" />
            Global
          </span>
          <Ic name="chev" />
          <span className="pnode" style={{ padding: "5px 8px", fontSize: 12 }}>
            <Ic name="pin" />
            Dubai
          </span>
          <Ic name="chev" />
          <span className="pnode on" style={{ padding: "5px 8px", fontSize: 12 }}>
            <Ic name="rings" />
            Circle 02
          </span>
        </div>
        <div className="tags" style={{ marginTop: 10 }}>
          <span className="chip">Creative &amp; Design</span>
          <span className="chip chip-mint">Open to collaborate</span>
        </div>
        <div className="pv-flags" aria-hidden="true">
          <Flag country="Brazil" />
          <Flag country="Portugal" />
          <Flag country="United Arab Emirates" />
          <b>Brazil, Portugal, now Dubai</b>
        </div>
      </div>

      <div className="pv pv-event">
        <div className="photo ph-dubai" role="img" aria-label="Dubai" />
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="date" style={{ width: 52, flex: "none" }}>
            <b>1</b>
            <span>Oct</span>
          </div>
          <div>
            <b style={{ display: "block" }}>Founders dinner</b>
            <span className="muted small">Dubai Village, 7:30 PM</span>
          </div>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
          <div className="avstack">
            <Av name="Leila Haddad" className="av-sm" />
            <Av name="Julien Moreau" className="av-sm" />
            <Av name="Priya Menon" className="av-sm" />
          </div>
          <span className="chip chip-blue">Dubai Marina</span>
        </div>
      </div>

      <div className="pv pv-msg">
        <div className="row">
          <Av name="Nadia Mbarga" className="av-sm" />
          <div style={{ minWidth: 0 }}>
            <b style={{ display: "block", fontSize: 13 }}>Nadia accepted your request</b>
            <span className="muted small">Dubai Village, Hospitality</span>
          </div>
        </div>
      </div>

      <div className="pv pv-cities">
        <span className="city">
          <i />
          Dubai
        </span>
        <span className="city soon">
          <i />
          Lisbon
        </span>
        <span className="city soon">
          <i />
          Paris
        </span>
      </div>
    </div>
  );
}

// The three joined layer cards from the home page.
export function LayerCards() {
  return (
    <div className="layers layers-tint">
      <div className="layer">
        <span className="swatch" style={{ background: "var(--mint)" }} />
        <h3>Global</h3>
        <p>The whole network. Reach members, events and markets wherever there is a Village.</p>
      </div>
      <div className="layer">
        <span className="swatch" style={{ background: "var(--blue)" }} />
        <h3>Village</h3>
        <p>Your city. Local gatherings, local knowledge and the people building around you.</p>
      </div>
      <div className="layer">
        <span className="swatch" style={{ background: "var(--navy)" }} />
        <h3>Circle</h3>
        <p>Your home base of up to 50 members, where real relationships form.</p>
      </div>
    </div>
  );
}
'@
Write-File "components\bits.tsx" $f1

$f2 = @'
import Link from "next/link";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

export type FeedItem = {
  who: string;
  role?: string | null;
  when: string;
  kind: string;
  tone: "blue" | "mint" | "sun" | "navy";
  text: string;
  embedTitle?: string | null;
  embedLine?: string | null;
  href?: string;
  actions?: [string, string][];
};

// fpost: who wrote it, what kind of thing it is, the line itself, then
// the thing it points at.
export function FeedPost({ item }: { item: FeedItem }) {
  return (
    <article className="fpost">
      <div className="fp-head">
        <Av name={item.who} className="av-sm" />
        <div className="fp-who">
          <b>{item.who}</b>
          {item.role ? <span>{item.role}</span> : null}
        </div>
        <span className={`fp-kind fk-${item.tone}`}>{item.kind}</span>
      </div>
      <p className="fp-text">{item.text}</p>
      {item.embedTitle && item.href ? (
        <Link className="fp-embed" href={item.href}>
          <b>{item.embedTitle}</b>
          {item.embedLine ? <span>{item.embedLine}</span> : null}
        </Link>
      ) : null}
      <div className="fp-foot">
        <span>{item.when}</span>
        {(item.actions ?? []).map(([label, href]) => (
          <Link key={label} href={href}>
            {label}
          </Link>
        ))}
      </div>
    </article>
  );
}

// The line at the top of the feed that opens the posting form.
export function Compose({ name }: { name: string }) {
  return (
    <div className="fcompose">
      <Av name={name} className="av-sm" />
      <Link className="fcompose-box" href="/village/new">
        Ask for something, or offer what you can
      </Link>
      <Link className="btn btn-ghost btn-sm" href="/village/new">
        Post
      </Link>
    </div>
  );
}

// wa: the row that leads out to a WhatsApp group.
export function WaRow({
  title,
  sub,
  background,
  colour,
  icon,
  href,
}: {
  title: string;
  sub: string;
  background: string;
  colour: string;
  icon: string;
  href: string;
}) {
  return (
    <div className="wa">
      <span className="kind" style={{ background, color: colour }}>
        <Ic name={icon} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <b className="trunc" style={{ display: "block", fontWeight: 600 }}>
          {title}
        </b>
        <span className="muted small">{sub}</span>
      </div>
      <Link className="btn btn-mint btn-sm" href={href}>
        Open
      </Link>
    </div>
  );
}

// evt: a date block, the name of the event, and where it is.
export function EventRow({
  href,
  day,
  month,
  title,
  line,
  visiting = false,
  right,
  cover,
}: {
  href: string;
  day: string;
  month: string;
  title: string;
  line: string;
  visiting?: boolean;
  right?: React.ReactNode;
  cover?: string | null;
}) {
  return (
    <Link className={`evt linkrow ${cover ? "has-thumb" : ""}`} href={href}>
      <div className={`date ${visiting ? "visit" : ""}`}>
        <b>{day}</b>
        <span>{month}</span>
      </div>
      {/* The thumbnail the prototype puts on every event row. */}
      {cover ? (
        <span
          className="evt-thumb"
          role="img"
          aria-label={title}
          style={{ backgroundImage: `url('${cover}')` }}
        />
      ) : null}
      <div style={{ minWidth: 0 }}>
        <b style={{ fontWeight: 600 }}>{title}</b>
        <div className="muted small">{line}</div>
      </div>
      {right}
    </Link>
  );
}
'@
Write-File "components\feed.tsx" $f2

$f3 = @'
import Link from "next/link";
import { Av, Flag, NationalityFlag } from "@/components/bits";
import { Ic } from "@/components/icon";
import { ProfileTabs } from "@/components/profile";

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
      {person.nationalities?.length ? (
        <div>
          <span className="sp-label">Nationalities</span>
          <div className="tags">
            {person.nationalities.map((n) => (
              <span className="chip" key={n}>
                <NationalityFlag nationality={n} /> {n}
              </span>
            ))}
          </div>
        </div>
      ) : null}
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
'@
Write-File "components\profile-view.tsx" $f3

$f4 = @'
import { DualPage } from "@/components/dual-page";
import { villagePhoto } from "@/components/cards";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";
import { whenText } from "@/lib/events";

const statusLine: Record<string, string> = {
  open: "Open, by invitation",
  launching: "Launching soon",
  exploring: "Being explored",
  paused: "Paused for now",
  archived: "Closed",
};

export default async function VillagePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const user = await currentUser();

  const { data: village } = await supabase
    .from("villages")
    .select("id, slug, name, city, country, status, summary, cover_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!village) notFound();

  // Only what a stranger is allowed to see: members who chose to be public,
  // and events open to everyone.
  const [{ count: memberCount }, { data: events }, { data: admins }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("village_id", village.id)
      .eq("status", "active"),
    supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, timezone, venue, cover_url")
      .eq("village_id", village.id)
      .eq("visibility", "public")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(6),
    // Who runs this Village. Only the ones who chose to be listed
    // publicly are named.
    supabase
      .from("member_roles")
      .select("profile_id, profiles!inner(id, full_name, headline, public_profile)")
      .eq("role", "local_admin")
      .eq("scope_id", village.id)
      .is("ended_at", null),
  ]);

  const hosts = ((admins ?? []) as unknown as {
    profiles: { id: string; full_name: string; headline: string | null; public_profile: boolean };
  }[])
    .map((row) => row.profiles)
    .filter((p) => p && p.public_profile);

  const waitlist = `/villages/suggest?city=${encodeURIComponent(
    village.city ?? ""
  )}&country=${encodeURIComponent(village.country ?? "")}`;
  const opening = village.status !== "open";

  return (
    <DualPage member={Boolean(user)} nav="/network" active="/villages">
        {/* The photographic hero the prototype leads with. A Village with
            no photograph of its own falls back to the hatched block. */}
        <div
          className={`vphoto ${villagePhoto(village.slug)}`}
          role="img"
          aria-label={village.name}
          style={{
            height: 230,
            padding: 28,
            marginBottom: 24,
            ...(village.cover_url
              ? {
                  background: `linear-gradient(to top,rgba(20,32,44,.72) 0%,rgba(20,32,44,.1) 60%),url('${village.cover_url}') center/cover`,
                }
              : {}),
          }}
        >
          <div>
            <span className="chip" style={{ background: "rgba(255,255,255,.9)" }}>
              {statusLine[village.status] ?? village.status}
            </span>
            <h1 style={{ color: "#fff", fontSize: 32, marginTop: 10 }}>
              {village.name} Village
            </h1>
          </div>
        </div>

        <section className="sec">
          <h2 style={{ fontSize: 20 }}>
            Build in {village.city} without starting from zero.
          </h2>
          <p className="lead">{village.summary}</p>
          <p>
            {opening ? (
              <Link className="btn btn-primary" href={waitlist}>
                Join the waitlist
              </Link>
            ) : (
              <Link className="btn btn-primary" href="/apply">
                Request an invitation
              </Link>
            )}{" "}
            <Link className="btn btn-ghost" href="/villages">
              All Villages
            </Link>
          </p>
        </section>

        <section className="sec">
          <div className="g3">
            <div className="panel">
              <h3>Circles</h3>
              <p className="muted small">
                Up to fifty members each. Small enough that people actually know
                each other, and meet often enough to prove it.
              </p>
            </div>
            <div className="panel">
              <h3>Members</h3>
              <p className="muted small">
                {memberCount ?? 0} people building businesses here, from
                somewhere else.
              </p>
            </div>
            <div className="panel">
              <h3>How you get in</h3>
              <p className="muted small">
                By invitation. Every request is read by a person, and the Local
                Admin decides.
              </p>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="gside">
            <div className="panel">
              <h3>Who runs it</h3>
              {hosts.length === 0 ? (
                <p className="muted small" style={{ marginTop: 6 }}>
                  {opening
                    ? "We are looking for the people who will run this one. If that could be you, say so when you join the waitlist."
                    : "The Local Admins here keep their profiles private."}
                </p>
              ) : (
                <div className="divide" style={{ marginTop: 12 }}>
                  {hosts.map((host) => (
                    <Link className="li linkrow" key={host.id} href={`/members/${host.id}`}>
                      <div>
                        <b>{host.full_name}</b>
                        <div className="muted small">{host.headline}</div>
                      </div>
                      <div className="rowmeta">
                        <span className="chip chip-mint">Local Admin</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="panel panel-wash">
              <h3>{opening ? "What happens before it opens" : "What a month looks like"}</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                {opening
                  ? "A Village opens when there are enough members in the city, two Local Admins and a first Circle Host. Joining the waitlist counts you towards the first, and you can offer to be one of the others."
                  : "One gathering for the whole Village, and smaller Circle meetings. Members ask and offer in between, and the WhatsApp groups carry the daily talk."}
              </p>
              <Link className="btn btn-ghost" href={opening ? waitlist : "/apply"}>
                {opening ? "Join the waitlist" : "Request an invitation"}
              </Link>
            </div>
          </div>
        </section>

        {(events ?? []).length ? (
          <section className="sec">
            <h2>Open to everyone</h2>
            <div className="divide">
              {(events ?? []).map((event) => (
                <Link className="li linkrow" key={event.id} href={`/e/${event.slug}`}>
                  <div>
                    <b>{event.title}</b>
                    <div className="muted small">
                      {whenText(event)}. {event.venue ?? "Online"}.
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="sec">
          <div className="sec">
            <h2>
              {village.status === "exploring"
                ? `Want a Village in ${village.city}?`
                : `Building something in ${village.city}?`}
            </h2>
            <p style={{ color: "#fff" }}>
              {village.status === "exploring"
                ? "It opens when enough people ask and someone local will run it."
                : "Membership is free. The paid plan adds every other Village."}
            </p>
            <Link
              className="btn btn-ghost"
              href={village.status === "exploring" ? "/villages/suggest" : "/apply"}
            >
              {village.status === "exploring"
                ? "Register interest"
                : "Request an invitation"}
            </Link>
          </div>
        </section>
      </DualPage>
  );
}
'@
Write-File "app\villages\[slug]\page.tsx" $f4

$f5 = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { VillageCard, type VillageRow } from "@/components/cards";

export const metadata = {
  title: "Villages, ExpatPreneurs Global",
  description:
    "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network.",
};

const FILTERS: [string, string][] = [
  ["all", "All"],
  ["open", "Open"],
  ["soon", "Launching soon"],
];

export default async function VillagesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const supabase = await createClient();

  const [{ data: villages }, { data: counts }] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary, cover_url")
      .order("name"),
    supabase.from("village_public_counts").select("village_id, members, circles"),
  ]);

  const countFor = (id: string) =>
    (counts ?? []).find((c) => c.village_id === id) ?? { members: 0, circles: 0 };

  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const rows = [...(villages ?? [])]
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
    .map((v) => ({ ...v, ...countFor(v.id) }))
    .filter((v) =>
      show === "open"
        ? v.status === "open"
        : show === "soon"
          ? ["launching", "exploring"].includes(v.status)
          : true
    );

  return (
    <PublicPage active="/villages">
      <section className="pubsec">
        <h2>Find your Village</h2>
        <p className="intro">
          Each Village is a local community of expat entrepreneurs in one city,
          connected to every other Village in the network.
        </p>

        <div className="filters">
          {FILTERS.map(([key, label]) => (
            <Link
              key={key}
              className={`fchip ${show === key ? "on" : ""}`}
              href={`/villages?show=${key}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="g3">
          {rows.map((village) => (
            <VillageCard key={village.id} village={village as VillageRow} />
          ))}
        </div>

        <div
          className="panel panel-wash"
          style={{
            marginTop: 22,
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3 style={{ fontSize: 15 }}>No Village in your city yet?</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Tell us where you are. New Villages open when there are enough
              members and trusted people ready to host them.
            </p>
          </div>
          <Link className="btn btn-dark" href="/villages/suggest">
            Suggest your city
          </Link>
        </div>
      </section>
    </PublicPage>
  );
}
'@
Write-File "app\villages\page.tsx" $f5

$f6 = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { DCard, DPerson, DSec, DBand } from "@/components/discover-cards";
import { Ic } from "@/components/icon";
import { whenText } from "@/lib/events";

export const metadata = {
  title: "Discover, ExpatPreneurs Global",
  description:
    "The Villages, Circles, people and events of a network of people building a business away from home.",
};

const TABS: [string, string][] = [
  ["featured", "Featured"],
  ["villages", "Villages"],
  ["circles", "Circles"],
  ["people", "People"],
  ["groups", "Groups and Pods"],
  ["events", "Events"],
  ["learning", "Learning and business"],
  ["media", "Watch and listen"],
];

const statusLine: Record<string, string> = {
  open: "Open for invitation requests",
  launching: "Launching soon",
  exploring: "Being explored",
  paused: "Paused",
  archived: "Archived",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; q?: string }>;
}) {
  const { show = "featured", q = "" } = await searchParams;
  const supabase = await createClient();

  // Every query here runs for somebody who is not signed in, so the database
  // decides what comes back: public profiles, public events, published
  // courses, and media that is not marked members only.
  const [
    { data: villages },
    { data: circles },
    { data: people },
    { data: groups },
    { data: events },
    { data: courses },
    { data: businesses },
    { data: media },
  ] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary, cover_url")
      .order("name"),
    supabase
      .from("circles")
      .select("id, name, capacity, village_id, status")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, headline, business_name, industry, village_id")
      .eq("public_profile", true)
      .eq("status", "active")
      .order("full_name")
      .limit(24),
    supabase
      .from("industry_groups")
      .select("id, slug, name, description")
      .order("name"),
    supabase
      .from("events")
      .select(
        "id, slug, title, description, starts_at, ends_at, timezone, venue, is_online, village_id"
      )
      .eq("visibility", "public")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(12),
    supabase
      .from("courses")
      .select("id, slug, title, summary, level, duration")
      .eq("status", "published")
      .order("title")
      .limit(12),
    supabase
      .from("businesses")
      .select("id, slug, name, category, summary, image_url")
      .eq("public", true)
      .limit(8),
    supabase
      .from("media_items")
      .select("id, slug, kind, title, summary, duration, published_at")
      .eq("member_only", false)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(12),
  ]);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const match = (...fields: (string | null | undefined)[]) =>
    !q || fields.some((f) => (f ?? "").toLowerCase().includes(q.toLowerCase()));

  const shown = (key: string) => show === "featured" || show === key;
  const tabHref = (key: string) =>
    `/discover?show=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  const vills = (villages ?? []).filter((v) =>
    match(v.name, v.city, v.country, v.summary)
  );
  const circs = (circles ?? []).filter((c) => match(c.name));
  const pers = (people ?? []).filter((p) =>
    match(p.full_name, p.headline, p.business_name, p.industry)
  );
  const grps = (groups ?? []).filter((g) => match(g.name, g.description));
  const evs = (events ?? []).filter((e) => match(e.title, e.description, e.venue));
  const crs = (courses ?? []).filter((c) => match(c.title, c.summary));
  const bizs = (businesses ?? []).filter((b) => match(b.name, b.category, b.summary));
  const meds = (media ?? []).filter((m) => match(m.title, m.summary));

  const found =
    vills.length + circs.length + pers.length + grps.length +
    evs.length + crs.length + bizs.length + meds.length;

  return (
    <PublicPage active="/discover">
      <section className="pubsec dhero">
        <h1>Wherever you have landed, there is a Village for you</h1>
        <p className="intro">
          Find the Villages, Circles and people building a business away from
          home.
        </p>

        <form className="input dsearch" action="/discover">
          <Ic name="search" />
          <input type="hidden" name="show" value={show} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search Villages, Circles, members, events and businesses"
            aria-label="Search the network"
            autoComplete="off"
          />
          <button className="btn btn-primary btn-sm" type="submit">
            Search
          </button>
        </form>

        {q ? (
          <p className="dcount">
            {found
              ? `${found} ${found === 1 ? "result" : "results"} for "${q}"`
              : `Nothing matches "${q}" yet. Try a city, an industry or a name.`}
          </p>
        ) : null}

        <div className="dpills">
          {TABS.map(([key, label]) => (
            <Link
              className={`dpill ${show === key ? "on" : ""}`}
              href={tabHref(key)}
              key={key}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        {shown("villages") && vills.length ? (
          <DSec title="Villages" href="/villages">
            {vills.map((v, i) => (
              <DCard
                key={v.id}
                i={i}
                href={`/villages/${v.slug}`}
                kicker={v.country}
                title={v.name}
                sub={v.summary}
                meta={statusLine[v.status] ?? v.status}
              />
            ))}
          </DSec>
        ) : null}

        {shown("people") && pers.length ? (
          <DSec title="Members you will meet" href="/members" people>
            {pers.slice(0, 10).map((p, i) => (
              <DPerson
                key={p.id}
                i={i}
                href={`/members/${p.id}`}
                name={p.full_name}
                line={[p.industry, villageName(p.village_id)]
                  .filter(Boolean)
                  .join(", ")}
              />
            ))}
          </DSec>
        ) : null}

        {shown("circles") && circs.length ? (
          <DSec title="Circles">
            {circs.map((c, i) => (
              <DCard
                key={c.id}
                i={i + 1}
                href="/how-it-works"
                kicker={`${villageName(c.village_id)} Village`}
                title={c.name}
                sub={
                  c.status === "open"
                    ? "Welcoming new members this month"
                    : "Opens when a Circle reaches 45 members"
                }
                meta={`Up to ${c.capacity} members`}
              />
            ))}
          </DSec>
        ) : null}

        {show === "featured" ? (
          <DBand
            title="ExpatPreneurs grows through introductions."
            line="Know someone who belongs here?"
            cta="Request your invitation"
            href="/apply"
          />
        ) : null}

        {shown("groups") && grps.length ? (
          <DSec title="Industry Groups and Pods">
            {grps.map((g, i) => (
              <DCard
                key={g.id}
                i={i + 2}
                href="/groups"
                kicker="Industry Group"
                title={g.name}
                sub={g.description}
              />
            ))}
          </DSec>
        ) : null}

        {shown("events") && evs.length ? (
          <DSec title="Events" href="/events">
            {evs.map((e, i) => (
              <DCard
                key={e.id}
                i={i}
                href={`/events/${e.slug}`}
                kicker={whenText(e)}
                title={e.title}
                sub={e.description}
                meta={e.is_online ? "Online" : e.venue}
              />
            ))}
          </DSec>
        ) : null}

        {shown("learning") && crs.length ? (
          <DSec title="Learning" href="/learning">
            {crs.map((c, i) => (
              <DCard
                key={c.id}
                i={i + 1}
                href={`/learning/${c.slug}`}
                kicker={c.duration ?? c.level}
                title={c.title}
                sub={c.summary}
              />
            ))}
          </DSec>
        ) : null}

        {shown("learning") && bizs.length ? (
          <DSec title="Businesses in the network" href="/businesses">
            {bizs.map((b, i) => (
              <DCard
                key={b.id}
                i={i + 3}
                href={`/businesses/${b.slug}`}
                kicker={b.category}
                title={b.name}
                sub={b.summary}
                image={b.image_url}
              />
            ))}
          </DSec>
        ) : null}

        {shown("media") && meds.length ? (
          <DSec title="Watch and listen" href="/watch">
            {meds.map((m, i) => (
              <DCard
                key={m.id}
                i={i + 2}
                href={`/watch/${m.slug}`}
                kicker={[m.kind, m.duration].filter(Boolean).join(", ")}
                title={m.title}
                sub={m.summary}
              />
            ))}
          </DSec>
        ) : null}
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <DBand
          end
          title="Find the Village nearest you."
          line="If there is not one yet, tell us where you are."
          cta="Request your invitation"
          href="/apply"
        />
      </section>
    </PublicPage>
  );
}
'@
Write-File "app\discover\page.tsx" $f6

$f7 = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { DualPage } from "@/components/dual-page";
import { PageHead } from "@/components/workspace-shell";
import { EventRow } from "@/components/feed";
import {
  whenText,
  priceText,
  registrationBlock,
  type EventRow as EventData,
} from "@/lib/events";

export const metadata = { title: "Events, ExpatPreneurs Global" };

// Open to everyone. A visitor sees the events that are open to the
// public; a member sees theirs, other Villages' and everything online.
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const member = await whoIsHere();
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);

  if (!member) query = query.eq("visibility", "public");

  const [{ data: events }, { data: registrations }, { data: villages }] =
    await Promise.all([
      query,
      member
        ? supabase
            .from("event_registrations")
            .select("event_id, status")
            .eq("profile_id", member.id)
        : Promise.resolve({ data: [] }),
      supabase.from("villages").select("id, name"),
    ]);

  const registeredFor = new Set(
    (registrations ?? [])
      .filter((r) => r.status !== "cancelled")
      .map((r) => r.event_id)
  );

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  const rows = ((events ?? []) as EventData[]).filter((event) => {
    if (!member) return true;
    if (show === "mine") return registeredFor.has(event.id);
    if (show === "village") return event.village_id === member.village_id;
    if (show === "other")
      return event.village_id && event.village_id !== member.village_id;
    if (show === "online") return event.is_online;
    return true;
  });

  const FILTERS: [string, string][] = [
    ["all", "All"],
    ["village", "My Village"],
    ["other", "Other Villages"],
    ["online", "Online"],
    ["mine", "I am going"],
  ];

  return (
    <DualPage member={Boolean(member)} nav="/events" active="/events">
      {member ? (
        <PageHead
          title="Events"
          sub="Gatherings in your Village, in other Villages and online."
        />
      ) : (
        <section className="pubsec hero-center">
          <h1>Events</h1>
          <p className="intro">
            Gatherings in every Village and online. Some are open to everyone;
            most are for members.
          </p>
        </section>
      )}

      <section className={member ? "sec" : "pubsec"} style={{ paddingTop: 0 }}>
        {member ? (
          <div className="filters">
            {FILTERS.map(([key, label]) => (
              <Link
                key={key}
                className={`fchip ${show === key ? "on" : ""}`}
                href={`/events?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing on the calendar yet.
            </p>
          </div>
        ) : (
          <div className="divide">
            {rows.map((event) => {
              const blocked = member ? registrationBlock(event, member) : null;
              const d = new Date(event.starts_at);
              const visiting = Boolean(
                member && event.village_id && event.village_id !== member.village_id
              );
              return (
                <EventRow
                  key={event.id}
                  cover={event.cover_url}
                  href={member ? `/events/${event.slug}` : `/e/${event.slug}`}
                  day={String(d.getDate())}
                  month={d.toLocaleDateString("en-GB", { month: "short" })}
                  title={event.title}
                  line={`${
                    event.village_id ? `${villageName(event.village_id)}. ` : ""
                  }${whenText(event)}${
                    event.is_online ? ", online" : event.venue ? `, ${event.venue}` : ""
                  }`}
                  visiting={visiting}
                  right={
                    registeredFor.has(event.id) ? (
                      <span className="chip chip-mint">You are going</span>
                    ) : blocked ? (
                      <span className="chip chip-sun">{blocked}</span>
                    ) : (
                      <span className="chip">{priceText(event)}</span>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {member ? null : (
        <section className="pubsec" style={{ paddingTop: 0 }}>
          <div className="band">
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 style={{ fontSize: 22 }}>Most events are for members</h2>
              <p style={{ marginTop: 6 }}>
                Every Village holds at least one gathering a month, and members
                can visit the others.
              </p>
            </div>
            <Link className="btn btn-mint" href="/apply">
              Request your invitation
            </Link>
          </div>
        </section>
      )}
    </DualPage>
  );
}
'@
Write-File "app\events\page.tsx" $f7

$f8 = @'
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";
import { WorkspaceShell, PageHead } from "@/components/workspace-shell";
import { FeedPost, Compose, WaRow, EventRow, type FeedItem } from "@/components/feed";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

export const metadata = { title: "Home, ExpatPreneurs Global" };

// How long ago something happened, in the plain words the prototype uses.
function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default async function MemberHomePage() {
  const supabase = await createClient();
  const user = await currentUser();

  if (!user) redirect("/login?next=/home");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, headline, status, plan, village_id, circle_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <WorkspaceShell kind="member">
        <PageHead title="Your profile did not load" />
        <div className="flag hold">
          <Ic name="info" />
          <span>{error.message}</span>
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
          Signed in as {user.email}. If this persists, send the message above
          to the build team.
        </p>
      </WorkspaceShell>
    );
  }

  if (!profile) {
    return (
      <WorkspaceShell kind="member">
        <PageHead
          title="Almost there"
          sub={`You are signed in as ${user.email}, but there is no member profile on this account yet. Your Local Admin sets that up when an invitation is approved.`}
        />
      </WorkspaceShell>
    );
  }

  // A newly approved member finishes their profile before anything else.
  if (profile.status === "onboarding") redirect("/welcome");

  const [villageRes, circleRes] = await Promise.all([
    profile.village_id
      ? supabase.from("villages").select("name").eq("id", profile.village_id).maybeSingle()
      : Promise.resolve({ data: null }),
    profile.circle_id
      ? supabase.from("circles").select("name").eq("id", profile.circle_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const villageName = villageRes.data?.name ?? null;
  const circleName = circleRes.data?.name ?? null;

  // What has happened lately, and what is coming.
  const [{ data: asks }, { data: announcements }, { data: events }] =
    await Promise.all([
      supabase
        .from("asks")
        .select("id, kind, title, body, status, created_at, author_id, village_id")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("announcements")
        .select("id, title, body, sent_at, author_id")
        .not("sent_at", "is", null)
        .order("sent_at", { ascending: false })
        .limit(3),
      supabase
        .from("events")
        .select("id, slug, title, starts_at, venue, is_online, village_id, cover_url")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(4),
    ]);

  // The names behind the posts, in one query.
  const authorIds = [
    ...new Set(
      [...(asks ?? []).map((a) => a.author_id), ...(announcements ?? []).map((a) => a.author_id)]
        .filter(Boolean)
    ),
  ] as string[];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, full_name, headline").in("id", authorIds)
    : { data: [] };
  const who = (id: string | null) =>
    authors?.find((a) => a.id === id) ?? { full_name: "A member", headline: null };

  const items: FeedItem[] = [];

  for (const a of announcements ?? []) {
    const person = who(a.author_id);
    items.push({
      who: person.full_name,
      role: person.headline,
      when: ago(a.sent_at as string),
      kind: "Village announcement",
      tone: "blue",
      text: a.body.length > 220 ? `${a.body.slice(0, 220)}\u2026` : a.body,
      embedTitle: a.title,
      embedLine: villageName ? `${villageName} Village` : null,
      href: "/my-village/announcements",
      actions: [["Read the announcement", "/my-village/announcements"]],
    });
  }

  for (const a of asks ?? []) {
    const person = who(a.author_id);
    items.push({
      who: person.full_name,
      role: person.headline,
      when: ago(a.created_at),
      kind: a.kind === "offer" ? "Offer" : "Ask",
      tone: a.kind === "offer" ? "mint" : "sun",
      text: a.body.length > 220 ? `${a.body.slice(0, 220)}\u2026` : a.body,
      embedTitle: a.title,
      embedLine: a.village_id === profile.village_id ? "Your Village" : "All Villages",
      href: `/village/${a.id}`,
      actions: [["Reply", `/village/${a.id}`], ["See all Asks", "/my-village"]],
    });
  }

  for (const e of events ?? []) {
    const when = new Date(e.starts_at);
    items.push({
      who: villageName ? `${villageName} Village` : "ExpatPreneurs",
      role: "Events",
      when: "Coming up",
      kind: "Event",
      tone: "navy",
      text: `${e.title} is on ${when.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}${e.is_online ? ", online" : e.venue ? `, at ${e.venue}` : ""}.`,
      embedTitle: e.title,
      embedLine: when.toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
      href: `/events/${e.slug}`,
      actions: [["Register", `/events/${e.slug}`]],
    });
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile.full_name.split(" ")[0];

  return (
    <WorkspaceShell kind="member">
      <PageHead
        title={`${greeting}, ${firstName}`}
        sub={
          villageName
            ? `What is happening in ${villageName} this week.`
            : "What is happening across the network this week."
        }
        actions={
          <Link className="btn btn-primary" href="/village/new">
            <Ic name="plus" />
            Post an Ask or Offer
          </Link>
        }
      />

      <div className="feedlayout">
        <div className="feedcol">
          <Compose name={profile.full_name} />
          {items.length ? (
            items.map((item, i) => <FeedPost key={i} item={item} />)
          ) : (
            <div className="panel panel-wash">
              <h3 style={{ fontSize: 14 }}>Nothing here yet</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                When members post an Ask or an Offer, and when your Village
                announces something, it appears here.
              </p>
            </div>
          )}
        </div>

        <aside className="feedside">
          <div className="panel">
            <div className="row" style={{ gap: 12 }}>
              <Av name={profile.full_name} className="av-lg" />
              <div className="grow">
                <b>{profile.full_name}</b>
                <p className="muted small">{profile.headline}</p>
                <div className="tags" style={{ marginTop: 6 }}>
                  <span className={`tiertag ${profile.plan === "paid" ? "" : "free"}`}>
                    {profile.plan === "paid" ? "Paid member" : "Member"}
                  </span>
                </div>
              </div>
            </div>
            <div className="path" style={{ marginTop: 12 }}>
              <Link className="pnode" href="/network">
                <Ic name="globe" />
                Global network
              </Link>
              <Ic name="chev" />
              <Link className="pnode" href="/my-village">
                <Ic name="pin" />
                {villageName ?? "Your Village"}
              </Link>
              {circleName ? (
                <>
                  <Ic name="chev" />
                  <Link className="pnode on" href="/my-circle">
                    <Ic name="rings" />
                    {circleName}
                  </Link>
                </>
              ) : null}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <Link className="btn btn-ghost btn-sm" href="/me">
                My profile
              </Link>
              <Link className="btn btn-ghost btn-sm" href="/me/edit">
                Edit
              </Link>
            </div>
          </div>

          {events && events.length ? (
            <div className="panel">
              <div className="sechead">
                <h3>Coming up</h3>
                <Link href="/events">All events</Link>
              </div>
              <div className="divide">
                {events.map((e) => {
                  const d = new Date(e.starts_at);
                  return (
                    <EventRow
                      key={e.id}
                      cover={e.cover_url}
                      href={`/events/${e.slug}`}
                      day={String(d.getDate())}
                      month={d.toLocaleDateString("en-GB", { month: "short" })}
                      title={e.title}
                      line={`${d.toLocaleDateString("en-GB", {
                        weekday: "long",
                      })}, ${d.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}${e.is_online ? ", online" : e.venue ? `, ${e.venue}` : ""}`}
                      visiting={e.village_id !== profile.village_id}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {circleName ? (
            <div className="panel">
              <div className="sechead">
                <h3>Your WhatsApp groups</h3>
              </div>
              <div className="stack">
                <WaRow
                  title={circleName}
                  sub="Your home base"
                  background="#E7EEF7"
                  colour="#4074AE"
                  icon="rings"
                  href="/my-circle"
                />
                <WaRow
                  title={`${villageName ?? "Village"} announcements`}
                  sub="Village news, read only"
                  background="#E6F4F1"
                  colour="#24675A"
                  icon="bell"
                  href="/my-village/announcements"
                />
              </div>
            </div>
          ) : null}

          {profile.plan === "paid" ? null : (
            <Link className="panel panel-wash linkrow" href="/upgrade">
              <h3 style={{ fontSize: 14 }}>The paid plan</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                Contact members in any Village, attend their events, and
                promote what you do.
              </p>
            </Link>
          )}
        </aside>
      </div>
    </WorkspaceShell>
  );
}
'@
Write-File "app\home\page.tsx" $f8

$f9 = @'
import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { Stat, Task, Cap, Flag, SecHead } from "@/components/admin-bits";
import { EventRow } from "@/components/feed";
import { Ic } from "@/components/icon";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { whenText } from "@/lib/events";

export const metadata = { title: "Overview, the Local Admin workspace" };

// The Local Admin home, built around stewardship. Every figure opens the
// page where it is handled.
export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const villageIds = admin.villageIds.length
    ? admin.villageIds
    : ["00000000-0000-0000-0000-000000000000"];

  const [
    { data: village },
    { count: activeMembers },
    { count: openRequests },
    { data: reports },
    { data: whatsapp },
    { data: events },
    { data: circles },
    { data: mix },
    { data: settings },
    { data: renewals },
  ] = await Promise.all([
    supabase
      .from("villages")
      .select("id, name, city")
      .eq("id", villageIds[0])
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "active"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .in("status", ["new", "with_local"]),
    supabase
      .from("reports")
      .select("id, kind, created_at, status")
      .not("status", "in", "(closed,escalated)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("whatsapp_tasks")
      .select("id, kind, group_name, profile_id")
      .in("village_id", villageIds)
      .is("done_at", null)
      .limit(10),
    supabase
      .from("events")
      .select("id, slug, title, starts_at, ends_at, timezone, venue, is_online, cover_url")
      .in("village_id", villageIds)
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(3),
    supabase
      .from("circle_capacity")
      .select("circle_id, name, members, capacity, places_left")
      .in("village_id", villageIds)
      .order("name"),
    supabase
      .from("village_nationality_mix")
      .select("nationality, percent, village_id")
      .in("village_id", villageIds)
      .order("percent", { ascending: false })
      .limit(1),
    supabase.from("settings").select("key, value"),
    supabase
      .from("re_enrolments")
      .select("id, status")
      .in("village_id", villageIds),
  ]);

  const values = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const limit = Number(values.nationality_limit ?? 30);

  const quietDays = Number(values.quiet_days ?? 45);
  const { data: quiet } = await supabase
    .from("member_activity")
    .select("profile_id, posts, replies, attended")
    .in("village_id", villageIds);

  const quietCount = (quiet ?? []).filter(
    (m) => (m.posts ?? 0) + (m.replies ?? 0) + (m.attended ?? 0) === 0
  ).length;

  const answered = (renewals ?? []).filter((r) => r.status !== "pending").length;
  const largest = (mix ?? [])[0];

  const stats: [string, number | string, string, string][] = [
    ["Active members", activeMembers ?? 0, "In this Village", "/admin/members"],
    ["Invitation requests", openRequests ?? 0, "Waiting on you", "/admin/applications"],
    ["Open reports", (reports ?? []).length, "Handled privately", "/admin/reports"],
    ["Quiet members", quietCount, `No activity in ${quietDays} days`, "/admin/care"],
  ];

  return (
    <>
      <PageHead
        title={`${village?.name ?? "Your"} Village`}
        sub="How the Village is doing this month"
        actions={
          <Link className="btn btn-primary" href="/admin/announcements">
            <Ic name="bell" />
            Post an announcement
          </Link>
        }
      />

      <div className="g3 g4">
        {stats.map(([label, value, note, href]) => (
          <Stat key={label} label={label} value={value} note={note} href={href} />
        ))}
      </div>

      <div className="gside" style={{ marginTop: 22 }}>
        <div className="panel">
          <SecHead title="To do" />
          <div className="divide">
            {(whatsapp ?? []).map((task) => (
              <Task
                key={task.id}
                href="/admin/whatsapp"
                tag="WhatsApp"
                title={
                  task.kind === "add"
                    ? "Add somebody to a WhatsApp group"
                    : task.kind === "remove"
                      ? "Take somebody out of a WhatsApp group"
                      : "Move somebody between groups"
                }
                sub={task.group_name}
              />
            ))}

            {(openRequests ?? 0) > 0 ? (
              <Task
                href="/admin/applications"
                tag="Curation"
                title={`Read ${openRequests} invitation ${
                  openRequests === 1 ? "request" : "requests"
                }`}
                sub="The balance panel shows what each would do to the mix."
              />
            ) : null}

            {quietCount > 0 ? (
              <Task
                href="/admin/care"
                tag="Member care"
                title={`Check in with ${quietCount} quiet members`}
                sub="A friendly message, not a warning."
              />
            ) : null}

            {(renewals ?? []).length > 0 ? (
              <Task
                href="/admin/care"
                tag="Re-enrolment"
                title="Follow up on re-enrolment"
                sub={`${answered} of ${(renewals ?? []).length} have answered.`}
              />
            ) : null}

            {(reports ?? []).map((report) => (
              <Task
                key={report.id}
                href="/admin/reports"
                tag="Reports"
                title={`Look at a report: ${report.kind}`}
                sub="Private."
              />
            ))}

            {(whatsapp ?? []).length === 0 &&
            (openRequests ?? 0) === 0 &&
            quietCount === 0 &&
            (reports ?? []).length === 0 ? (
              <Task
                title="Nothing waiting on you"
                sub="Which is worth something in itself."
              />
            ) : null}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <SecHead title="Circle capacity" href="/admin/circles" />
            {(circles ?? []).length === 0 ? (
              <p className="muted small">No Circles yet.</p>
            ) : (
              (circles ?? []).map((circle) => (
                <Cap
                  key={circle.circle_id}
                  name={circle.name}
                  value={circle.members ?? 0}
                  max={circle.capacity ?? 50}
                />
              ))
            )}
          </div>

          <div className="panel">
            <SecHead title="Village mix" href="/admin/mix" label="Details" />
            {largest ? (
              Number(largest.percent) >= limit - 3 ? (
                <Flag>
                  {largest.nationality} members are {largest.percent} percent of
                  this Village, close to the {limit} percent limit.
                </Flag>
              ) : (
                <Flag ok>
                  The largest group is {largest.nationality} at{" "}
                  {largest.percent} percent, under the {limit} percent limit.
                </Flag>
              )
            ) : (
              <p className="muted small">
                Not enough given yet to say anything.
              </p>
            )}
          </div>

          <div className="panel">
            <SecHead title="Next event" href="/admin/events" label="All events" />
            {(events ?? []).length === 0 ? (
              <p className="muted small">Nothing on the calendar.</p>
            ) : (
              <div className="divide">
                {(events ?? []).map((event) => {
                  const d = new Date(event.starts_at);
                  return (
                    <EventRow
                      key={event.id}
                      cover={event.cover_url}
                      href={`/admin/events/${event.id}`}
                      day={String(d.getDate())}
                      month={d.toLocaleDateString("en-GB", { month: "short" })}
                      title={event.title}
                      line={whenText(event)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
'@
Write-File "app\admin\page.tsx" $f9

git add app components supabase
git commit -m "Port the prototype photographs, the flags, and fix the column the cards were reading"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Run 0046_photographs_from_prototype.sql in Supabase."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
