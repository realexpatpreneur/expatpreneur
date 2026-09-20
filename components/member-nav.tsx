import { createClient } from "@/lib/supabase/server";
import { WorkspaceNav } from "./workspace-nav";

// The member space's own side navigation, in the prototype's order.
export async function MemberNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("member_records")
    .select("full_name, circle_id, village_id")
    .eq("id", user.id)
    .maybeSingle();

  const { data: village } = profile?.village_id
    ? await supabase
        .from("villages")
        .select("name")
        .eq("id", profile.village_id)
        .maybeSingle()
    : { data: null };

  const groups = [
    {
      links: [
        ["/home", "Home"],
        ["/my-village", "My Village"],
        ["/directory", "Directory"],
        ["/events", "Events"],
        ["/messages", "Messages"],
        ["/for-you", "For you"],
      ] as [string, string][],
    },
    {
      heading: "Where you belong",
      links: [
        ...(profile?.circle_id
          ? ([[`/circles/${profile.circle_id}`, "Your Circle"]] as [string, string][])
          : []),
        ["/groups", "Industry Groups"],
        ["/pods", "Pods"],
        ["/network", "The Global network"],
      ] as [string, string][],
    },
    {
      heading: "What is here",
      links: [
        ["/markets", "Explore markets"],
        ["/market-exploration", "Market Exploration"],
        ["/businesses", "Businesses"],
        ["/jobs", "Jobs and freelance"],
        ["/learning", "Learning"],
        ["/library", "Resources"],
        ["/media", "Media"],
        ["/watch", "Watch and Listen"],
      ] as [string, string][],
    },
    {
      heading: "You",
      links: [
        ["/settings", "Settings"],
        ["/notifications", "Notifications"],
        ["/more", "More"],
      ] as [string, string][],
    },
  ];

  return (
    <WorkspaceNav
      title={profile?.full_name?.split(" ")[0] ?? "You"}
      subtitle={village?.name ? `${village.name} Village` : "ExpatPreneurs"}
      groups={groups}
    />
  );
}