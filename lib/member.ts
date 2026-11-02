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

  // The two lookups that follow the profile are independent, so they go
  // together rather than one after the other.
  const [byRole, { data: village }] = await Promise.all([
    roleCarriesMembership(user.id),
    profile.village_id
      ? supabase
          .from("villages")
          .select("name")
          .eq("id", profile.village_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

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

// Every member page starts here: signed in, profile present, past the
// welcome flow, and paid for.
//
// The last of those is new. Membership is paid, with free access handed
// out by the Global team and nobody else, so somebody who has not paid
// reaches their own profile, their settings and the checkout and nothing
// else. is_paid() in the database already closed the content itself,
// which is why an unpaid member used to get a member home with empty
// shelves rather than an explanation. One function says no now, the way
// 0067 made one function in the database decide the same thing, so all
// fifty six pages behind this follow without being touched.
//
// The pages somebody has to reach before their membership is live use
// requireAccount instead: /welcome, /settings, /upgrade and /renew. Sign
// out lives on /settings, so it stays within reach.
export async function requireMember(next: string): Promise<Member> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${next}`);

  const member = await currentMember();
  if (!member) redirect("/home");
  if (member.onboarding) redirect("/welcome");
  if (member.invited) redirect("/welcome");
  // Left or removed. Not a lapsed member, so not the checkout: paying
  // would not let them back in, because only an admin can put the status
  // back. Settings says where they stand and holds sign out.
  if (hasLeft(member)) redirect("/settings?show=membership");
  // Lapsed, or complimentary access that was taken back. /upgrade is the
  // page that says what is waiting and takes them to the checkout.
  if (!isPaid(member)) redirect("/upgrade");

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
//
// Unpaid counts as a stranger here, which it has to, or the twelve pages
// behind this would be the one way round the gate: a lapsed member would
// keep the member view of the Directory, Learning, Businesses and the
// rest while every other page turned them away. Invited already came
// back null, so this only makes a lapsed member behave like an invited
// one, which is what the product asks for.
export async function whoIsHere(): Promise<Member | null> {
  const member = await currentMember();
  if (!member || member.onboarding || member.invited) return null;
  if (!isPaid(member)) return null;
  return member;
}

// The statuses the database counts as being here. is_member(),
// is_paid() and is_paid_row() all ask for exactly these three, and
// anything else is invited, left or removed.
export const STATUSES_IN_PLACE = ["onboarding", "active", "quiet"];

// Marked left or removed by an admin. Worth its own name because it is
// not the same as unpaid: there is nothing for these people to buy, so
// they are never sent to the checkout.
export const hasLeft = (member: Member) =>
  member.status === "left" || member.status === "removed";

// What the private side opens for, matching is_paid() in the database.
//
// The status half of that match was missing here from the start. The
// database has always asked for it, so somebody marked left kept every
// page the shell draws while every query behind those pages answered
// nothing: a workspace with the rail, the sidebar and the workspace
// switcher in it, and no content anywhere. The gate said yes and the
// data said no, which is the worst way round for the two to disagree.
export const isPaid = (member: Member) =>
  STATUSES_IN_PLACE.includes(member.status) &&
  (member.plan === "paid" || Boolean(member.complimentary));

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
// The roles the signed-in person holds now, fetched once per page. The
// workspace menu uses it to offer only the workspaces they can open.
export const currentRoles = cache(async function currentRoles(): Promise<string[]> {
  const user = await currentUser();
  if (!user) return [];
  const supabase = await createClient();
  // Somebody marked left or removed holds no roles as far as the site
  // is concerned, whatever member_roles still says. Ending the role is
  // the admin's job and the row is left alone here, so putting the
  // status back hands the workspaces straight back.
  //
  // Without this, a Global Admin who was marked left was still shown
  // Educator, Local Admin and Global team in the workspace switcher,
  // because the switcher asked about roles and nothing asked whether
  // they were still here.
  const member = await currentMember();
  if (!member || !STATUSES_IN_PLACE.includes(member.status)) return [];

  const { data } = await supabase
    .from("member_roles")
    .select("role")
    .eq("profile_id", user.id)
    .is("ended_at", null);
  return (data ?? []).map((r) => r.role as string);
});

// Which workspaces those roles open, by the same rules the More page and
// the workspace guards use.
export function workspacesFor(roles: string[]): string[] {
  const has = (role: string) => roles.includes(role);
  const out = ["member"];
  if (has("circle_host") || has("industry_lead") || has("pod_lead")) out.push("lead");
  if (has("educator") || has("global_admin")) out.push("edu");
  if (has("local_admin") || has("global_admin")) out.push("admin");
  if (has("global_admin")) out.push("global");
  return out;
}
