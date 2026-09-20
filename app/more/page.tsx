import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { MenuList } from "@/components/menu-list";
import { signOut } from "@/app/settings/actions";

export const metadata = { title: "More, ExpatPreneurs Global" };

export default async function MemberMorePage() {
  const member = await requireMember("/more");
  const supabase = await createClient();

  // A member who runs something sees the way into their workspace here,
  // which on a phone is the only place it fits.
  const { data: roles } = await supabase
    .from("member_roles")
    .select("role")
    .eq("profile_id", member.id)
    .is("ended_at", null);

  const has = (role: string) => (roles ?? []).some((r) => r.role === role);
  const isAdmin = has("local_admin") || has("global_admin");
  const leads =
    has("circle_host") || has("industry_lead") || has("pod_lead");

  return (
    <WorkspaceShell kind="member" nav="/more">
        <section className="sec">
          <h1>More</h1>
        </section>

        <section className="sec">
          <MenuList
            items={[
              ["/search", "Search"],
              ["/library", "Resources"],
              ["/directory", "Directory"],
              ["/for-you", "For you"],
              ["/markets", "Explore markets"],
              ["/market-exploration", "Market Exploration"],
              ["/jobs", "Jobs and freelance"],
              ["/businesses", "Businesses"],
              ["/learning", "Learning"],
              ["/media", "Media"],
              ["/watch", "Watch and Listen"],
              ["/photos", "Photographs"],
              ...(member.circle_id
                ? ([[`/circles/${member.circle_id}`, "Your Circle"]] as [string, string][])
                : []),
              ["/groups", "Industry Groups"],
              ["/pods", "Pods"],
              ["/network", "The Global network"],
              [`/members/${member.id}`, "My profile"],
              ["/settings", "Settings"],
              ["/notifications", "Notifications"],
              ...(leads ? ([["/lead", "What you run"]] as [string, string][]) : []),
              ...(has("educator")
                ? ([["/educator", "Your teaching"]] as [string, string][])
                : []),
              ...(isAdmin
                ? ([["/admin", "Admin workspace"]] as [string, string][])
                : []),
              ...(has("global_admin")
                ? ([["/global", "The Global team"]] as [string, string][])
                : []),
            ]}
          />

          <form action={signOut} style={{ marginTop: 18 }}>
            <button className="btn btn-ghost" type="submit">
              Log out
            </button>
          </form>
        </section>
      </WorkspaceShell>
  );
}