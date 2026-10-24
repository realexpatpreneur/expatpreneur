# 127-the-village-page-as-the-prototype-has-it.ps1
# The Village page, rebuilt from your markup instead of mine. One
# migration: 0047_village_nationality_count.sql.
#
# You are right. The prototype has three stat blocks reading Members,
# Circles, Nationalities. I replaced them with three prose panels I
# wrote myself, and the same thing has happened on other pages. That was
# not a judgement call, it was me not following the file you gave me.
#
# The page now follows the prototype's structure line for line:
#
#   the photographic hero with the status chip and the Village name
#   the breadcrumb
#   "Build in <city> without starting from zero" and the summary
#   the three stat blocks, in that order, from the database
#   "Upcoming events" with the event rows and their thumbnails
#   the Local Admins panel, with photographs and both buttons
#   the joining panel with the full-width button
#
# A Village that is launching shows the prototype's other three blocks:
# Status, Founding members, Nationalities.
#
# The numbers come from the database, so they are 2 today and 73 when
# 73 people have joined. Nothing is invented and nothing is hardcoded.
# 0047 adds the nationalities count to the public view, which only
# counted members and Circles, so the third block had nowhere to read
# from. It counts distinct nationalities and never says which, so
# nothing about the balance rule becomes public.
#
# Next, in this order unless you tell me otherwise: Membership, which
# has the wrong pricing cards and no monthly and yearly switch; the home
# page, which is missing the joining path; the Villages index; then
# Learning, Businesses, Media and Watch and Listen. One script each,
# each one against your markup rather than my memory of it.
#
# Full paths for this script:
#   C:\Users\HP\Desktop\expatpreneur\app\villages\[slug]\page.tsx
#   C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0047_village_nationality_count.sql
#
#   powershell -ExecutionPolicy Bypass -File .\127-the-village-page-as-the-prototype-has-it.ps1

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
import { DualPage } from "@/components/dual-page";
import { villagePhoto } from "@/components/cards";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";
import { whenText } from "@/lib/events";
import { EventRow } from "@/components/feed";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

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
  const [{ data: counts }, { data: events }, { data: admins }] = await Promise.all([
    // Counted by the database, because a visitor cannot read profiles.
    supabase
      .from("village_public_counts")
      .select("members, circles, nationalities")
      .eq("village_id", village.id)
      .maybeSingle(),
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

        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="crumbs">
            <Link href="/villages">Villages</Link>
            <Ic name="chev" />
            <span>{village.name}</span>
          </div>

          <div className="gside">
            <div>
              <h2 style={{ fontSize: 20 }}>
                Build in {village.city} without starting from zero.
              </h2>
              <p className="intro">{village.summary}</p>

              {/* The prototype's three numbers, in its own order. */}
              <div className="g3 stats3" style={{ marginTop: 22 }}>
                {opening ? (
                  <>
                    <div className="stat">
                      <span>Status</span>
                      <b style={{ fontSize: 18 }}>Opening soon</b>
                    </div>
                    <div className="stat">
                      <span>Founding members</span>
                      <b>{counts?.members ?? 0}</b>
                    </div>
                    <div className="stat">
                      <span>Nationalities</span>
                      <b>{counts?.nationalities ?? 0}</b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat">
                      <span>Members</span>
                      <b>{counts?.members ?? 0}</b>
                    </div>
                    <div className="stat">
                      <span>Circles</span>
                      <b>{counts?.circles ?? 0}</b>
                    </div>
                    <div className="stat">
                      <span>Nationalities</span>
                      <b>{counts?.nationalities ?? 0}</b>
                    </div>
                  </>
                )}
              </div>

              <div className="sechead" style={{ marginTop: 28 }}>
                <h3>Upcoming events</h3>
                <Link className="small" style={{ fontWeight: 600 }} href="/events">
                  All {village.name} events
                </Link>
              </div>
              <div className="divide">
                {(events ?? []).length === 0 ? (
                  <p className="muted">No events published yet.</p>
                ) : (
                  (events ?? []).map((event) => {
                    const d = new Date(event.starts_at);
                    return (
                      <EventRow
                        key={event.id}
                        cover={event.cover_url}
                        href={`/e/${event.slug}`}
                        day={String(d.getDate())}
                        month={d.toLocaleDateString("en-GB", { month: "short" })}
                        title={event.title}
                        line={`${whenText(event)}${
                          event.venue ? `, ${event.venue}` : ""
                        }`}
                        right={
                          <Link
                            className="btn btn-ghost btn-sm evtact"
                            href={`/e/${event.slug}`}
                          >
                            Register
                          </Link>
                        }
                      />
                    );
                  })
                )}
              </div>
            </div>

            <aside className="stack">
              <div className="panel">
                <h3 style={{ fontSize: 14 }}>Your Local Admins</h3>
                {hosts.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {opening
                      ? "We are looking for the people who will run this one. If that could be you, say so when you join the waitlist."
                      : "The Local Admins here keep their profiles private."}
                  </p>
                ) : (
                  hosts.map((host) => (
                    <Link className="li linkrow" key={host.id} href={`/members/${host.id}`}>
                      <Av name={host.full_name} />
                      <div className="grow">
                        <b>{host.full_name}</b>
                        <span className="muted small">{host.headline}</span>
                      </div>
                    </Link>
                  ))
                )}
                <div className="row" style={{ flexWrap: "wrap" }}>
                  <Link className="btn btn-ghost btn-sm" href="/members">
                    Meet members
                  </Link>
                  <Link className="btn btn-ghost btn-sm" href="/contact">
                    Contact the Village
                  </Link>
                </div>
              </div>

              <div className="panel panel-wash">
                <h3 style={{ fontSize: 14 }}>
                  {opening ? `Joining ${village.name}` : `Joining ${village.name}`}
                </h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  {opening
                    ? "A Village opens when there are enough members in the city, two Local Admins and a first Circle Host. Joining the waitlist counts you towards the first, and you can offer to be one of the others."
                    : "ExpatPreneurs is by invitation. Every request is read personally, and accepted members are welcomed into a Circle."}
                </p>
                <Link
                  className="btn btn-primary"
                  href={opening ? waitlist : "/apply"}
                  style={{ marginTop: 14, width: "100%" }}
                >
                  {opening
                    ? "Join the waitlist"
                    : `Request an invitation to ${village.name}`}
                </Link>
              </div>
            </aside>
          </div>
        </section>

      </DualPage>
  );
}
'@
Write-File "app\villages\[slug]\page.tsx" $f0

$f1 = @'
-- The third number the prototype's Village page shows.
--
-- The page has three stat blocks: Members, Circles, Nationalities. The
-- view only counted the first two, so the third had nowhere to come
-- from. Counted server side, like the other two, because a visitor
-- cannot read the profiles table.
--
-- This is a count of distinct nationalities. It never says which ones,
-- and the 30 percent rule is not visible here or anywhere public.

create or replace view village_public_counts as
  select
    v.id as village_id,
    v.slug,
    (select count(*) from profiles p
      where p.village_id = v.id and p.status = 'active') as members,
    (select count(*) from circles c
      where c.village_id = v.id) as circles,
    (select count(distinct n) from profiles p
       cross join lateral unnest(p.nationalities) as n
      where p.village_id = v.id and p.status = 'active') as nationalities
  from villages v;

grant select on village_public_counts to anon, authenticated;
'@
Write-File "supabase\migrations\0047_village_nationality_count.sql" $f1

git add app supabase
git commit -m "The Village page as the prototype has it, with the three counts"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Then run this in Supabase:"
    Write-Host "  C:\Users\HP\Desktop\expatpreneur\supabase\migrations\0047_village_nationality_count.sql"
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
