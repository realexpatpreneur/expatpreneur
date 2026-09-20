import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";

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
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>Notifications</h1>
          <p className="lead">
            Replies, messages, requests and what your Village is doing.
          </p>
        </section>

        <section className="band">
          {(notifications ?? []).length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing yet.
              </p>
            </div>
          ) : (
            <div className="rows">
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
                  <Link className="rowlink" key={item.id} href={item.link}>
                    {inner}
                    {!item.read_at ? (
                      <div className="rowmeta">
                        <span className="chip blue">New</span>
                      </div>
                    ) : null}
                  </Link>
                ) : (
                  <div className="rowlink" key={item.id}>
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}