"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, url } from "@/lib/email";
import { notify } from "@/lib/notify";

export type EnquiryState = { error?: string };

// Somebody outside writing to a business. ExpatPreneurs carries the
// message and takes no part in whatever follows.
export async function contactBusiness(
  _prev: EnquiryState,
  formData: FormData
): Promise<EnquiryState> {
  // A field nobody can see. Anything that fills it in is not a person.
  if (String(formData.get("website") ?? "").trim()) {
    redirect(`/businesses/contacted?b=${String(formData.get("slug"))}`);
  }

  const slug = String(formData.get("slug"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!name || !email || !body) {
    return { error: "Your name, your email and a message are all needed." };
  }

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) return { error: "That business is no longer listed." };

  const { error } = await supabase.from("business_enquiries").insert({
    business_id: business.id,
    from_name: name,
    from_email: email,
    body,
  });

  if (error) return { error: "That did not send. Try again in a moment." };

  // The owner hears about it, and gets the address to reply to directly.
  const service = createAdminClient();
  const { data: owner } = await service
    .from("profiles")
    .select("email, full_name")
    .eq("id", business.owner_id)
    .maybeSingle();

  await notify(
    business.owner_id,
    "message",
    `Somebody wrote to ${business.name}`,
    `${name}. Reply to them at ${email}.`,
    "/businesses"
  );

  if (owner?.email) {
    await sendEmail(
      owner.email,
      `An enquiry for ${business.name}`,
      `An enquiry for ${business.name}`,
      [
        `${name} wrote to you through the public marketplace.`,
        body,
        `Reply to them directly at ${email}. ExpatPreneurs takes no part in what follows.`,
      ],
      { label: "Your businesses", href: url("/businesses?show=mine") }
    );
  }

  redirect(`/businesses/contacted?b=${slug}`);
}