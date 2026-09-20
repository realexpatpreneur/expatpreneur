import { createClient } from "@/lib/supabase/server";
import { WorkspaceShell, type NavGroup } from "./workspace-shell";

// The rail is the workspaces this person can actually open, so nobody
// sees a door they cannot walk through.
async function railFor(userId: string | null) {
  const rail: [string, string, string][] = [["/home", "EP", "Member space"]];
  if (!userId) return rail;

  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("member_roles")
    .select("role")
    .eq("profile_id", userId)
    .is("ended_at", null);

  const has = (role: string) => (roles ?? []).some((r) => r.role === role);

  if (has("circle_host") || has("industry_lead") || has("pod_lead")) {
    rail.push(["/lead", "LD", "What you run"]);
  }
  if (has("educator")) rail.push(["/educator", "ED", "Your teaching"]);
  if (has("local_admin") || has("global_admin")) {
    rail.push(["/admin", "LA", "Local Admin"]);
  }
  if (has("global_admin")) rail.push(["/global", "GT", "The Global team"]);

  return rail;
}

export async function WorkspaceNav({
  title,
  subtitle,
  groups,
}: {
  title: string;
  subtitle?: string;
  groups: NavGroup[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <WorkspaceShell
      rail={await railFor(user?.id ?? null)}
      groups={groups}
      title={title}
      subtitle={subtitle}
    />
  );
}