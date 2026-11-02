import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUSES_IN_PLACE } from "@/lib/member";

export type AdminContext = {
  userId: string;
  fullName: string;
  isGlobal: boolean;
  villageIds: string[];
  homeVillageId: string | null;
};

// Everything in /admin goes through here. Local Admins hold their own
// Villages, the Global team holds all of them.
export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/applications");

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, village_id, status")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("member_roles")
      .select("role, scope, scope_id")
      .eq("profile_id", user.id)
      .is("ended_at", null),
  ]);

  // Still here. This asked only about roles before, so an admin whose
  // profile had been marked left or removed kept both workspaces and
  // everything in them, including every member record in the network.
  // The role row says what they may do; the status says whether they
  // are anybody at all, and that has to come first.
  //
  // The role is not touched. An admin put back to active has their
  // workspaces back with it.
  if (!profile || !STATUSES_IN_PLACE.includes(profile.status)) redirect("/home");

  const isGlobal = (roles ?? []).some((r) => r.role === "global_admin");
  const localVillages = (roles ?? [])
    .filter((r) => r.role === "local_admin" && r.scope === "village")
    .map((r) => r.scope_id as string);

  if (!isGlobal && localVillages.length === 0) redirect("/home");

  let villageIds = localVillages;
  if (isGlobal) {
    const { data: all } = await supabase.from("villages").select("id");
    villageIds = (all ?? []).map((v) => v.id);
  }

  return {
    userId: user.id,
    fullName: profile?.full_name ?? "",
    isGlobal,
    villageIds,
    homeVillageId: profile?.village_id ?? null,
  };
}

// The internal balance rule: no Village above 30 percent of one
// nationality. Never shown on a public page or written to a member.
export const NATIONALITY_LIMIT = 0.3;

export function nationalityMix(rows: { nationalities: string[] | null }[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const nat of row.nationalities ?? []) {
      counts.set(nat, (counts.get(nat) ?? 0) + 1);
    }
  }
  return counts;
}

// Pages in /global are for the Global team only.
export async function requireGlobal(): Promise<AdminContext> {
  const admin = await requireAdmin();
  if (!admin.isGlobal) redirect("/admin/applications");
  return admin;
}