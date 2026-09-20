"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, siteUrl, stripeReady } from "@/lib/stripe";

export type BuyState = { error?: string };

// One checkout for both: a member pays the member price, somebody who is
// not one pays the public price and buys with their email address.
export async function buyCourse(
  _prev: BuyState,
  formData: FormData
): Promise<BuyState> {
  if (!stripeReady) return { error: "Payments are not switched on yet." };

  const slug = String(formData.get("slug"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Read the course with the service role, so the price is the one in the
  // database rather than anything the browser sent.
  const service = createAdminClient();
  const { data: course } = await service
    .from("courses")
    .select("id, slug, title, summary, price_cents, member_price_cents, currency, status, review, public_listing")
    .eq("slug", slug)
    .maybeSingle();

  if (!course || course.status !== "published" || course.review !== "approved") {
    return { error: "That course is not open." };
  }
  if (!user && !course.public_listing) {
    return { error: "That course is for members." };
  }

  const price = user
    ? course.member_price_cents ?? course.price_cents
    : course.price_cents;

  if (price === 0) return { error: "That course is free. Just start it." };

  const { data: already } = user
    ? await service
        .from("course_purchases")
        .select("id")
        .eq("course_id", course.id)
        .eq("profile_id", user.id)
        .eq("status", "paid")
        .maybeSingle()
    : { data: null };

  if (already) redirect(`/learning/${slug}`);

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: course.currency.toLowerCase(),
          unit_amount: price,
          product_data: {
            name: course.title,
            description: course.summary ?? undefined,
          },
        },
      },
    ],
    metadata: {
      kind: "course",
      course_id: course.id,
      profile_id: user?.id ?? "",
    },
    client_reference_id: user?.id ?? undefined,
    success_url: `${siteUrl}/learning/${slug}?bought=1`,
    cancel_url: `${siteUrl}/learning/${slug}?cancelled=1`,
  });

  redirect(session.url ?? `/learning/${slug}`);
}

// Asking for a refund. The learner asks; the Global team decides, because
// the money went through the platform rather than the educator.
export async function askForRefund(
  _prev: BuyState,
  formData: FormData
): Promise<BuyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/learning");

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Say what went wrong." };

  const { error } = await supabase.from("refund_requests").insert({
    purchase_id: String(formData.get("purchase_id")),
    profile_id: user.id,
    reason,
  });

  if (error) {
    return { error: "That could not be sent. It may already be asked for." };
  }

  redirect(`/learning/${String(formData.get("slug"))}?refund=asked`);
}