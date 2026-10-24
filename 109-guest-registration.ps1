# 109-guest-registration.ps1
# What a stranger tells you when they come to an open evening.
# One migration: 0039_guest_registration_details.sql.
#
# Guest registration existed but asked for a name and an email. The
# prototype asks five things, and the three missing ones are the useful
# ones:
#
#   Company.
#   City you live in.
#   What would you like to get from this event?
#
# That last one is how a host introduces somebody to the right people on
# the night, and it is the only chance you get to ask before they walk
# in. All three now reach the host on the event's page in the admin
# workspace, beside the attendee.
#
# 0039 adds the three columns, on the registration rather than on a
# person, because a guest is not a member and may never be one.
#
# The page also says plainly when an event has a guest price, rather
# than taking a registration and going quiet about the money.
#
# Run the migration in Supabase:
#   supabase/migrations/0039_guest_registration_details.sql
#
#   powershell -ExecutionPolicy Bypass -File .\109-guest-registration.ps1

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
-- What a guest tells the host when they register for an open event.
--
-- A stranger coming to an open evening is the top of the funnel: the
-- host wants to know who is walking in, and what they came for. Three
-- columns, on the registration rather than on a person, because a guest
-- is not a member and may never be one.

alter table event_registrations
  add column if not exists guest_company text,
  add column if not exists guest_city text,
  add column if not exists guest_hopes text;
'@
Write-File "supabase\migrations\0039_guest_registration_details.sql" $f0

$f1 = @'
"use client";

import { useActionState } from "react";
import {
  registerForEvent,
  cancelRegistration,
  registerAsGuest,
  type RegisterState,
} from "./actions";

export function RegisterForm({
  eventId,
  slug,
  requiresApproval,
  isVisitor,
  label,
  waitingList = false,
}: {
  eventId: string;
  slug: string;
  requiresApproval: boolean;
  isVisitor: boolean;
  label: string;
  waitingList?: boolean;
}) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    registerForEvent,
    {}
  );

  if (state.done === "confirmed") {
    return (
      <div className="flag ok">
        You are registered. A reminder comes the day before and an hour before
        it starts.
      </div>
    );
  }
  if (state.done === "waiting") {
    return (
      <div className="flag ok">
        You are on the list. If a place comes free you get it, and you will
        hear by email.
      </div>
    );
  }
  if (state.done === "pending") {
    return (
      <div className="flag ok">
        Your request is with the host. You will hear within a day.
      </div>
    );
  }

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="requires_approval" value={requiresApproval ? "1" : "0"} />
      <input type="hidden" name="is_visitor" value={isVisitor ? "1" : "0"} />
      <input type="hidden" name="waiting_list" value={waitingList ? "1" : "0"} />

      {isVisitor ? (
        <label className="field">
          <span>What brings you to this Village?</span>
          <input name="note" placeholder="Exploring the market, visiting family" />
          <span className="hint">
            The Local Admins see this and can introduce you to the right people.
          </span>
        </label>
      ) : null}

      <label className="field">
        <span>Anything the host should know?</span>
        <input name="dietary" placeholder="Dietary needs, accessibility, arriving late" />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Registering" : label}
      </button>
    </form>
  );
}

export function CancelForm({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string;
}) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    cancelRegistration,
    {}
  );

  if (state.done === "cancelled") {
    return <div className="flag hold">Your place has been released.</div>;
  }

  return (
    <form action={action}>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Cancelling" : "Cancel my place"}
      </button>
    </form>
  );
}

export function GuestRegisterForm({
  eventId,
  slug,
  requiresApproval,
  priced,
}: {
  eventId: string;
  slug: string;
  requiresApproval?: boolean;
  priced?: boolean;
}) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    registerAsGuest,
    {}
  );

  if (state.done) {
    return (
      <div className="flag ok">
        {requiresApproval
          ? "Thank you. The host will confirm your place by email."
          : "You are registered. Details are on their way by email."}
      </div>
    );
  }

  return (
    <form action={action} className="panel">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <input
        type="hidden"
        name="requires_approval"
        value={requiresApproval ? "1" : "0"}
      />

      <div className="formgrid">
        <label className="field">
          <span>Full name</span>
          <input name="guest_name" required autoComplete="name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="guest_email" type="email" required autoComplete="email" />
        </label>
        <label className="field">
          <span>Company</span>
          <input name="guest_company" />
        </label>
        <label className="field">
          <span>City you live in</span>
          <input name="guest_city" />
        </label>
        <label className="field full">
          <span>What would you like to get from this event?</span>
          <textarea name="guest_hopes" rows={3} />
          <span className="hint">
            The host reads these, and it is how they introduce you to the
            right people on the night.
          </span>
        </label>
      </div>

      {priced ? (
        <div className="flag hold">
          This event has a guest price. Payment opens after you register,
          once card payments are switched on.
        </div>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Registering" : requiresApproval ? "Ask for a place" : "Register"}
      </button>
    </form>
  );
}
'@
Write-File "app\events\forms.tsx" $f1

$f2 = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { sendEmail, url } from "@/lib/email";
import { whenText } from "@/lib/events";

export type RegisterState = { error?: string; done?: string };

// A member registering for themselves. The database checks the audience,
// the tier and the Village rules again, so a refusal here is final.
export async function registerForEvent(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/events/${slug}`);

  const eventId = String(formData.get("event_id"));
  const requiresApproval = formData.get("requires_approval") === "1";
  const isVisitor = formData.get("is_visitor") === "1";

  const waiting = formData.get("waiting_list") === "1";

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    profile_id: user.id,
    is_visitor: isVisitor,
    status: waiting ? "waitlist" : requiresApproval ? "pending" : "confirmed",
    note: String(formData.get("note") ?? "").trim() || null,
    dietary: String(formData.get("dietary") ?? "").trim() || null,
  });

  if (error) {
    return {
      error:
        "That registration was refused. Either the event is not open to you, or you are already on the list.",
    };
  }

  const [{ data: event }, { data: profile }] = await Promise.all([
    supabase
      .from("events")
      .select("title, starts_at, ends_at, timezone, venue, is_online, online_url")
      .eq("id", eventId)
      .maybeSingle(),
    supabase
      .from("member_records")
      .select("email, full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (waiting) {
    revalidatePath(`/events/${slug}`);
    return { done: "waiting" };
  }

  if (event && profile?.email) {
    await sendEmail(
      profile.email,
      requiresApproval ? `Request sent: ${event.title}` : `You are going: ${event.title}`,
      event.title,
      [
        requiresApproval
          ? "Your request is with the host, who will confirm shortly."
          : "Your place is confirmed.",
        whenText(event),
        event.is_online
          ? `Online. ${event.online_url ?? "The link is on the event page."}`
          : event.venue ?? "The venue is on the event page.",
        "A reminder comes the day before and an hour before it starts.",
      ],
      { label: "Open the event", href: url(`/events/${slug}`) }
    );
  }

  revalidatePath(`/events/${slug}`);
  return { done: requiresApproval ? "pending" : "confirmed" };
}

// A place that comes free goes to whoever has waited longest, and they are
// told rather than left to notice.
export async function offerThePlaceOn(eventId: string, slug: string) {
  const service = createAdminClient();

  const { data: event } = await service
    .from("events")
    .select("id, title, capacity, starts_at, ends_at, timezone, venue, address, is_online, online_url")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return;

  const { count: taken } = await service
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  if ((taken ?? 0) >= event.capacity) return;

  const { data: next } = await service
    .from("event_registrations")
    .select("id, profile_id")
    .eq("event_id", eventId)
    .eq("status", "waitlist")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!next?.profile_id) return;

  await service
    .from("event_registrations")
    .update({ status: "confirmed" })
    .eq("id", next.id);

  await notify(
    next.profile_id,
    "event",
    `A place came free: ${event.title}`,
    "You were next on the list, and you are in.",
    `/events/${slug}`
  );

  const { data: person } = await service
    .from("profiles")
    .select("email, full_name")
    .eq("id", next.profile_id)
    .maybeSingle();

  if (person?.email) {
    await sendEmail(
      person.email,
      `A place came free: ${event.title}`,
      "You are in",
      [
        `${person.full_name.split(" ")[0]}, somebody gave up their place and you were next.`,
        whenText(event),
        event.is_online
          ? `Online. ${event.online_url ?? "The link is on the event page."}`
          : `${event.venue ?? ""} ${event.address ?? ""}`.trim() ||
            "The venue is on the event page.",
        "If you can no longer make it, cancel so the next person gets it.",
      ],
      { label: "Open the event", href: url(`/events/${slug}`) }
    );
  }
}

export async function cancelRegistration(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const slug = String(formData.get("slug"));
  if (!user) redirect(`/login?next=/events/${slug}`);

  const eventId = String(formData.get("event_id"));

  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };

  await offerThePlaceOn(eventId, slug);

  revalidatePath(`/events/${slug}`);
  return { done: "cancelled" };
}

// Anyone, on or off the platform, for a public event.
export async function registerAsGuest(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const supabase = await createClient();
  const name = String(formData.get("guest_name") ?? "").trim();
  const email = String(formData.get("guest_email") ?? "").trim();
  if (!name || !email) return { error: "Your name and email are needed." };

  const { error } = await supabase.from("event_registrations").insert({
    event_id: String(formData.get("event_id")),
    guest_name: name,
    guest_email: email,
    guest_company: String(formData.get("guest_company") ?? "").trim() || null,
    guest_city: String(formData.get("guest_city") ?? "").trim() || null,
    guest_hopes: String(formData.get("guest_hopes") ?? "").trim() || null,
    status: formData.get("requires_approval") === "1" ? "pending" : "confirmed",
  });

  if (error) {
    return {
      error:
        "That did not go through. You may already be registered with that address.",
    };
  }

  const slug = String(formData.get("slug"));
  const { data: event } = await supabase
    .from("events")
    .select("title, starts_at, ends_at, timezone, venue, is_online, online_url")
    .eq("id", String(formData.get("event_id")))
    .maybeSingle();

  if (event) {
    await sendEmail(
      email,
      `You are registered: ${event.title}`,
      event.title,
      [
        `Thank you for registering, ${name.split(" ")[0]}.`,
        whenText(event),
        event.is_online
          ? `Online. ${event.online_url ?? "The link follows nearer the time."}`
          : event.venue ?? "The venue follows nearer the time.",
        "This event is open to everyone. Most of what ExpatPreneurs does is for members, by invitation.",
      ],
      { label: "See the event", href: url(`/e/${slug}`) }
    );
  }

  redirect(`/e/${slug}?registered=1`);
}
'@
Write-File "app\events\actions.ts" $f2

$f3 = @'
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whenText, priceText, type EventRow } from "@/lib/events";
import { PublicPage } from "@/components/public-page";
import { GuestRegisterForm } from "@/app/events/forms";

// The public face of an event. Anyone can open this, whether they have an
// account or not, as long as the host made the event public.
export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ registered?: string }>;
}) {
  const { slug } = await params;
  const { registered } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("visibility", "public")
    .eq("status", "published")
    .maybeSingle();

  if (!data) notFound();
  const event = data as EventRow;

  const { data: village } = event.village_id
    ? await supabase
        .from("villages")
        .select("name, city")
        .eq("id", event.village_id)
        .maybeSingle()
    : { data: null };

  return (
    <PublicPage>
      <main className="wrap">
        <section className="sec">
          <p>
            {village?.name ? (
              <span className="chip chip-mint">{village.name}</span>
            ) : null}{" "}
            <span className="chip">Open to everyone</span>
          </p>
          <h1>{event.title}</h1>
          <p className="lead">{whenText(event)}</p>
          {event.cover_url ? (
            <div className="shot" style={{ maxWidth: 720 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.cover_url} alt="" />
            </div>
          ) : null}
        </section>

        <section className="sec">
          <div className="gside">
            <div className="stack">
              <div className="panel">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {event.description}
                </p>
              </div>
              <div className="panel">
                <h3>The detail</h3>
                <dl className="kv">
                  <dt>When</dt>
                  <dd>{whenText(event)}</dd>
                  <dt>Where</dt>
                  <dd>
                    {event.is_online
                      ? "Online. The link is sent after you register."
                      : `${event.venue ?? "To be confirmed"}, ${village?.city ?? ""}`}
                  </dd>
                  <dt>Price</dt>
                  <dd>{priceText(event)}</dd>
                </dl>
              </div>
            </div>

            <div className="stack">
              {registered ? (
                <div className="panel">
                  <h3>You are registered</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {event.requires_approval
                      ? "The host reviews each registration and will be in touch."
                      : "The details are on their way to your inbox."}
                  </p>
                </div>
              ) : (
                <GuestRegisterForm
                  eventId={event.id}
                  slug={event.slug}
                  requiresApproval={event.requires_approval}
                  priced={Boolean(event.price_cents)}
                />
              )}

              <div className="panel panel-wash">
                <h3>About ExpatPreneurs</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  A curated network of expat entrepreneurs. Most of what we do
                  is for members, but some events are open to anyone.
                </p>
                <Link className="btn btn-ghost" href="/apply">
                  Request an invitation
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
'@
Write-File "app\e\[slug]\page.tsx" $f3

$f4 = @'
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { whenText, priceText, audienceText, type EventRow } from "@/lib/events";
import { DecisionButtons, CheckInButton } from "../forms";

export default async function AdminEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const event = data as EventRow;

  const [{ data: registrations }, { data: village }] = await Promise.all([
    supabase
      .from("event_registrations")
      .select("id, profile_id, guest_name, guest_email, guest_company, guest_city, guest_hopes, status, is_visitor, note, checked_in_at")
      .eq("event_id", id)
      .order("created_at"),
    event.village_id
      ? supabase.from("villages").select("name").eq("id", event.village_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const memberIds = (registrations ?? [])
    .map((r) => r.profile_id)
    .filter(Boolean) as string[];
  const { data: members } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, village_id")
        .in("id", memberIds)
    : { data: [] };

  const rows = registrations ?? [];
  const waiting = rows.filter((r) => r.status === "pending");
  const confirmed = rows.filter((r) => r.status === "confirmed");
  const checkedIn = rows.filter((r) => r.checked_in_at);
  const nameOf = (row: (typeof rows)[number]) =>
    row.guest_name ??
    members?.find((m) => m.id === row.profile_id)?.full_name ??
    "A member";

  return (
    <main className="wrap">
      <section className="sec">
        <p className="muted small">
          <Link href="/admin/events">Events</Link>
        </p>
        <h1>{event.title}</h1>
        <p className="lead">
          {whenText(event)}. {event.venue ?? "Online"}. {priceText(event)}.
        </p>
        {done ? (
          <div className="flag ok">
            {done === "published" ? "Event published." : "Saved."}
          </div>
        ) : null}
        <p>
          <Link className="btn btn-ghost" href={`/admin/events/${id}/edit`}>
            Edit
          </Link>{" "}
          {event.visibility === "public" ? (
            <Link className="btn btn-ghost" href={`/e/${event.slug}`}>
              See the public page
            </Link>
          ) : (
            <Link className="btn btn-ghost" href={`/events/${event.slug}`}>
              See the member page
            </Link>
          )}
        </p>
      </section>

      <section className="sec">
        <div className="g3">
          <div className="panel">
            <h3>Registered</h3>
            <p className="lead" style={{ margin: 0 }}>
              {confirmed.length} of {event.capacity}
            </p>
          </div>
          <div className="panel">
            <h3>Waiting for approval</h3>
            <p className="lead" style={{ margin: 0 }}>
              {waiting.length}
            </p>
          </div>
          <div className="panel">
            <h3>Checked in</h3>
            <p className="lead" style={{ margin: 0 }}>
              {checkedIn.length}
            </p>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="panel">
          <h3>Who can register</h3>
          <p className="muted small" style={{ marginTop: 6 }}>
            {audienceText(event, village?.name ?? null)}.{" "}
            {event.requires_approval
              ? "Each registration waits for your approval."
              : "Registration is immediate until the event is full."}{" "}
            {event.show_guest_list
              ? "The guest list is visible to everyone who registers."
              : "The guest list stays private."}
          </p>
        </div>
      </section>

      {waiting.length ? (
        <section className="sec">
          <h2>Waiting for approval</h2>
          <div className="divide">
            {waiting.map((row) => (
              <div className="li linkrow" key={row.id}>
                <div>
                  <b>{nameOf(row)}</b>
                  <div className="muted small">
                    {row.guest_email ?? ""}
                    {row.note ? ` ${row.note}` : ""}
                  </div>
                </div>
                <div className="rowmeta">
                  <DecisionButtons registrationId={row.id} eventId={id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="sec">
        <h2>Guest list</h2>
        {rows.length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nobody has registered yet.
            </p>
          </div>
        ) : (
          <div className="divide">
            {rows.map((row) => (
              <div className="li linkrow" key={row.id}>
                <div>
                  <b>{nameOf(row)}</b>
                  <div className="muted small">
                    {row.guest_email
                      ? `Guest. ${row.guest_email}`
                      : row.is_visitor
                        ? "Visiting member"
                        : "Member"}
                    . {row.status}.
                  </div>
                </div>
                <div className="rowmeta">
                  {row.status === "confirmed" ? (
                    <CheckInButton
                      registrationId={row.id}
                      eventId={id}
                      checkedIn={Boolean(row.checked_in_at)}
                    />
                  ) : (
                    <span className="chip">{row.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
'@
Write-File "app\admin\events\[id]\page.tsx" $f4

git add app supabase
git commit -m "Guest registration asks what the prototype asks"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Run 0039_guest_registration_details.sql in Supabase."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
