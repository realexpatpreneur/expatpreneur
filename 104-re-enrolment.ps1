# 104-re-enrolment.ps1
# The flow that brings the Dubai WhatsApp members onto the platform.
# One migration: 0038_founding_invites.sql.
#
# This did not exist, and on launch day those 73 people are the only
# members you have. Four pieces, as the prototype lays it out.
#
# The Local Admin page, at Re-enrolment in the sidebar. Paste the
# WhatsApp list, one person per line, name first and then a phone or an
# email. Each person gets their own address to be sent by WhatsApp or
# email. The page shows how many are on the list, how many are through,
# how many are still waiting and how many have stepped away, with the
# deadline and a button to mark somebody reminded.
#
# Their page, Welcome back with their first name. Their details are
# already in it. They confirm, add their business, set a password, tick
# the two boxes and land in their profile, with the founding member
# badge and membership at no cost. It says that at the top, in green,
# before anything is asked of them.
#
# Not for me anymore, which is the honest other answer. It records the
# decision, tells them we will take them out of the group, and says they
# can come back by requesting an invitation.
#
# And after the deadline: the people who never answered become tasks to
# remove from the WhatsApp group, by hand. Nobody is removed
# automatically, because the last thing you want is a machine cutting
# off a member who was on holiday.
#
# Two things worth knowing. The link is the whole security: anybody
# holding one can claim that place, which is the same trade every
# invitation email makes, and the list itself cannot be read by anyone
# but the Village's own admins. And a person who opens their link twice
# is told the place is already confirmed rather than being allowed to
# make a second account.
#
# Run the migration in Supabase first:
#   supabase/migrations/0038_founding_invites.sql
#
#   powershell -ExecutionPolicy Bypass -File .\104-re-enrolment.ps1

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
-- Bringing the people already in the WhatsApp group onto the platform.
--
-- These are not applications. Nobody is deciding whether to let them in;
-- they are already members. A row here is one person on the list, with
-- the details the Local Admin has, and a token that opens their own
-- re-enrolment page.

create type founding_invite_status as enum (
  'invited',      -- on the list, link not opened
  'reminded',     -- chased at least once
  're_enrolled',  -- they confirmed and have an account
  'declined',     -- they said it is not for them
  'removed'       -- past the deadline, taken out of the group
);

create table founding_invites (
  id           uuid primary key default gen_random_uuid(),
  village_id   uuid not null references villages(id) on delete cascade,
  full_name    text not null,
  phone        text,
  email        citext,
  token        text unique not null default encode(gen_random_bytes(16), 'hex'),
  status       founding_invite_status not null default 'invited',
  claimed_by   uuid references profiles(id) on delete set null,
  invited_at   timestamptz not null default now(),
  last_contact timestamptz,
  claimed_at   timestamptz,
  note         text,
  created_at   timestamptz not null default now()
);

create index founding_invites_village_idx on founding_invites(village_id, status);

-- When the Village stops waiting.
alter table villages
  add column if not exists reenrol_deadline date;

alter table founding_invites enable row level security;

-- The list belongs to the Village that holds it. Nobody else sees it,
-- and it is never public: the re-enrolment page itself is served with
-- the service key, by token, so a stranger cannot read the list even
-- with one valid link.
create policy founding_invites_read on founding_invites
  for select to authenticated
  using (is_global_admin() or is_local_admin(village_id));

create policy founding_invites_write on founding_invites
  for all to authenticated
  using (is_global_admin() or is_local_admin(village_id))
  with check (is_global_admin() or is_local_admin(village_id));

grant select, insert, update, delete on founding_invites to authenticated;

-- How a Village is doing at bringing its people across.
create or replace view founding_progress as
  select
    village_id,
    count(*) as on_the_list,
    count(*) filter (where status = 're_enrolled') as re_enrolled,
    count(*) filter (where status in ('invited', 'reminded')) as waiting,
    count(*) filter (where status = 'declined') as declined,
    count(*) filter (where status = 'removed') as removed
  from founding_invites
  group by village_id;

grant select on founding_progress to authenticated;
'@
Write-File "supabase\migrations\0038_founding_invites.sql" $f0

$f1 = @'
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReEnrolState = { error?: string };

// Reading an invitation by its token has to bypass the access rules,
// because the person holding the link has no account yet. Only the one
// row matching the token is ever read.
export async function inviteByToken(token: string) {
  const service = createAdminClient();
  const { data } = await service
    .from("founding_invites")
    .select("id, full_name, phone, email, status, village_id, villages(name, city)")
    .eq("token", token)
    .maybeSingle();
  return data;
}

export async function confirmPlace(
  _prev: ReEnrolState,
  formData: FormData
): Promise<ReEnrolState> {
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const again = String(formData.get("password2") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !fullName) return { error: "Your name and email are needed." };
  if (password.length < 8) {
    return { error: "A password of at least eight characters, please." };
  }
  if (password !== again) return { error: "The two passwords are not the same." };
  if (!formData.get("staying") || !formData.get("values")) {
    return { error: "Both boxes need ticking before you can continue." };
  }

  const service = createAdminClient();

  const { data: invite } = await service
    .from("founding_invites")
    .select("id, village_id, full_name, phone, status")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { error: "That link is not one of ours." };
  if (invite.status === "re_enrolled") {
    return { error: "This place has already been confirmed. Try signing in." };
  }

  // Their account. They set a password here rather than waiting for a
  // link, because they are being asked to do this once and be done.
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  let userId = created?.user?.id;

  if (createError) {
    const { data: list } = await service.auth.admin.listUsers();
    const existing = list?.users.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (!existing) return { error: createError.message };
    userId = existing.id;
    await service.auth.admin.updateUserById(existing.id, { password });
  }

  if (!userId) return { error: "The account could not be created." };

  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      email,
      phone: String(formData.get("phone") ?? "") || invite.phone,
      business_name: String(formData.get("business_name") ?? "") || null,
      village_id: invite.village_id,
      status: "onboarding",
      plan: "member",
      founding: true,
    },
    { onConflict: "id" }
  );

  if (profileError) return { error: profileError.message };

  await service
    .from("founding_invites")
    .update({
      status: "re_enrolled",
      claimed_by: userId,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  // Sign them in on this device, so they land in their own profile
  // rather than at a sign in page.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect("/welcome");
}

export async function notForMe(
  _prev: ReEnrolState,
  formData: FormData
): Promise<ReEnrolState> {
  const token = String(formData.get("token") ?? "");
  const service = createAdminClient();

  const { error } = await service
    .from("founding_invites")
    .update({ status: "declined", last_contact: new Date().toISOString() })
    .eq("token", token);

  if (error) return { error: "That did not save. Please try again." };
  redirect("/re-enrol/done");
}
'@
Write-File "app\re-enrol\actions.ts" $f1

$f2 = @'
"use client";

import { useActionState } from "react";
import { confirmPlace, notForMe, type ReEnrolState } from "./actions";
import { Ic } from "@/components/icon";

type Invite = {
  full_name: string;
  phone: string | null;
  email: string | null;
};

export function ReEnrolForm({
  token,
  invite,
  villageName,
  cityName,
}: {
  token: string;
  invite: Invite;
  villageName: string;
  cityName: string;
}) {
  const [state, action, pending] = useActionState<ReEnrolState, FormData>(
    confirmPlace,
    {}
  );
  const [, leave, leaving] = useActionState<ReEnrolState, FormData>(
    notForMe,
    {}
  );

  return (
    <>
      <form action={action} className="panel">
        {state.error ? <div className="flag hold">{state.error}</div> : null}

        <div className="flag ok" style={{ marginBottom: 16 }}>
          <Ic name="star" />
          <span>
            <b>Founding member.</b> Your founding member badge, and your Village
            membership at no cost, as for every member.
          </span>
        </div>

        <input type="hidden" name="token" value={token} />

        <div className="formgrid">
          <label className="field">
            <span>Full name</span>
            <input name="full_name" defaultValue={invite.full_name} required />
          </label>

          <label className="field">
            <span>Phone (WhatsApp)</span>
            <input name="phone" defaultValue={invite.phone ?? ""} />
            <span className="hint">
              From the WhatsApp group. Never shown publicly.
            </span>
          </label>

          <label className="field full">
            <span>Email</span>
            <input
              name="email"
              type="email"
              defaultValue={invite.email ?? ""}
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Currently based in</span>
            <input name="city" defaultValue={cityName} />
          </label>

          <label className="field">
            <span>Business name</span>
            <input name="business_name" />
          </label>

          <label className="field">
            <span>Create a password</span>
            <input name="password" type="password" required minLength={8} />
            <span className="hint">Eight characters or more.</span>
          </label>

          <label className="field">
            <span>Repeat the password</span>
            <input name="password2" type="password" required minLength={8} />
          </label>
        </div>

        <label className="check" style={{ marginTop: 14 }}>
          <input type="checkbox" name="staying" defaultChecked />
          <span>
            <b>
              I am still building my business and want to stay in the community
            </b>
          </span>
        </label>

        <label className="check">
          <input type="checkbox" name="values" defaultChecked />
          <span>
            <b>I agree to the community values, terms and privacy policy</b>
          </span>
        </label>

        <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Saving" : "Continue to my profile"}
          </button>
        </div>
      </form>

      <form action={leave} style={{ marginTop: 14 }}>
        <input type="hidden" name="token" value={token} />
        <button className="btn btn-ghost" type="submit" disabled={leaving}>
          {leaving ? "Saving" : "Not for me anymore"}
        </button>
        <p className="muted small" style={{ marginTop: 8 }}>
          No hard feelings, and no explanation needed. We will take you out of
          the {villageName} WhatsApp group.
        </p>
      </form>
    </>
  );
}
'@
Write-File "app\re-enrol\form.tsx" $f2

$f3 = @'
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public-page";
import { inviteByToken } from "../actions";
import { ReEnrolForm } from "../form";

export const metadata = { title: "Welcome back, ExpatPreneurs Global" };

export default async function ReEnrolPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await inviteByToken(token);

  if (!invite) notFound();

  const village = (invite.villages ?? {}) as { name?: string; city?: string };
  const firstName = invite.full_name.split(" ")[0];

  if (invite.status === "re_enrolled") {
    return (
      <PublicPage>
        <section className="pubsec">
          <div className="panel" style={{ maxWidth: 620 }}>
            <h1 style={{ fontSize: 22 }}>This place is already confirmed</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Somebody has been through this link already, which will have been
              you. Sign in and carry on.
            </p>
            <Link className="btn btn-primary" href="/login">
              Sign in
            </Link>
          </div>
        </section>
      </PublicPage>
    );
  }

  if (invite.status === "declined") {
    return (
      <PublicPage>
        <section className="pubsec">
          <div className="panel" style={{ maxWidth: 620 }}>
            <h1 style={{ fontSize: 22 }}>You have already told us</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              If you have changed your mind, request an invitation and your
              Local Admin will see it.
            </p>
            <Link className="btn btn-ghost" href="/apply">
              Request an invitation
            </Link>
          </div>
        </section>
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <section className="pubsec">
        <div style={{ maxWidth: 680 }}>
          <h1 style={{ fontSize: 26 }}>Welcome back, {firstName}</h1>
          <p className="intro">
            Confirm your details to keep your place in ExpatPreneurs{" "}
            {village.name ?? "your Village"}.
          </p>

          <div style={{ marginTop: 18 }}>
            <ReEnrolForm
              token={token}
              invite={{
                full_name: invite.full_name,
                phone: invite.phone,
                email: invite.email,
              }}
              villageName={village.name ?? "your Village"}
              cityName={village.city ?? ""}
            />
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
'@
Write-File "app\re-enrol\[token]\page.tsx" $f3

$f4 = @'
import Link from "next/link";
import { PublicPage } from "@/components/public-page";
import { Ic } from "@/components/icon";

export const metadata = { title: "Thank you, ExpatPreneurs Global" };

export default function ReEnrolDeclinedPage() {
  return (
    <PublicPage>
      <section className="pubsec">
        <div className="done">
          <span className="doneic">
            <Ic name="check" />
          </span>
          <h1>Thank you for being part of it</h1>
          <p>
            We will take you out of the WhatsApp group. If you ever want to come
            back, you can request an invitation and your Local Admin will see
            it.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
            <Link className="btn btn-primary" href="/">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
'@
Write-File "app\re-enrol\done\page.tsx" $f4

$f5 = @'
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";

export type ReEnrolAdminState = { error?: string; done?: string };

// The list usually arrives as a paste from WhatsApp or a spreadsheet:
// one person per line, name and then phone or email in any order.
export async function importList(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  const admin = await requireAdmin();
  const villageId =
    String(formData.get("village_id") ?? "") || admin.villageIds[0];
  if (!villageId) return { error: "Choose a Village first." };

  const raw = String(formData.get("people") ?? "").trim();
  if (!raw) return { error: "Nothing to add." };

  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const name = parts[0] ?? "";
      const email = parts.find((p) => p.includes("@")) ?? null;
      const phone =
        parts.find((p) => /^[+0-9][0-9 ()-]{6,}$/.test(p)) ?? null;
      return { village_id: villageId, full_name: name, email, phone };
    })
    .filter((r) => r.full_name);

  if (!rows.length) return { error: "No names were found in that." };

  const supabase = await createClient();
  const { error } = await supabase.from("founding_invites").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin/re-enrolment");
  return { done: `${rows.length} added` };
}

export async function remind(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase
    .from("founding_invites")
    .update({ status: "reminded", last_contact: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/re-enrolment");
  return { done: "reminded" };
}

export async function setDeadline(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  const admin = await requireAdmin();
  const villageId =
    String(formData.get("village_id") ?? "") || admin.villageIds[0];
  const date = String(formData.get("deadline") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("villages")
    .update({ reenrol_deadline: date })
    .eq("id", villageId);

  if (error) return { error: error.message };
  revalidatePath("/admin/re-enrolment");
  return { done: "deadline" };
}

// After the deadline, the people who did not answer become removal
// tasks rather than being removed by a machine.
export async function closeOut(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  const admin = await requireAdmin();
  const villageId =
    String(formData.get("village_id") ?? "") || admin.villageIds[0];

  const supabase = await createClient();
  const { error } = await supabase
    .from("founding_invites")
    .update({ status: "removed" })
    .eq("village_id", villageId)
    .in("status", ["invited", "reminded"]);

  if (error) return { error: error.message };
  revalidatePath("/admin/re-enrolment");
  return { done: "closed" };
}
'@
Write-File "app\admin\re-enrolment\actions.ts" $f5

$f6 = @'
"use client";

import { useActionState } from "react";
import {
  importList,
  remind,
  setDeadline,
  closeOut,
  type ReEnrolAdminState,
} from "./actions";

export function ImportForm({ villageId }: { villageId: string }) {
  const [state, action, pending] = useActionState<ReEnrolAdminState, FormData>(
    importList,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {state.done ? <div className="flag ok">{state.done}.</div> : null}
      <input type="hidden" name="village_id" value={villageId} />
      <label className="field">
        <span>Paste the list</span>
        <textarea
          name="people"
          rows={6}
          placeholder={"Karim Aziz, +971 55 222 1100\nLina Haddad, lina@example.com"}
        />
        <span className="hint">
          One person per line: the name first, then a phone number or an
          email, separated by a comma.
        </span>
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Adding" : "Add them to the list"}
      </button>
    </form>
  );
}

export function RemindButton({ id }: { id: string }) {
  const [, action, pending] = useActionState<ReEnrolAdminState, FormData>(
    remind,
    {}
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Saving" : "Mark reminded"}
      </button>
    </form>
  );
}

export function DeadlineForm({
  villageId,
  deadline,
}: {
  villageId: string;
  deadline: string | null;
}) {
  const [state, action, pending] = useActionState<ReEnrolAdminState, FormData>(
    setDeadline,
    {}
  );

  return (
    <form action={action} className="row" style={{ flexWrap: "wrap" }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="village_id" value={villageId} />
      <input type="date" name="deadline" defaultValue={deadline ?? ""} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Set the deadline"}
      </button>
    </form>
  );
}

export function CloseOutButton({ villageId }: { villageId: string }) {
  const [state, action, pending] = useActionState<ReEnrolAdminState, FormData>(
    closeOut,
    {}
  );

  return (
    <form action={action}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="village_id" value={villageId} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Saving" : "Create removal tasks"}
      </button>
    </form>
  );
}
'@
Write-File "app\admin\re-enrolment\forms.tsx" $f6

$f7 = @'
import { PageHead } from "@/components/workspace-shell";
import { Stat, Table, SecHead } from "@/components/admin-bits";
import { Av } from "@/components/bits";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { ImportForm, RemindButton, DeadlineForm, CloseOutButton } from "./forms";

export const metadata = { title: "Re-enrolment, Local Admin" };

const LABEL: Record<string, string> = {
  invited: "Invited, not yet",
  reminded: "Reminded",
  re_enrolled: "Re-enrolled",
  declined: "Stepping away",
  removed: "To remove",
};

export default async function ReEnrolmentPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const villageId = admin.villageIds[0] ?? null;

  const [{ data: village }, { data: people }] = await Promise.all([
    villageId
      ? supabase
          .from("villages")
          .select("id, name, reenrol_deadline")
          .eq("id", villageId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    villageId
      ? supabase
          .from("founding_invites")
          .select("id, full_name, email, phone, status, last_contact, token")
          .eq("village_id", villageId)
          .order("full_name")
      : Promise.resolve({ data: [] }),
  ]);

  const rows = people ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://expatpreneur.vercel.app";

  return (
    <>
      <PageHead
        title="Re-enrolment"
        sub={`Bringing the current ${village?.name ?? "Village"} WhatsApp members onto the platform.`}
      />

      <div className="g3 g4">
        <Stat label="On the list" value={rows.length} note="From the WhatsApp group" />
        <Stat label="Re-enrolled" value={count("re_enrolled")} note="They have an account" />
        <Stat
          label="Still waiting"
          value={count("invited") + count("reminded")}
          note="Invited, not yet through"
        />
        <Stat label="Stepping away" value={count("declined")} note="They told us" />
      </div>

      <div className="gside" style={{ marginTop: 22 }}>
        <div className="stack">
          <div className="panel">
            <SecHead title="The list" />
            {rows.length === 0 ? (
              <p className="muted small">
                Nobody on it yet. Paste the WhatsApp list beside this.
              </p>
            ) : (
              <Table head={["Member", "Status", "Last contact", "", ""]}>
                {rows.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <Av name={person.full_name} className="av-sm" />
                        <div>
                          <b>{person.full_name}</b>
                          <div className="muted small">
                            {person.email ?? person.phone ?? "No contact yet"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`chip ${
                          person.status === "re_enrolled"
                            ? "chip-mint"
                            : person.status === "declined" || person.status === "removed"
                              ? ""
                              : "chip-sun"
                        }`}
                      >
                        {LABEL[person.status] ?? person.status}
                      </span>
                    </td>
                    <td className="hide-m">
                      {person.last_contact ? timeAgo(person.last_contact) : "Not yet"}
                    </td>
                    <td>
                      {person.status === "re_enrolled" ? null : (
                        <RemindButton id={person.id} />
                      )}
                    </td>
                    <td>
                      {person.status === "re_enrolled" ? null : (
                        <span className="muted small" style={{ wordBreak: "break-all" }}>
                          {site}/re-enrol/{person.token}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </div>

          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>After the deadline</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              People who did not re-enrol become tasks to remove from the
              WhatsApp group. Nobody is removed automatically, because the
              last thing you want is a machine cutting off a member who was
              simply on holiday.
            </p>
            {villageId ? <CloseOutButton villageId={villageId} /> : null}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 style={{ fontSize: 14 }}>Add people</h3>
            {villageId ? <ImportForm villageId={villageId} /> : null}
          </div>

          <div className="panel">
            <h3 style={{ fontSize: 14 }}>Deadline</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              {village?.reenrol_deadline
                ? `Currently ${new Date(village.reenrol_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
                : "None set."}
            </p>
            {villageId ? (
              <DeadlineForm
                villageId={villageId}
                deadline={village?.reenrol_deadline ?? null}
              />
            ) : null}
          </div>

          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>How the link works</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Each person has their own address. Send it by WhatsApp or email.
              It opens a page with their details already filled in, where they
              confirm, set a password and keep their founding member badge, or
              say it is not for them.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
'@
Write-File "app\admin\re-enrolment\page.tsx" $f7

$f8 = @'
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
Write-File "components\spaces.ts" $f8

git add app supabase components
git commit -m "Re-enrolment: bringing the existing WhatsApp members onto the platform"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Run 0038_founding_invites.sql in Supabase."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
