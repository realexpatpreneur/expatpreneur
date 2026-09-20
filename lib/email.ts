// Email goes out through Resend, called over plain HTTP so there is no extra
// dependency. Until the key is set, nothing is sent and nothing breaks.

export const emailReady = Boolean(process.env.RESEND_API_KEY);

const from = process.env.EMAIL_FROM ?? "ExpatPreneurs <hello@expatpreneurs.com>";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://expatpreneur.vercel.app";

function wrap(title: string, lines: string[], action?: { label: string; href: string }) {
  const body = lines
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3b4650">${line}</p>`
    )
    .join("");

  const button = action
    ? `<p style="margin:22px 0 0"><a href="${action.href}" style="display:inline-block;background:#0f1419;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:8px">${action.label}</a></p>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f6f8;font-family:Inter,'Segoe UI',system-ui,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3e6ea;border-radius:12px;padding:28px">
    <p style="margin:0 0 20px;font-size:17px;font-weight:800;letter-spacing:-0.02em;color:#0f1419">ExpatPreneurs</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;letter-spacing:-0.02em;color:#0f1419">${title}</h1>
    ${body}${button}
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#6b7683">
    ExpatPreneurs Global. <a href="${siteUrl}" style="color:#6b7683">${siteUrl.replace("https://", "")}</a>
  </p>
</body></html>`;
}

export async function sendEmail(
  to: string,
  subject: string,
  title: string,
  lines: string[],
  action?: { label: string; href: string }
) {
  if (!emailReady) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html: wrap(title, lines, action),
      }),
    });
  } catch {
    // An email that does not go out must never break what caused it.
  }
}

export const url = (path: string) => `${siteUrl}${path}`;

// Sending to a member rather than to an address: the member decides which
// of these they want. Anything with no preference set goes out, because
// everything is on until someone turns it off.
export async function sendEmailToMember(
  profileId: string,
  kind: "messages" | "replies" | "connections" | "events" | "announcements" | "renewal",
  to: string | null,
  subject: string,
  title: string,
  lines: string[],
  action?: { label: string; href: string }
) {
  if (!emailReady || !to) return;

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const service = createAdminClient();
    const { data: wanted } = await service.rpc("wants_email", {
      who: profileId,
      what: kind,
    });
    if (wanted === false) return;
  } catch {
    // If the check itself fails, the message still goes.
  }

  await sendEmail(to, subject, title, lines, action);
}