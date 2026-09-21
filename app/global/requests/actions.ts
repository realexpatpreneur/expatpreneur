"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { notify } from "@/lib/notify";
import { record } from "@/lib/audit";
import { slugify } from "@/lib/events";

export type RequestState = { error?: string; done?: string };

// Approving a Pod makes it real and puts the member who asked in charge
// of it, which is the only arrangement that works.
export async function decideOnPod(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const id = String(formData.get("proposal_id"));
  const decision = String(formData.get("decision"));

  const { data: proposal } = await supabase
    .from("pod_proposals")
    .select("id, proposer_id, village_id, name, purpose, cadence, ends_on")
    .eq("id", id)
    .maybeSingle();

  if (!proposal) return { error: "That proposal is not there any more." };

  if (decision === "actioned") {
    const { data: pod, error } = await supabase
      .from("pods")
      .insert({
        slug: slugify(proposal.name),
        name: proposal.name,
        purpose: proposal.purpose,
        cadence: proposal.cadence,
        village_id: proposal.village_id,
        lead_id: proposal.proposer_id,
        status: "forming",
      })
      .select("id, slug")
      .maybeSingle();

    if (error) return { error: "That Pod could not be made. The name may be taken." };

    // The lead is named on the Pod itself; this puts them in it as well.
    await supabase.from("pod_members").insert({
      pod_id: pod?.id,
      profile_id: proposal.proposer_id,
    });

    await supabase
      .from("pod_proposals")
      .update({ status: "actioned", pod_id: pod?.id, note: String(formData.get("note") ?? "") || null })
      .eq("id", id);

    await notify(
      proposal.proposer_id,
      "group",
      `Your Pod is on: ${proposal.name}`,
      "You lead it. Set the first meeting and tell your Village.",
      `/pods/${pod?.slug}`
    );

    await record(admin.userId, "pod.approved", "pod", pod?.id ?? null, {
      name: proposal.name,
    });
  } else {
    await supabase
      .from("pod_proposals")
      .update({ status: decision, note: String(formData.get("note") ?? "") || null })
      .eq("id", id);

    await notify(
      proposal.proposer_id,
      "group",
      `About your Pod: ${proposal.name}`,
      decision === "not_now"
        ? "Not for now. There is a note on it."
        : "The team is looking at it.",
      "/pods"
    );
  }

  revalidatePath("/global/requests");
  return {};
}

export async function handleDataRequest(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const admin = await requireGlobal();
  const supabase = await createClient();

  const id = String(formData.get("request_id"));
  const status = String(formData.get("status"));

  const { data: request } = await supabase
    .from("data_requests")
    .select("id, profile_id, kind")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("data_requests")
    .update({
      status,
      note: String(formData.get("note") ?? "").trim() || null,
      handled_by: admin.userId,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (request) {
    await record(admin.userId, `data.${request.kind}.${status}`, "profile", request.profile_id, {});

    await notify(
      request.profile_id,
      "member",
      "About your data request",
      status === "done"
        ? "It is done. Check your email."
        : "Somebody has picked it up.",
      "/settings"
    );
  }

  revalidatePath("/global/requests");
  return {};
}

// Marking an enquiry answered, so the Global team can see what is still
// waiting rather than re-reading the whole list.
export async function answerEnquiry(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  await requireGlobal();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("enquiries")
    .update({
      status: "answered",
      answered_by: user?.id ?? null,
      answered_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: "That did not save." };

  revalidatePath("/global/requests");
  return { done: "answered" };
}