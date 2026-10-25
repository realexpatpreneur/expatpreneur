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
  avatar_url: string | null;
  // Membership given rather than paid for: a volunteer role carries it,
  // or it was given by hand, which is what the people already in a
  // Village get at launch.
  complimentary?: boolean;
};

// The roles her framework gives membership to, in one place. Two pages
// were working this out separately and had already drifted apart, which
// is how a Local Admin could hold the access and not be shown as
// holding it.
export const ROLES_THAT_CARRY_MEMBERSHIP = [
  "global_admin",
  "local_admin",
  "pod_lead",
  "industry_lead",
];

// Membership without paying comes from two places, and a page has to
// agree with the database about both or it will lock a door the data
// leaves open.
export async function roleCarriesMembership(profileId: string) {
  const supabase = await createClient();
  const { data: roles } = await supabase
    .from("member_roles")
    .select("role")
    .eq("profile_id", profileId)
    .is("ended_at", null);

  return (roles ?? []).some((r) =>
    ROLES_THAT_CARRY_MEMBERSHIP.includes(r.role)
  );
}

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
  (Member & { onboarding: boolean; invited: boolean }) | null
> {
  const user = await currentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, status, plan, village_id, circle_id, avatar_url, complimentary"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const byRole = await roleCarriesMembership(user.id);

  const { data: village } = profile.village_id
    ? await supabase
        .from("villages")
        .select("name")
        .eq("id", profile.village_id)
        .maybeSingle()
    : { data: null };

  return {
    ...profile,
    complimentary: Boolean(profile.complimentary) || byRole,
    villageName: village?.name ?? null,
    onboarding: profile.status === "onboarding",
    // Approved and signed in, but membership has not been paid for yet.
    // is_member() already leaves this status out, so the database says
    // no to the private side on its own.
    invited: profile.status === "invited",
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
  if (member.invited) redirect("/welcome");

  return member;
}

// For the few pages somebody has to reach before their membership is
// live: the welcome flow and the checkout. An account and a profile,
// nothing more. Every other page uses requireMember.
export async function requireAccount(
  next: string
): Promise<Member & { onboarding: boolean; invited: boolean }> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${next}`);

  const member = await currentMember();
  if (!member) redirect("/home");

  return member;
}

// For the pages the public can also open. Returns null rather than
// redirecting, so the page can decide what a stranger is shown.
export async function whoIsHere(): Promise<Member | null> {
  const member = await currentMember();
  if (!member || member.onboarding || member.invited) return null;
  return member;
}

// What the private side opens for, matching is_paid() in the database.
export const isPaid = (member: Member) =>
  member.plan === "paid" || Boolean(member.complimentary);

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}