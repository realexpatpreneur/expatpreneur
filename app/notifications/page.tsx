import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";

export const metadata = { title: "Notifications, ExpatPreneurs Global" };

export default async function NotificationsPage() {
  const member = await requireMember("/notifications");
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at")
    .eq("profile_id", member.id)
    .order("created_at", { ascending: false })
    .limit(50);

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", member.id)
    .is("read_at", null);

  return (
    <WorkspaceShell kind="member" nav="/notifications">
        <section className="sec">
          <h1>Notifications</h1>
          <p className="lead">
            Replies, messages, requests and what your Village is doing.
          </p>
        </section>

        <section className="sec">
          {(notifications ?? []).length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing yet.
              </p>
            </div>
          ) : (
            <div className="divide">
              {(notifications ?? []).map((item) => {
                const inner = (
                  <div>
                    <b>{item.title}</b>
                    {item.body ? (
                      <div className="muted small">{item.body}</div>
                    ) : null}
                    <div className="muted small">{timeAgo(item.created_at)}</div>
                  </div>
                );
                return item.link ? (
                  <Link className="li linkrow" key={item.id} href={item.link}>
                    {inner}
                    {!item.read_at ? (
                      <div className="rowmeta">
                        <span className="chip chip-blue">New</span>
                      </div>
                    ) : null}
                  </Link>
                ) : (
                  <div className="li linkrow" key={item.id}>
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </WorkspaceShell>
  );
}