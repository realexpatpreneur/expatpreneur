import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";
import { WorkspaceShell } from "@/components/workspace-shell";
import { VillageHead } from "@/components/village-space";

export const metadata = { title: "Announcements, ExpatPreneurs Global" };

export default async function VillageAnnouncementsPage() {
  const member = await requireMember("/my-village/announcements");
  const supabase = await createClient();

  const { data: posts } = member.village_id
    ? await supabase
        .from("announcements")
        .select("id, title, body, sent_at, author_id")
        .eq("village_id", member.village_id)
        .not("sent_at", "is", null)
        .order("sent_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const ids = [...new Set((posts ?? []).map((p) => p.author_id).filter(Boolean))] as string[];
  const { data: authors } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };

  return (
    <WorkspaceShell kind="member">
      <VillageHead here="/my-village/announcements" />

      <div className="stack" style={{ marginTop: 16 }}>
        {posts && posts.length ? (
          posts.map((p) => (
            <div className="panel" key={p.id}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 14 }}>{p.title}</h3>
                <span className="muted small">{timeAgo(p.sent_at as string)}</span>
              </div>
              <p className="muted" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                {p.body}
              </p>
              <p className="small" style={{ marginTop: 8 }}>
                {authors?.find((a) => a.id === p.author_id)?.full_name ?? "Your Local Admin"}
                , Local Admin
              </p>
            </div>
          ))
        ) : (
          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>Nothing announced yet</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              When your Local Admins post something for the whole Village, it
              appears here and on your home page.
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <Link className="btn btn-ghost" href="/events">
          Go to events
        </Link>
      </div>
    </WorkspaceShell>
  );
}