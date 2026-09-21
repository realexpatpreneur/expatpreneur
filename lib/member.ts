import { cache } from "react";
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

// Who is signed in. Asked once per page, however many times the page,
// the header and the workspace shell each want to know: without this,
// one page render made three or four round trips to the auth server
// before a single row of content was fetched.
export const currentUser = cache(async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Their profile, with the name of their Village, fetched once and shared
// the same way. Returns null for a visitor, or for somebody still in the
// welcome flow.
export const currentMember = cache(async function currentMember(): Promise<
  (Member & { onboarding: boolean }) | null
> {
  const user = await currentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, status, plan, village_id, circle_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const { data: village } = profile.village_id
    ? await supabase
        .from("villages")
        .select("name")
        .eq("id", profile.village_id)
        .maybeSingle()
    : { data: null };

  return {
    ...profile,
    villageName: village?.name ?? null,
    onboarding: profile.status === "onboarding",
  };
});

// Every member page starts here: signed in, profile present, and past
// the welcome flow.
export async function requireMember(next: string): Promise<Member> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${next}`);

  const member = await currentMember();
  if (!member) redirect("/home");
  if (member.onboarding) redirect("/welcome");

  return member;
}

// For the pages the public can also open. Returns null rather than
// redirecting, so the page can decide what a stranger is shown.
export async function whoIsHere(): Promise<Member | null> {
  const member = await currentMember();
  if (!member || member.onboarding) return null;
  return member;
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