"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProposalState = { error?: string };

// A Pod starts because a member wants one, not because the Global team
// thought of it. They still approve it, so a Pod has somebody behind it.
export async function proposePod(
  _prev: ProposalState,
  formData: FormData
): Promise<ProposalState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pods/propose");

  const name = String(formData.get("name") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  if (!name || !purpose) {
    return { error: "A name and what it is for are both needed." };
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("village_id")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("pod_proposals").insert({
    proposer_id: user.id,
    village_id: me?.village_id ?? null,
    name,
    purpose,
    cadence: String(formData.get("cadence") ?? "monthly"),
    ends_on: String(formData.get("ends_on") ?? "") || null,
  });

  if (error) return { error: "That did not send. Try again in a moment." };

  redirect("/pods?proposed=1");
}