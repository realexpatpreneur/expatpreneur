import { createAdminClient } from "@/lib/supabase/admin";

// Who did what, to whom, and when. Written for the decisions somebody may
// have to answer for later: a membership ending, a role given, a report
// closed, an event called off.
export async function record(
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  meta?: Record<string, unknown>
) {
  try {
    const service = createAdminClient();
    await service.from("audit_log").insert({
      actor_id: actorId,
      action,
      entity,
      entity_id: entityId,
      meta: meta ?? {},
    });
  } catch {
    // A missing line in the log must never stop the thing being recorded.
  }
}