import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Turnstile is Cloudflare's captcha. It is free, it does not track
// people, and most visitors never see anything. Like Stripe and Resend,
// it stays out of the way until the keys exist.
export const captchaReady = Boolean(
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY
);

export async function captchaPassed(token: string | null): Promise<boolean> {
  if (!captchaReady) return true;
  if (!token) return false;

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );
    const data = (await response.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    // If Cloudflare is unreachable, let the person through. A form that
    // refuses everybody because a third party is down is worse than the
    // spam it prevents.
    return true;
  }
}

// How many times this address has sent this form lately. The address is
// hashed before it leaves this function, so nothing identifying is
// stored.
export async function tooManyTries(
  form: string,
  limit: number,
  minutes = 60
): Promise<boolean> {
  try {
    const head = await headers();
    const ip =
      head.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      head.get("x-real-ip") ||
      "unknown";

    const hash = createHash("sha256")
      .update(ip + "|" + (process.env.RATE_SALT ?? "expatpreneurs"))
      .digest("hex");

    const supabase = await createClient();
    const { data } = await supabase.rpc("note_form_hit", {
      p_form: form,
      p_ip_hash: hash,
      p_minutes: minutes,
    });

    return typeof data === "number" && data > limit;
  } catch {
    // Counting failed, so let them through rather than block a real
    // person over our own fault.
    return false;
  }
}

export const TOO_MANY =
  "That is a lot of attempts in a short time. Please wait a little and try again.";