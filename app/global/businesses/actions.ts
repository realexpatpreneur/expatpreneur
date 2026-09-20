"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { notify } from "@/lib/notify";
import { record } from "@/lib/audit";

export type ListingState = { error?: string };

// Taking a listing down. The owner keeps it and is told why, because a
// listing that vanishes without explanation costs you a member.
export async function hideListing(
  _prev: ListingState,
  formData: FormData
): Promise<ListingState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const id = String(formData.get("business_id"));
  const hide = formData.get("hide") === "1";
  const reason = String(formData.get("reason") ?? "").trim() || null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (!business) return { error: "That listing is not there any more." };

  const { error } = await supabase
    .from("businesses")
    .update({ hidden: hide, hidden_reason: hide ? reason : null })
    .eq("id", id);

  if (error) return { error: error.message };

  await notify(
    business.owner_id,
    "member",
    hide ? `${business.name} has been taken down` : `${business.name} is back up`,
    hide
      ? reason ?? "Write to the Global team if you think this is wrong."
      : "It is listed again.",
    "/businesses?show=mine"
  );

  await record(admin.userId, hide ? "listing.hidden" : "listing.restored", "business", id, {
    reason,
  });

  revalidatePath("/global/businesses");
  return {};
}