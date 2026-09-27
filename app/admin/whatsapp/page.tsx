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