import { headers } from "next/headers";

// The newsletter list lives in Flodesk, where the writing and the sending
// happen. A signup still lands in our own table first, so the list belongs
// to us whether or not Flodesk answers, and this only mirrors it across.
//
// Called over plain HTTP, the way Resend is, so there is no extra
// dependency. Until the key is set, nothing is sent and nothing breaks.

export const flodeskReady = Boolean(process.env.FLODESK_API_KEY);

const BASE = "https://api.flodesk.com/v1";

// Flodesk takes the key as the username of a basic auth pair, with no
// password, and asks that every call names itself.
function callHeaders() {
  const key = process.env.FLODESK_API_KEY ?? "";
  return {
    Authorization: "Basic " + Buffer.from(`${key}:`).toString("base64"),
    "Content-Type": "application/json",
    "User-Agent": "ExpatPreneurs Global",
  };
}

// Where the person was standing when they signed up, which is what makes
// the consent a record rather than an assertion.
async function optIn() {
  try {
    const head = await headers();
    const ip =
      head.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      head.get("x-real-ip") ||
      undefined;
    return { optin_ip: ip, optin_timestamp: new Date().toISOString() };
  } catch {
    return { optin_timestamp: new Date().toISOString() };
  }
}

// Put an address on the list. Never throws: a newsletter signup must not
// fail because somebody else's service is having a bad morning, and the
// address is already safe in our own table by the time this runs.
export async function addToNewsletter(email: string, source?: string | null) {
  if (!flodeskReady) return;

  const segment = process.env.FLODESK_SEGMENT_ID?.trim();

  try {
    const res = await fetch(`${BASE}/subscribers`, {
      method: "POST",
      headers: callHeaders(),
      body: JSON.stringify({
        email,
        ...(segment ? { segment_ids: [segment] } : {}),
        ...(source ? { custom_fields: { source } } : {}),
        ...(await optIn()),
      }),
    });

    if (!res.ok) {
      console.error(
        "Flodesk refused a signup:",
        res.status,
        (await res.text()).slice(0, 300)
      );
    }
  } catch (error) {
    console.error("Flodesk could not be reached:", error);
  }
}
