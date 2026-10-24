# 95-what-the-live-site-is-doing.ps1
# Three faults found on the deployed site, not in the code I remember.
# One migration: 0037_village_public_counts.sql.
#
# Every Village card said "0 members in 0 Circles", on the home page and
# on Villages. Not a display bug: a visitor cannot read the profiles
# table, which is correct, so counting members as a visitor returns
# nothing. 0037 adds a view that does the counting on the server and
# exposes the two numbers and nothing else. No names, no rows.
#
# The footer listed Dubai, Lisbon and Paris because I typed them in.
# Madrid is in your database and was not in the footer. It now reads the
# Villages from the database, so a new one appears the day it is created.
#
# The error page was holding the footer, and the footer now talks to the
# database, which an error page cannot do. It keeps the header and drops
# the footer.
#
# Three more things I found that this script does not fix, because they
# are yours to decide rather than mine to change:
#
#   /membership sends a visitor to the sign in page. The code in the
#   repository does not do that, so the site is running an older build
#   than the repository. Worth checking which commit Vercel has.
#
#   Discover is showing a test profile publicly, named cdcxzc with the
#   headline sdfdsf. Delete that row or set it to private.
#
#   Every Circle reads "Opens when a Circle reaches 45 members",
#   including Circle 01 in an open Village. Their status in the database
#   is not set to open.
#
# Run the migration in Supabase first:
#   supabase/migrations/0037_village_public_counts.sql
#
#   powershell -ExecutionPolicy Bypass -File .\95-what-the-live-site-is-doing.ps1

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
-- How many members and Circles a Village has, for the public site.
--
-- A visitor cannot read the profiles table, so counting from it as a
-- visitor returns zero, which is why every Village card said "0 members
-- in 0 Circles". This view does the counting on the server side and
-- exposes nothing but the two numbers: no names, no rows, nothing that
-- identifies anybody.

create or replace view village_public_counts as
  select
    v.id as village_id,
    v.slug,
    (select count(*) from profiles p
      where p.village_id = v.id and p.status = 'active') as members,
    (select count(*) from circles c
      where c.village_id = v.id) as circles
  from villages v;

grant select on village_public_counts to anon, authenticated;
'@
Write-File "supabase\migrations\0037_village_public_counts.sql" $f0

$f1 = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Ic } from "@/components/icon";
import { LogoPlain } from "@/components/brand";
import { SubscribeForm } from "@/app/media/subscribe-form";

// pubFoot, as the prototype writes it: brand and newsletter across the
// top, five columns of links, then the small print.
function Col({ title, items }: { title: string; items: React.ReactNode[] }) {
  return (
    <div>
      <h4>{title}</h4>
      <nav>{items}</nav>
    </div>
  );
}

const SOCIAL: [string, string, string][] = [
  ["youtube", "YouTube", "https://www.youtube.com/"],
  ["instagram", "Instagram", "https://www.instagram.com/"],
  ["linkedin", "LinkedIn", "https://www.linkedin.com/"],
  ["mic", "Podcast", "https://open.spotify.com/"],
];

export async function SiteFooter() {
  // The Villages come from the database, so a new one appears here the
  // day it is created rather than the day somebody remembers to edit
  // this file.
  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("slug, name, status")
    .in("status", ["open", "launching", "exploring"])
    .order("name");

  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const listed = [...(villages ?? [])].sort(
    (a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
  );

  return (
    <footer className="pubfoot">
      <div className="ft-top">
        <div className="ft-brand">
          <LogoPlain alt smallStyle={{ color: "#A8DCD1" }} />
          <p>
            A curated network of expat entrepreneurs. Local enough to belong,
            global enough to grow, and human enough to matter.
          </p>
          <div className="social">
            {SOCIAL.map(([icon, name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener"
                aria-label={`ExpatPreneurs on ${name}`}
              >
                <Ic name={icon} />
              </a>
            ))}
          </div>
        </div>

        <div className="ft-news">
          <b>The monthly newsletter</b>
          <p>New stories, videos, podcast episodes and events from every Village.</p>
          <SubscribeForm source="footer" />
        </div>
      </div>

      <div className="ft-cols">
        <Col
          title="Explore"
          items={[
            <Link key="h" href="/how-it-works">How it works</Link>,
            <Link key="m" href="/membership">Membership</Link>,
            <Link key="d" href="/members">Members</Link>,
            <Link key="e" href="/events">Events</Link>,
            <Link key="a" href="/apply">Request your invitation</Link>,
            <Link key="s" href="/apply/status">Your invitation request</Link>,
          ]}
        />
        <Col
          title="Villages"
          items={[
            ...listed.map((village) => (
              <Link key={village.slug} href={`/villages/${village.slug}`}>
                <span className={`vdot${village.status === "open" ? "" : " soon"}`} />
                {village.name}
                {village.status === "open" ? null : (
                  <small>
                    {village.status === "launching" ? "Launching soon" : "Being explored"}
                  </small>
                )}
              </Link>
            )),
            <Link key="a" href="/villages">All Villages</Link>,
            <Link key="s" href="/villages/suggest">Suggest a city</Link>,
          ]}
        />
        <Col
          title="Marketplace"
          items={[
            <Link key="b" href="/businesses">Businesses</Link>,
            <Link key="l" href="/learning">Learning</Link>,
            <Link key="t" href="/membership">Teach in the network</Link>,
          ]}
        />
        <Col
          title="Stories"
          items={[
            <Link key="m" href="/media">Media</Link>,
            <Link key="v" href="/watch">Videos</Link>,
            <Link key="p" href="/watch?kind=podcast">Podcasts</Link>,
            <Link key="f" href="/media">Founder story</Link>,
          ]}
        />
        <Col
          title="Company"
          items={[
            <Link key="c" href="/contact">Contact</Link>,
            <Link key="p" href="/contact">Partnerships</Link>,
            <Link key="r" href="/contact">Press</Link>,
            <Link key="l" href="/login">Log in</Link>,
          ]}
        />
      </div>

      <div className="ft-bottom">
        <span>© {new Date().getFullYear()} ExpatPreneurs Global. All rights reserved.</span>
        <nav>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/cookies">Cookies</Link>
        </nav>
      </div>
    </footer>
  );
}
'@
Write-File "components\site-footer.tsx" $f1

$f2 = @'
import Link from "next/link";
import { livePage } from "@/lib/pages";
import { Blocks } from "@/components/blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { HeroPreview, LayerCards } from "@/components/bits";
import { VillageCard, BusinessCard, type BusinessRow } from "@/components/cards";
import { Ic } from "@/components/icon";

// The home page, block for block as the prototype lays it out.
export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: villages }, { data: counts }, { data: businesses }] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary")
      .in("status", ["open", "launching", "exploring"])
      .limit(8),
    supabase.from("village_public_counts").select("village_id, members, circles"),
    supabase
      .from("businesses")
      .select("id, slug, name, category, summary, offer, image_url")
      .eq("public", true)
      .limit(3),
  ]);

  // Open Villages first, then the ones launching, then the ones being explored.
  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const countFor = (id: string) =>
    (counts ?? []).find((c) => c.village_id === id) ?? { members: 0, circles: 0 };

  const ordered = [...(villages ?? [])]
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
    .map((v) => ({ ...v, ...countFor(v.id) }));

  // A published page replaces what is written below. A draft leaves it be.
  const page = await livePage("home");

  if (page) {
    return (
      <PublicPage>
        <Blocks blocks={page.blocks} villages={villages ?? []} />
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <section className="hero">
        <div>
          <h1>Your business needs a village too.</h1>
          <p className="lead">
            A curated network of expat entrepreneurs. Belong to a small, trusted
            community in your city, and reach people you can trust in other
            markets.
          </p>
          <div className="ctas">
            <Link className="btn btn-primary" href="/apply">
              Request your invitation
            </Link>
            <Link className="btn btn-ghost" href="/villages">
              Find your Village
            </Link>
          </div>
          <p className="proverb">
            &ldquo;It takes a village to raise a child.&rdquo; We believe the
            same is true of the businesses we build far from home.
          </p>
        </div>
        <div className="art">
          <HeroPreview />
        </div>
      </section>

      <section className="pubsec">
        <h2>Big enough to open doors. Small enough to know each other.</h2>
        <p className="intro">
          Every member belongs to three places at once. As the network grows,
          your home base stays human sized.
        </p>
        <LayerCards />
        <div className="across">
          <Ic name="users" style={{ color: "#24675A" }} />
          <p style={{ flex: 1, minWidth: 220 }}>
            <b>Across all three:</b> Industry Groups connect you with people in
            your field, and Pods bring a few members together around a shared
            goal.
          </p>
          <Link className="btn btn-ghost btn-sm" href="/how-it-works">
            How it works
          </Link>
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="sechead">
          <h2 style={{ fontSize: 20 }}>What members do here</h2>
        </div>
        <div className="g4 g3">
          {(
            [
              ["hand", "Ask and offer help", "Post what you need or what you can give, and track it until it is resolved."],
              ["users", "Find the right people", "Search by skill, language and the markets people know."],
              ["cal", "Meet in person", "Monthly gatherings in your Village, and events in other cities."],
              ["globe", "Explore new markets", "Talk to members who already build where you want to go."],
            ] as const
          ).map(([icon, title, text]) => (
            <div className="panel" key={title}>
              <Ic name={icon} style={{ color: "var(--blue)" }} />
              <h3 style={{ fontSize: 14, marginTop: 10 }}>{title}</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="sechead">
          <h2 style={{ fontSize: 20 }}>Villages</h2>
          <Link href="/villages" style={{ fontWeight: 600 }}>
            See all Villages
          </Link>
        </div>
        <div className="g3">
          {ordered.slice(0, 3).map((village) => (
            <VillageCard key={village.slug} village={village} />
          ))}
        </div>
      </section>

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="story">
          <div className="img" role="img" aria-label="Members in conversation" />
          <div>
            <span className="chip chip-pink">From the founder</span>
            <h3 style={{ fontSize: 20, marginTop: 12, maxWidth: "28ch" }}>
              Six countries, one lesson: local belonging needs global
              continuity.
            </h3>
            <p className="muted" style={{ marginTop: 8, maxWidth: "56ch" }}>
              Kristiane Charrier on rebuilding her network at every move, and
              why the first ExpatPreneurs community in Luanda shaped everything
              that followed.
            </p>
            <Link className="btn btn-ghost btn-sm" href="/media">
              Read the story
            </Link>
          </div>
        </div>
      </section>

      {businesses && businesses.length ? (
        <section className="pubsec" style={{ paddingTop: 0 }}>
          <div className="sechead">
            <h2 style={{ fontSize: 20 }}>Businesses in the network</h2>
            <Link href="/businesses" style={{ fontWeight: 600 }}>
              Browse all
            </Link>
          </div>
          <div className="g3">
            {businesses.map((biz, i) => (
              <BusinessCard key={biz.id} biz={biz as BusinessRow} i={i} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="pubsec" style={{ paddingTop: 0 }}>
        <div className="band">
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ fontSize: 22 }}>Ready to find your Village?</h2>
            <p style={{ marginTop: 6 }}>
              ExpatPreneurs is by invitation. Membership itself is free; the
              paid plan adds every Village.
            </p>
          </div>
          <Link className="btn btn-mint" href="/apply">
            Request your invitation
          </Link>
          <Link className="btn btn-ghost" href="/events">
            Come to an open evening
          </Link>
        </div>
      </section>
    </PublicPage>
  );
}
'@
Write-File "app\page.tsx" $f2

$f3 = @'
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
      .select("id, slug, name, city, country, status, summary")
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
Write-File "app\villages\page.tsx" $f3

$f4 = @'
"use client";

import Link from "next/link";

// When something goes wrong the navigation stays, so nobody is stranded.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pub">
      <section className="pubsec hero-center">
        <h1>Something went wrong here</h1>
        <p className="intro">
          The page did not load. Trying again usually works; if it keeps
          happening, tell the build team what you were doing.
        </p>
        <div className="ctas" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn-ghost" href="/">
            Back to the start
          </Link>
        </div>
        {error.digest ? (
          <p className="muted small" style={{ marginTop: 16 }}>
            Reference {error.digest}
          </p>
        ) : null}
      </section>
    </div>
  );
}
'@
Write-File "app\error.tsx" $f4

git add .
git commit -m "Real Village counts, Villages in the footer from the database"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Run 0037_village_public_counts.sql in Supabase."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
