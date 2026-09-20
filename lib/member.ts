import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  id: string;
  full_name: string;
  status: string;
  plan: string;
  village_id: string | null;
  circle_id: string | null;
  villageName: string | null;
};

// Every member page starts here: signed in, profile present, and past
// the welcome flow.
export async function requireMember(next: string): Promise<Member> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${next}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, status, plan, village_id, circle_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/home");
  if (profile.status === "onboarding") redirect("/welcome");

  const { data: village } = profile.village_id
    ? await supabase
        .from("villages")
        .select("name")
        .eq("id", profile.village_id)
        .maybeSingle()
    : { data: null };

  return { ...profile, villageName: village?.name ?? null };
}

// For the pages the public can also open. Returns null rather than
// redirecting, so the page can decide what a stranger is shown.
export async function whoIsHere(): Promise<Member | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, status, plan, village_id, circle_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status === "onboarding") return null;

  const { data: village } = profile.village_id
    ? await supabase
        .from("villages")
        .select("name")
        .eq("id", profile.village_id)
        .maybeSingle()
    : { data: null };

  return { ...profile, villageName: village?.name ?? null };
}

export const isPaid = (member: Member) => member.plan === "paid";

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}