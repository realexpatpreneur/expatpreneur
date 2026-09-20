"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

export type MessageState = { error?: string; done?: string };

export async function sendMessage(
  _prev: MessageState,
  formData: FormData
): Promise<MessageState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  const recipientId = String(formData.get("recipient_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };

  const { error } = await supabase
    .from("messages")
    .insert({ sender_id: user.id, recipient_id: recipientId, body });

  if (error) {
    return {
      error:
        "That message was refused. Members in other Villages can be messaged once they accept your request, on the paid plan.",
    };
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  await notify(
    recipientId,
    "message",
    `${me?.full_name ?? "A member"} sent you a message`,
    body.slice(0, 120),
    `/messages/${user.id}`
  );

  revalidatePath(`/messages/${recipientId}`);
  return { done: "sent" };
}

// Reaching a member in another Village starts with a request, and the
// paid plan is what allows sending one.
export async function requestConnection(
  _prev: MessageState,
  formData: FormData
): Promise<MessageState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/directory");

  const recipientId = String(formData.get("recipient_id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Say why you are getting in touch." };

  const { error } = await supabase
    .from("connection_requests")
    .insert({ requester_id: user.id, recipient_id: recipientId, reason });

  if (error) {
    return {
      error:
        "That request was refused. Reaching members in other Villages is part of the paid plan, and one request per person is enough.",
    };
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  await notify(
    recipientId,
    "connection",
    `${me?.full_name ?? "A member"} would like to connect`,
    reason.slice(0, 120),
    "/messages"
  );

  revalidatePath(`/members/${recipientId}`);
  return { done: "requested" };
}

export async function respondToConnection(
  _prev: MessageState,
  formData: FormData
): Promise<MessageState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  const id = String(formData.get("request_id"));
  const decision = String(formData.get("decision") ?? "accepted");

  const { data: request, error } = await supabase
    .from("connection_requests")
    .update({ status: decision })
    .eq("id", id)
    .select("requester_id")
    .maybeSingle();

  if (error) return { error: error.message };

  if (decision === "accepted" && request) {
    const { data: me } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    await notify(
      request.requester_id,
      "connection",
      `${me?.full_name ?? "A member"} accepted your request`,
      null,
      `/messages/${user.id}`
    );
  }

  revalidatePath("/messages");
  return { done: decision };
}