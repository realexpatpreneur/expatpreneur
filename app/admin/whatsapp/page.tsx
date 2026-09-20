import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { TaskDone } from "../members/forms";

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
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids)
    : { data: [] };

  const open = rows.filter((t) => !t.done_at);
  const doneRows = rows.filter((t) => t.done_at).slice(0, 20);

  const label: Record<string, string> = {
    add: "Add to",
    remove: "Remove from",
    move: "Move to",
  };

  return (
    <main className="wrap">
      <section className="band">
        <h1>WhatsApp sync</h1>
        <p className="lead">
          The platform cannot add anyone to a group, so it keeps the list of
          what needs doing by hand.
        </p>
        <p>
          <span className="chip blue">{open.length} to do</span>
        </p>
      </section>

      <section className="band">
        {open.length === 0 ? (
          <div className="panel wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing waiting. The groups match the platform.
            </p>
          </div>
        ) : (
          <div className="rows">
            {open.map((task) => {
              const person = people?.find((p) => p.id === task.profile_id);
              return (
                <div className="rowlink" key={task.id}>
                  <div>
                    <b>
                      {label[task.kind] ?? task.kind} {task.group_name}
                    </b>
                    <div className="muted small">
                      {person?.full_name ?? "A member"}
                      {person?.phone ? `. ${person.phone}` : ". No phone on file"}.{" "}
                      {timeAgo(task.created_at)}.
                    </div>
                  </div>
                  <div className="rowmeta">
                    <TaskDone taskId={task.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {doneRows.length ? (
        <section className="band">
          <h2>Done recently</h2>
          <div className="rows">
            {doneRows.map((task) => (
              <div className="rowlink" key={task.id}>
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
    </main>
  );
}