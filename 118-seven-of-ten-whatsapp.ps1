# 118-seven-of-ten-whatsapp.ps1
# Seven of ten. No migration.
#
# WhatsApp does not let any platform add somebody to a group. Not ours,
# not anybody's. That is WhatsApp's rule, and anything claiming
# otherwise is either an unofficial tool that gets numbers banned or the
# Business API, which is a different thing and does not do groups
# either. So the manual path is not a shortcut we took; it is the only
# path, and it had better be good.
#
# It was not, quite. The page told a Local Admin what to do and then
# made them copy a number, open WhatsApp and go looking for the group.
# Each row now carries a button that opens a chat with that person and a
# button that opens the group itself, so the whole thing is: open, add,
# come back, tick.
#
# It also now says when something is going wrong rather than only what
# is outstanding. Anybody waiting more than three days, which means a
# member who joined and has heard nothing. And anybody with no phone
# number on file, who cannot be added at all, with a link to their
# member page to go and ask.
#
# supabase/setup/whatsapp-decision.md is the decision itself, with what
# the Business API would and would not give you. The short version: it
# would let you send re-enrolment links and reminders as WhatsApp
# messages, which is worth a lot because your members live there and
# many will never open an email. It would do nothing for groups. It
# needs a verified Meta business, a provider, a number and approved
# templates, which is weeks of paperwork.
#
# My suggestion is in the document: stay by hand for launch, revisit
# when the second Village opens, and when you do, do it for messages
# rather than for groups.
#
#   powershell -ExecutionPolicy Bypass -File .\118-seven-of-ten-whatsapp.ps1

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
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import Link from "next/link";
import { TaskDone } from "../members/forms";
import { PageHead } from "@/components/workspace-shell";
import { Stat } from "@/components/admin-bits";
import { Ic } from "@/components/icon";

export const metadata = { title: "WhatsApp sync, Admin" };

export default async function WhatsappTasksPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("whatsapp_tasks")
    .select("id, kind, group_name, profile_id, done_at, created_at, village_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (tasks ?? []).filter(
    (t) => admin.isGlobal || !t.village_id || admin.villageIds.includes(t.village_id)
  );

  const ids = [...new Set(rows.map((t) => t.profile_id).filter(Boolean))] as string[];
  const { data: people } = ids.length
    ? await supabase.from("member_records").select("id, full_name, phone").in("id", ids)
    : { data: [] };

  // The group's own link, so the admin goes straight there rather than
  // scrolling WhatsApp looking for it.
  const { data: circles } = await supabase
    .from("circles")
    .select("name, whatsapp_url");

  const groupLink = (name: string) =>
    circles?.find((c) => c.name === name)?.whatsapp_url ?? null;

  // A number WhatsApp will accept: digits only, no spaces or brackets.
  const waNumber = (phone: string | null) =>
    phone ? phone.replace(/[^0-9]/g, "") : null;

  const open = rows.filter((t) => !t.done_at);
  const doneRows = rows.filter((t) => t.done_at).slice(0, 20);

  // Anything sitting for three days is a member who has joined and
  // heard nothing since.
  const stale = open.filter(
    (t) => Date.now() - new Date(t.created_at).getTime() > 3 * 86400000
  );
  const noPhone = open.filter((t) => {
    const person = people?.find((p) => p.id === t.profile_id);
    return !person?.phone;
  });

  const label: Record<string, string> = {
    add: "Add to",
    remove: "Remove from",
    move: "Move to",
  };

  return (
    <>
      <PageHead
        title="WhatsApp sync"
        sub="The platform cannot add anybody to a group, so it keeps the list of what needs doing by hand."
      />

      <div className="g3 g4">
        <Stat label="To do" value={open.length} note="Waiting on somebody" />
        <Stat
          label="Waiting three days"
          value={stale.length}
          note="They joined and have heard nothing"
        />
        <Stat
          label="No phone on file"
          value={noPhone.length}
          note="Cannot be added until they give one"
        />
        <Stat label="Done" value={doneRows.length} note="Recently" />
      </div>

      <section className="sec">
        {open.length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing waiting. The groups match the platform.
            </p>
          </div>
        ) : (
          <div className="divide">
            {open.map((task) => {
              const person = people?.find((p) => p.id === task.profile_id);
              return (
                <div className="li linkrow" key={task.id}>
                  <div>
                    <b>
                      {label[task.kind] ?? task.kind} {task.group_name}
                    </b>
                    <div className="muted small">
                      {person?.full_name ?? "A member"}
                      {person?.phone ? `. ${person.phone}` : ""}.{" "}
                      {timeAgo(task.created_at)}.
                    </div>
                    {person && !person.phone ? (
                      <div className="flag hold" style={{ marginTop: 8 }}>
                        <Ic name="info" />
                        <span>
                          No phone on file, so they cannot be added. Ask them
                          for one on their{" "}
                          <Link href={`/admin/members/${person.id}`}>
                            member page
                          </Link>
                          .
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="rowmeta" style={{ gap: 8, flexWrap: "wrap" }}>
                    {waNumber(person?.phone ?? null) ? (
                      <a
                        className="btn btn-ghost btn-sm"
                        href={`https://wa.me/${waNumber(person?.phone ?? null)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Message them
                      </a>
                    ) : null}
                    {groupLink(task.group_name) ? (
                      <a
                        className="btn btn-ghost btn-sm"
                        href={groupLink(task.group_name) as string}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open the group
                      </a>
                    ) : null}
                    <TaskDone taskId={task.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {doneRows.length ? (
        <section className="sec">
          <h2>Done recently</h2>
          <div className="divide">
            {doneRows.map((task) => (
              <div className="li linkrow" key={task.id}>
                <div>
                  <b>
                    {label[task.kind] ?? task.kind} {task.group_name}
                  </b>
                  <div className="muted small">
                    {people?.find((p) => p.id === task.profile_id)?.full_name ??
                      "A member"}
                    . {timeAgo(task.done_at as string)}.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="sec">
        <div className="panel panel-wash">
          <h3 style={{ fontSize: 14 }}>How this is meant to go</h3>
          <p className="muted small" style={{ marginTop: 6 }}>
            Open the group, add the number, come back and tick it off. The
            member has already been told by email which Circle they are in and
            that the group takes a day, so nobody is waiting in silence while
            you work through this.
          </p>
          <p className="muted small" style={{ marginTop: 8 }}>
            WhatsApp does not let any platform add somebody to a group, ours
            included. Anything claiming otherwise is either using an
            unofficial tool that gets numbers banned, or the Business API,
            which is a different thing and a paid one.
          </p>
        </div>
      </section>
    </>
  );
}
'@
Write-File "app\admin\whatsapp\page.tsx" $f0

$f1 = @'
# WhatsApp: the decision to make

WhatsApp does not let any platform add somebody to a group. Not ours,
not anybody's. That is a rule of WhatsApp, not a gap in the build, and
anything claiming otherwise is either an unofficial tool that gets phone
numbers banned or the Business API, which is a different thing.

So there are two honest options.

## What is built today: by hand, with the list kept for you

A Local Admin opens WhatsApp sync and sees every person waiting to be
added, moved or removed, with the number, a button that opens a chat
with them, and a button that opens the group. They add the person, come
back and tick it off.

The member is not left in silence while this happens. They are told by
email which Circle they are in and that the group takes a day or so, so
the delay is expected rather than alarming.

The page now also says what is going wrong when something is: anybody
waiting more than three days, and anybody with no phone number on file,
who cannot be added at all until they give one.

What this costs: a few minutes per new member, done by whoever runs the
Village. At 73 members joining over a few weeks, that is an evening's
work spread thin. At 500 members across five Villages it is a real job.

## The other option: the WhatsApp Business API

This is a Meta product. It would let the platform send messages to
people directly, and it is how a business sends you a delivery update.

What it would actually give you:

- Sending the re-enrolment links, the Circle placement and the event
  reminders as WhatsApp messages rather than emails. This is the real
  prize, because your members live in WhatsApp and many will never open
  an email.
- Nothing for groups. Even with the Business API, adding somebody to an
  ordinary group is not possible. Meta's answer is Communities and
  Channels, which are broadcast, not the conversation your Circles have.

What it costs: a Meta Business account with a verified business, a
provider such as Twilio or 360dialog, a phone number that becomes the
community's number, message templates approved by Meta before you may
send them, and a per-message fee. Weeks of setup, not hours, and most
of it is paperwork rather than code.

## What I would suggest

Stay by hand for launch. The manual path works, it is built, and with
73 people it is manageable. Revisit the Business API when the second
Village opens, and when you do, do it for messages rather than for
groups, because groups will still be by hand either way.

If you decide you want it, tell me and I will scope it properly. It is
a few days of work on our side once the Meta side exists, and almost
none of it can start before then.
'@
Write-File "supabase\setup\whatsapp-decision.md" $f1

git add app/admin/whatsapp supabase/setup/whatsapp-decision.md
git commit -m "Make the WhatsApp list something you can work from, and write up the choice"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
