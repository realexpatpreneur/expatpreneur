# 128-wording-they-can-edit.ps1
# Somewhere to edit the words on every page. One migration:
# 0048_page_text.sql.
#
# You are right that this cannot be handed over without it, and the
# Pages editor was not it. That one swaps a whole page for blocks, which
# works for a page of pure prose and would strip the home page of its
# cards the moment anybody pressed publish.
#
# This is the other half, and it cannot strip anything. Every heading,
# introduction and panel on a coded page has a key. The page asks for
# the key and gets whatever the Global team wrote, or the wording in the
# build if they wrote nothing. An empty table changes nothing, a deleted
# row goes back to the original, and the database being unreachable
# leaves the page exactly as it reads today.
#
# In the Global workspace, under Content, there is now Wording. It lists
# every public page, how many lines each has and how many have been
# changed. Opening one shows every line with a box, the wording from the
# build underneath it, and a link to see the page. Emptying a box puts
# the original back.
#
# Forty three lines across eleven pages are registered: Villages, a
# Village page, Events, Businesses, Learning, Media, Watch and Listen,
# Members, Contact, Discover and the invitation form.
#
# Two are wired all the way through in this script, Villages and Events,
# so you can change a word and watch it change on the site. The other
# nine are registered and follow in the next script; the editor already
# lists them.
#
# What this does not cover, and I would rather say it now: the wording
# inside the member, Local Admin, Global, Leader and Educator
# workspaces. That is a much larger surface and a different decision,
# because it is wording only staff and members see. Say if you want it
# and I will scope it.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0048_page_text.sql
#   C:\Users\HP\Desktop\expatpreneur\lib\text.ts
#   C:\Users\HP\Desktop\expatpreneur\lib\text-keys.ts
#   C:\Users\HP\Desktop\expatpreneur\app\global\wording\page.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\global\wording\[page]\page.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\global\wording\forms.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\global\wording\actions.ts
#   C:\Users\HP\Desktop\expatpreneur\app\villages\page.tsx
#   C:\Users\HP\Desktop\expatpreneur\app\events\page.tsx
#   C:\Users\HP\Desktop\expatpreneur\components\spaces.ts
#
#   powershell -ExecutionPolicy Bypass -File .\128-wording-they-can-edit.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $full"
}

$f0 = @'
-- Every word on a coded page, editable.
--
-- The pages table replaces a whole page with blocks, which is right for
-- a page that is only prose and wrong for a page with cards, filters
-- and live data. Publishing the home page that way would strip it.
--
-- This is the other half: one row per piece of text. A page asks for a
-- key, and gets the row if somebody has written one, or the wording in
-- the code if nobody has. Nothing can be stripped, because the code is
-- always the fallback, and an empty table changes nothing.

create table if not exists page_text (
  page       text not null,
  key        text not null,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id) on delete set null,
  primary key (page, key)
);

alter table page_text enable row level security;

-- Anyone may read it: this is the public wording of the website.
drop policy if exists page_text_read on page_text;
create policy page_text_read on page_text
  for select using (true);

-- Only the Global team writes it.
drop policy if exists page_text_write on page_text;
create policy page_text_write on page_text
  for all using (is_global_admin()) with check (is_global_admin());

create index if not exists page_text_page_idx on page_text(page);
'@
Write-File "supabase\migrations\0048_page_text.sql" $f0

$f1 = @'
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Wording that the Global team can change without a developer.
//
// A page loads its own rows once, then asks for each piece by key with
// the wording from the code as the fallback. If the table is empty, or
// the database is unreachable, every page reads exactly as it does
// today. Nothing can be blanked by publishing.
export type Words = (key: string, fallback: string) => string;

export const pageText = cache(async function pageText(
  page: string
): Promise<Words> {
  let rows: { key: string; value: string }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("page_text")
      .select("key, value")
      .eq("page", page);
    rows = data ?? [];
  } catch {
    // The page keeps its coded wording.
  }

  const map = new Map(rows.map((r) => [r.key, r.value]));
  return (key: string, fallback: string) => {
    const v = map.get(key);
    return v && v.trim() ? v : fallback;
  };
});
'@
Write-File "lib\text.ts" $f1

$f2 = @'
// Which pieces of wording each page has, and what the code says today.
//
// The editor reads this so it can list every editable line with its
// current wording, before anybody has changed anything. A page and this
// list have to agree: if you add a key to a page, add it here, or the
// Global team will never see it.

export type TextKey = { key: string; label: string; fallback: string; long?: boolean };
export type TextPage = { page: string; name: string; path: string; keys: TextKey[] };

export const TEXT_PAGES: TextPage[] = [
  {
    page: "villages",
    name: "Villages",
    path: "/villages",
    keys: [
      { key: "title", label: "Heading", fallback: "Find your Village" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network.",
      },
      { key: "none.title", label: "No Village panel, heading", fallback: "No Village in your city yet?" },
      {
        key: "none.body",
        label: "No Village panel, text",
        long: true,
        fallback:
          "Tell us where you are. New Villages open when there are enough members and trusted people ready to host them.",
      },
      { key: "none.button", label: "No Village panel, button", fallback: "Suggest your city" },
    ],
  },
  {
    page: "events",
    name: "Events",
    path: "/events",
    keys: [
      { key: "title", label: "Heading", fallback: "Events" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Gatherings in every Village and online. Some are open to everyone; most are for members.",
      },
      { key: "empty", label: "When there are no events", fallback: "No events published yet." },
    ],
  },
  {
    page: "businesses",
    name: "Businesses",
    path: "/businesses",
    keys: [
      { key: "title", label: "Heading", fallback: "Businesses in the network" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Services and offers from members in every Village. Contact them directly.",
      },
      { key: "band.title", label: "Closing band, heading", fallback: "Run a business abroad?" },
      {
        key: "band.body",
        label: "Closing band, text",
        fallback: "Members can list their business here once approved.",
      },
    ],
  },
  {
    page: "learning",
    name: "Learning",
    path: "/learning",
    keys: [
      { key: "title", label: "Heading", fallback: "Learning" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback: "Short, practical and actionable workshops from founders in the network.",
      },
      { key: "teach.title", label: "Teaching panel, heading", fallback: "Teach in the network" },
      {
        key: "teach.body",
        label: "Teaching panel, text",
        long: true,
        fallback:
          "Paid members can apply to become educators and earn from their workshops.",
      },
    ],
  },
  {
    page: "media",
    name: "Media",
    path: "/media",
    keys: [
      { key: "title", label: "Heading", fallback: "Media" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback: "Stories and knowledge from the people building across the network.",
      },
      { key: "news.title", label: "Newsletter panel, heading", fallback: "The monthly newsletter" },
      {
        key: "news.body",
        label: "Newsletter panel, text",
        fallback: "New stories, guides and events from every Village.",
      },
    ],
  },
  {
    page: "watch",
    name: "Watch and Listen",
    path: "/watch",
    keys: [
      { key: "title", label: "Heading", fallback: "Watch and Listen" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Videos and podcast episodes chosen by the ExpatPreneurs Media team, from our own channel and from members building across the network.",
      },
    ],
  },
  {
    page: "members",
    name: "Members",
    path: "/members",
    keys: [
      { key: "title", label: "Heading", fallback: "Meet the members" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Founders who chose to be listed publicly. Members see more, and can connect.",
      },
      { key: "band.title", label: "Closing band, heading", fallback: "Want to connect?" },
      { key: "band.body", label: "Closing band, text", fallback: "Members can message and meet each other." },
    ],
  },
  {
    page: "contact",
    name: "Contact",
    path: "/contact",
    keys: [
      { key: "title", label: "Heading", fallback: "Contact us" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Questions about membership or a Village? We usually reply within two working days.",
      },
      { key: "partnerships.title", label: "Partnerships tab, heading", fallback: "Partner with ExpatPreneurs" },
      {
        key: "partnerships.intro",
        label: "Partnerships tab, introduction",
        long: true,
        fallback:
          "Sponsors, venues and organisations who want to support expat founders. Partnerships are agreed with the Global team.",
      },
      { key: "press.title", label: "Press tab, heading", fallback: "Press and media" },
      {
        key: "press.intro",
        label: "Press tab, introduction",
        fallback: "Interviews, stories and speaking requests.",
      },
    ],
  },
  {
    page: "village",
    name: "A Village page",
    path: "/villages/dubai",
    keys: [
      {
        key: "lede",
        label: "Heading above the summary",
        fallback: "Build in {city} without starting from zero.",
      },
      { key: "events.title", label: "Events section heading", fallback: "Upcoming events" },
      { key: "admins.title", label: "Local Admins panel heading", fallback: "Your Local Admins" },
      { key: "joining.title", label: "Joining panel heading", fallback: "Joining {village}" },
      {
        key: "joining.body",
        label: "Joining panel text",
        long: true,
        fallback:
          "ExpatPreneurs is by invitation. Every request is read personally, and accepted members are welcomed into a Circle.",
      },
    ],
  },
  {
    page: "discover",
    name: "Discover",
    path: "/discover",
    keys: [
      { key: "title", label: "Heading", fallback: "Wherever you have landed, there is a Village for you" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback: "Find the Villages, Circles and people building a business away from home.",
      },
      {
        key: "search",
        label: "Search box wording",
        fallback: "Search Villages, Circles, members, events and businesses",
      },
    ],
  },
  {
    page: "apply",
    name: "Request an invitation",
    path: "/apply",
    keys: [
      { key: "title", label: "Heading", fallback: "Request your invitation" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "ExpatPreneurs is by invitation only. Every person starting a business in a country that is not their original country is an ExpatPreneur, at any stage: idea, scaling or expansion. It takes about ten minutes.",
      },
    ],
  },
];

export const textPage = (page: string) => TEXT_PAGES.find((p) => p.page === page);
'@
Write-File "lib\text-keys.ts" $f2

$f3 = @'
import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { Ic } from "@/components/icon";
import { TEXT_PAGES } from "@/lib/text-keys";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";

export const metadata = { title: "Wording, ExpatPreneurs Global" };

// Every public page, and how much of its wording has been changed.
export default async function WordingPage() {
  await requireGlobal();
  const supabase = await createClient();

  const { data: rows } = await supabase.from("page_text").select("page, key");
  const changed = new Map<string, number>();
  for (const r of rows ?? [])
    changed.set(r.page, (changed.get(r.page) ?? 0) + 1);

  return (
    <>
      <PageHead
        title="Wording"
        sub="Every heading, introduction and panel on the public pages. Anything you do not change keeps the wording it has now."
      />

      <div className="tablewrap">
        <table className="table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Address</th>
              <th>Lines you can edit</th>
              <th>Changed</th>
            </tr>
          </thead>
          <tbody>
            {TEXT_PAGES.map((p) => (
              <tr key={p.page}>
                <td>
                  <Link href={`/global/wording/${p.page}`}>
                    <b>{p.name}</b>
                  </Link>
                </td>
                <td className="muted">{p.path}</td>
                <td>{p.keys.length}</td>
                <td>
                  {changed.get(p.page) ? (
                    <span className="chip chip-mint">
                      {changed.get(p.page)} edited
                    </span>
                  ) : (
                    <span className="muted small">As written in the build</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel panel-wash" style={{ marginTop: 16 }}>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <Ic name="info" />
          <p className="muted small" style={{ margin: 0 }}>
            This changes wording, not layout. Whole pages made of prose,
            such as How it works, Membership and the legal pages, are
            edited under Pages instead.
          </p>
        </div>
      </div>
    </>
  );
}
'@
Write-File "app\global\wording\page.tsx" $f3

$f4 = @'
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { Ic } from "@/components/icon";
import { textPage } from "@/lib/text-keys";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { WordingForm } from "../forms";

export default async function EditWordingPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  await requireGlobal();

  const spec = textPage(page);
  if (!spec) notFound();

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("page_text")
    .select("key, value")
    .eq("page", page);

  const current = new Map((rows ?? []).map((r) => [r.key, r.value]));

  return (
    <>
      <div className="crumbs">
        <Link href="/global/wording">Wording</Link>
        <Ic name="chev" />
        <span>{spec.name}</span>
      </div>

      <PageHead
        title={spec.name}
        sub={`The wording on ${spec.path}. Leave a box empty to go back to the wording in the build.`}
      />

      <WordingForm
        page={page}
        path={spec.path}
        keys={spec.keys}
        current={Object.fromEntries(current)}
      />
    </>
  );
}
'@
Write-File "app\global\wording\[page]\page.tsx" $f4

$f5 = @'
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveWording, type WordingState } from "./actions";
import type { TextKey } from "@/lib/text-keys";

export function WordingForm({
  page,
  path,
  keys,
  current,
}: {
  page: string;
  path: string;
  keys: TextKey[];
  current: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<WordingState, FormData>(
    saveWording,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="page" value={page} />

      {state.done ? (
        <div className="flag ok" style={{ marginBottom: 14 }}>
          Saved. The page shows the new wording straight away.
        </div>
      ) : null}
      {state.error ? (
        <div className="flag hold" style={{ marginBottom: 14 }}>
          {state.error}
        </div>
      ) : null}

      <div className="stack" style={{ maxWidth: 820 }}>
        {keys.map((k) => (
          <div className="panel" key={k.key}>
            <label className="field">
              <span>{k.label}</span>
              {k.long ? (
                <textarea
                  name={`v.${k.key}`}
                  rows={3}
                  defaultValue={current[k.key] ?? ""}
                  placeholder={k.fallback}
                />
              ) : (
                <input
                  name={`v.${k.key}`}
                  defaultValue={current[k.key] ?? ""}
                  placeholder={k.fallback}
                />
              )}
            </label>
            <p className="muted small" style={{ marginTop: 8 }}>
              As written in the build: {k.fallback}
            </p>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving" : "Save wording"}
        </button>
        <Link className="btn btn-ghost" href={path} target="_blank">
          See the page
        </Link>
        <Link className="btn btn-ghost" href="/global/wording">
          Back
        </Link>
      </div>
    </form>
  );
}
'@
Write-File "app\global\wording\forms.tsx" $f5

$f6 = @'
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { textPage } from "@/lib/text-keys";

export type WordingState = { error?: string; done?: boolean };

export async function saveWording(
  _prev: WordingState,
  formData: FormData
): Promise<WordingState> {
  const me = await requireGlobal();
  const page = String(formData.get("page") ?? "");
  const spec = textPage(page);
  if (!spec) return { error: "That page is not one we can edit." };

  const supabase = await createClient();

  // A box left empty means "use the wording in the build", so the row
  // is removed rather than saved as an empty string.
  const keep: { page: string; key: string; value: string; updated_by: string }[] = [];
  const drop: string[] = [];

  for (const k of spec.keys) {
    const value = String(formData.get(`v.${k.key}`) ?? "").trim();
    if (value) keep.push({ page, key: k.key, value, updated_by: me.userId });
    else drop.push(k.key);
  }

  if (keep.length) {
    const { error } = await supabase
      .from("page_text")
      .upsert(keep, { onConflict: "page,key" });
    if (error) return { error: error.message };
  }
  if (drop.length) {
    await supabase.from("page_text").delete().eq("page", page).in("key", drop);
  }

  revalidatePath(spec.path);
  revalidatePath("/global/wording");
  return { done: true };
}
'@
Write-File "app\global\wording\actions.ts" $f6

$f7 = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pageText } from "@/lib/text";
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
  const t = await pageText("villages");

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
        <h2>{t("title", "Find your Village")}</h2>
        <p className="intro">
          {t("intro", "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network.")}
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
Write-File "app\villages\page.tsx" $f7

$f8 = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pageText } from "@/lib/text";
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
  const t = await pageText("events");

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
          <h1>{t("title", "Events")}</h1>
          <p className="intro">
            {t("intro", "Gatherings in every Village and online. Some are open to everyone; most are for members.")}
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
Write-File "app\events\page.tsx" $f8

$f9 = @'
// The rail of spaces and the sidebar inside each one, as the prototype
// arranges them. Each entry is [href, icon, label, count?].
export type NavItem = [string, string, string, number?];
export type Space = { id: string; label: string; icon: string; items: NavItem[] };

export const MEMBER_SPACES: Space[] = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    items: [
      ["/home", "home", "Feed"],
      ["/for-you", "sparkle", "For you"],
      ["/messages", "chat", "Messages"],
      ["/notifications", "bell", "Notifications"],
      ["/directory", "users", "Directory"],
      ["/search", "search", "Search"],
    ],
  },
  {
    id: "village",
    label: "Your Village",
    icon: "pin",
    items: [
      ["/my-village", "hand", "Ask & Offer"],
      ["/my-village/members", "users", "Members"],
      ["/my-village/circles", "rings", "Circles"],
      ["/my-village/announcements", "bell", "Announcements"],
      ["/events", "cal", "Events"],
      ["/library", "book", "Resources"],
    ],
  },
  {
    id: "circle",
    label: "Your groups",
    icon: "rings",
    items: [
      ["/groups", "users", "Industry Groups"],
      ["/pods", "check", "Pods"],
      ["/network", "globe", "The network"],
    ],
  },
  {
    id: "work",
    label: "Work",
    icon: "briefcase",
    items: [
      ["/businesses", "briefcase", "Businesses"],
      ["/jobs", "tag", "Jobs and freelance"],
      ["/learning", "book", "Learning"],
      ["/markets", "globe", "Explore markets"],
    ],
  },
  {
    id: "media",
    label: "Media",
    icon: "video",
    items: [
      ["/media", "book", "Stories"],
      ["/watch", "video", "Watch and Listen"],
    ],
  },
  {
    id: "you",
    label: "You",
    icon: "user",
    items: [
      ["/me", "user", "My profile"],
      ["/me/edit", "edit", "Edit profile"],
      ["/settings", "gear", "Settings"],
      ["/membership", "star", "Membership"],
    ],
  },
];

export const ADMIN_SPACES: Space[] = [
  {
    id: "people",
    label: "People",
    icon: "users",
    items: [
      ["/admin", "grid", "Overview"],
      ["/admin/applications", "inbox", "Invitation requests"],
      ["/admin/members", "users", "Members"],
      ["/admin/circles", "rings", "Circles"],
      ["/admin/care", "heart", "Member care"],
      ["/admin/re-enrolment", "star", "Re-enrolment"],
      ["/admin/whatsapp", "chat", "WhatsApp sync"],
      ["/admin/transfers", "move", "Moves"],
      ["/admin/mix", "globe", "Village mix"],
      ["/admin/leadership", "star", "Leadership"],
    ],
  },
  {
    id: "whatson",
    label: "What is on",
    icon: "cal",
    items: [
      ["/admin/events", "cal", "Events"],
      ["/admin/live", "video", "Live rooms"],
      ["/admin/announcements", "bell", "Announcements"],
      ["/admin/partners", "star", "Partnered events"],
    ],
  },
  {
    id: "read",
    label: "What there is to read",
    icon: "book",
    items: [
      ["/admin/resources", "book", "Resources"],
      ["/admin/media", "video", "Watch and Listen"],
    ],
  },
  {
    id: "listening",
    label: "Listening",
    icon: "heart",
    items: [
      ["/admin/reports", "flag", "Reports"],
      ["/admin/suggestions", "inbox", "Suggestion box"],
      ["/admin/insight", "sliders", "Insight"],
      ["/admin/settings", "gear", "Village settings"],
    ],
  },
];

export const GLOBAL_SPACES: Space[] = [
  {
    id: "net",
    label: "Network",
    icon: "globe",
    items: [
      ["/global", "grid", "Overview"],
      ["/admin/applications", "inbox", "Invitation requests"],
      ["/global/villages", "pin", "Villages"],
      ["/global/events", "cal", "Events"],
      ["/global/cities", "plus", "City suggestions"],
      ["/admin/members", "users", "Members and roles"],
      ["/global/roles", "shield", "Permissions"],
      ["/global/plans", "card", "Plans and benefits"],
      ["/global/mix", "globe", "Nationality limits"],
      ["/global/groups", "rings", "Groups and Pods"],
      ["/global/requests", "inbox", "Requests"],
      ["/global/moderation", "flag", "Moderation"],
      ["/global/suggestions", "sparkle", "Suggestions"],
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: "edit",
    items: [
      ["/global/content", "edit", "Pages"],
      ["/global/wording", "edit", "Wording"],
      ["/global/media", "book", "Articles"],
      ["/global/photos", "image", "Photos and consent"],
      ["/global/library", "list", "Resources library"],
      ["/admin/media", "video", "Watch and Listen"],
      ["/global/emails", "mail", "Emails"],
    ],
  },
  {
    id: "money",
    label: "Money and marketplaces",
    icon: "card",
    items: [
      ["/global/money", "card", "Payments and tickets"],
      ["/global/recognition", "heart", "Team recognition"],
      ["/global/learning", "star", "Educators and courses"],
      ["/global/businesses", "briefcase", "Business listings"],
      ["/global/partners", "star", "Partnered events"],
      ["/global/markets", "globe", "Market pathways"],
    ],
  },
  {
    id: "insight",
    label: "Insight",
    icon: "sliders",
    items: [
      ["/global/reporting", "sliders", "Analytics"],
      ["/global/network", "sparkle", "Network intelligence"],
      ["/global/audit", "list", "Audit log"],
      ["/global/settings", "gear", "System settings"],
    ],
  },
];

export const LEAD_SPACES: Space[] = [
  {
    id: "lead",
    label: "Leader tools",
    icon: "rings",
    items: [
      ["/lead", "rings", "Your Circle"],
                ],
  },
];

export const EDU_SPACES: Space[] = [
  {
    id: "teach",
    label: "Educator",
    icon: "star",
    items: [
      ["/educator", "grid", "Overview"],
            ["/educator/learners", "users", "Learners"],
      ["/educator/sales", "card", "Sales"],
      ["/educator/payouts", "download", "Payouts"],
      ["/educator/profile", "user", "Educator profile"],
    ],
  },
];

export const SPACES: Record<string, Space[]> = {
  member: MEMBER_SPACES,
  admin: ADMIN_SPACES,
  global: GLOBAL_SPACES,
  lead: LEAD_SPACES,
  edu: EDU_SPACES,
};

// The bottom tabs on a phone.
export const TABS: Record<string, NavItem[]> = {
  member: [
    ["/home", "home", "Home"],
    ["/my-village", "pin", "Village"],
    ["/events", "cal", "Events"],
    ["/messages", "chat", "Messages"],
    ["/more", "menu", "More"],
  ],
  admin: [
    ["/admin", "grid", "Overview"],
    ["/admin/applications", "inbox", "Review"],
    ["/admin/members", "users", "Members"],
    ["/admin/circles", "rings", "Circles"],
    ["/admin/more", "menu", "More"],
  ],
  global: [
    ["/global", "grid", "Overview"],
    ["/admin/applications", "inbox", "Decisions"],
    ["/global/villages", "pin", "Villages"],
    ["/admin/members", "users", "Members"],
    ["/global/more", "menu", "More"],
  ],
  lead: [
    ["/lead", "rings", "What you run"],
    ["/home", "home", "Member view"],
    ["/lead/more", "menu", "More"],
  ],
  edu: [
    ["/educator", "grid", "Overview"],
    ["/educator/learners", "users", "Learners"],
    ["/educator/sales", "card", "Sales"],
    ["/educator/more", "menu", "More"],
  ],
};

// The other workspaces, for the foot of the sidebar.
export const OTHER_WORKSPACES: [string, string, string][] = [
  ["member", "home", "Member space"],
  ["lead", "rings", "Leader tools"],
  ["edu", "star", "Educator"],
  ["admin", "pin", "Local Admin"],
  ["global", "globe", "Global team"],
];

export const WORKSPACE_START: Record<string, string> = {
  member: "/home",
  lead: "/lead",
  edu: "/educator",
  admin: "/admin",
  global: "/global",
};
'@
Write-File "components\spaces.ts" $f9

git add app lib components supabase
git commit -m "Wording every page can be edited from, with the build as the fallback"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Then run this in Supabase:"
    Write-Host "  C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0048_page_text.sql"
    Write-Host ""
    Write-Host "Then: Global team, Content, Wording."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
