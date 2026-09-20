import { createAdminClient } from "@/lib/supabase/admin";

// Notifications are written on someone else's behalf, so they go through
// the service role. Nothing here is ever driven by the browser.
export async function notify(
  profileId: string,
  kind: string,
  title: string,
  body: string | null,
  link: string | null
) {
  try {
    const service = createAdminClient();
    await service.from("notifications").insert({
      profile_id: profileId,
      kind,
      title,
      body,
      link,
    });
  } catch {
    // A missed notification must never break the action that caused it.
  }
}