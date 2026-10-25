"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { sendEmail, emailReady, url } from "@/lib/email";

export type ReEnrolAdminState = { error?: string; done?: string };

// The list usually arrives as a paste from WhatsApp or a spreadsheet:
// one person per line, name and then phone or email in any order.
// The letter that goes to somebody who is already in the community and
// is being brought onto the platform. It is not an application and it
// does not read like one.
async function sendPlaceLetter(
  to: string,
  name: string,
  villageName: string | null,
  token: string,
  again = false
) {
  const first = (name ?? "").split(" ")[0] || "there";
  await sendEmail(
    to,
    again ? "Your place is still waiting" : "Your place on ExpatPreneurs",
    again ? "Still here when you are" : "Your place is waiting",
    [
      `${first}, you are already one of us${
        villageName ? ` in ${villageName}` : ""
      }. This is only the part where the platform catches up with that.`,
      again
        ? "The link below is the same one. It takes a couple of minutes and then you are set up."
        : "The link below sets up your account. It takes a couple of minutes, and nobody is deciding anything about you: your place is yours.",
    ],
    { label: "Claim your place", href: url(`/re-enrol/${token}`) }
  );
}

export async function importList(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  const admin = await requireAdmin();
  const villageId =
    String(formData.get("village_id") ?? "") || admin.villageIds[0];
  if (!villageId) return { error: "Choose a Village first." };

  const raw = String(formData.get("people") ?? "").trim();
  if (!raw) return { error: "Nothing to add." };

  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const name = parts[0] ?? "";
      const email = parts.find((p) => p.includes("@")) ?? null;
      const phone =
        parts.find((p) => /^[+0-9][0-9 ()-]{6,}$/.test(p)) ?? null;
      return { village_id: villageId, full_name: name, email, phone };
    })
    .filter((r) => r.full_name);

  if (!rows.length) return { error: "No names were found in that." };

  const supabase = await createClient();
  const { data: added, error } = await supabase
    .from("founding_invites")
    .insert(rows)
    .select("full_name, email, token");
  if (error) return { error: error.message };

  // The list is no use until the people on it hear about it. Anybody
  // without an address is left for the admin to reach another way, and
  // the page says who they are.
  const { data: village } = await supabase
    .from("villages")
    .select("name")
    .eq("id", villageId)
    .maybeSingle();

  let sent = 0;
  for (const person of added ?? []) {
    if (!person.email) continue;
    await sendPlaceLetter(
      String(person.email),
      person.full_name,
      village?.name ?? null,
      person.token
    );
    sent += 1;
  }

  revalidatePath("/admin/re-enrolment");

  const withoutEmail = (added ?? []).length - sent;
  const tail = !emailReady
    ? ", none written yet because email is not switched on"
    : withoutEmail
      ? `, ${sent} written to and ${withoutEmail} with no address`
      : `, all ${sent} written to`;

  return { done: `${rows.length} added${tail}` };
}

export async function remind(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data: person } = await supabase
    .from("founding_invites")
    .select("full_name, email, token, village_id")
    .eq("id", id)
    .maybeSingle();

  if (!person) return { error: "That person is not on the list." };

  const { error } = await supabase
    .from("founding_invites")
    .update({ status: "reminded", last_contact: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  if (person.email) {
    const { data: village } = await supabase
      .from("villages")
      .select("name")
      .eq("id", person.village_id)
      .maybeSingle();
    await sendPlaceLetter(
      String(person.email),
      person.full_name,
      village?.name ?? null,
      person.token,
      true
    );
  }

  revalidatePath("/admin/re-enrolment");
  return {
    done: person.email
      ? emailReady
        ? "reminded, and written to"
        : "reminded, but email is not switched on"
      : "reminded. No address for them, so reach them another way",
  };
}

export async function setDeadline(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  const admin = await requireAdmin();
  const villageId =
    String(formData.get("village_id") ?? "") || admin.villageIds[0];
  const date = String(formData.get("deadline") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("villages")
    .update({ reenrol_deadline: date })
    .eq("id", villageId);

  if (error) return { error: error.message };
  revalidatePath("/admin/re-enrolment");
  return { done: "deadline" };
}

// After the deadline, the people who did not answer become removal
// tasks rather than being removed by a machine.
export async function closeOut(
  _prev: ReEnrolAdminState,
  formData: FormData
): Promise<ReEnrolAdminState> {
  const admin = await requireAdmin();
  const villageId =
    String(formData.get("village_id") ?? "") || admin.villageIds[0];

  const supabase = await createClient();
  const { error } = await supabase
    .from("founding_invites")
    .update({ status: "removed" })
    .eq("village_id", villageId)
    .in("status", ["invited", "reminded"]);

  if (error) return { error: error.message };
  revalidatePath("/admin/re-enrolment");
  return { done: "closed" };
}