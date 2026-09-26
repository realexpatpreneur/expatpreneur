import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// The member area, by exact address. Matching on the start of a string
// was what closed the public site: "/villages" starts with "/village",
// and "/membership" starts with "/members", so three public pages and
// the whole Villages section turned visitors away.
//
// A path counts as being in one of these only if it is the address
// itself or something underneath it, which is what the slash does.
const MEMBER_ONLY = [
  "/home",
  "/welcome",
  "/village", // Ask & Offer. Not /villages, which is public.
  "/my-village",
  "/my-circle",
  "/circles",
  "/directory",
  "/me",
  "/more",
  "/for-you",
  "/network",
  "/messages",
  "/notifications",
  "/market-exploration",
  "/suggestions",
  "/library",
  "/photos",
  "/search",
  "/upgrade",
  "/settings",
  "/report",
  "/groups",
  "/pods",
  "/jobs",
  "/renew",
  "/markets",
  "/live",
  "/educator",
  "/lead",
  "/admin",
  "/global",
];

// These are open to everybody, and several of them show a member more
// than they show a visitor. None of them may ever be gated here.
const ALWAYS_OPEN = [
  "/",
  "/discover",
  "/how-it-works",
  "/membership",
  "/villages",
  "/events",
  "/businesses",
  "/learning",
  "/media",
  "/watch",
  "/members",
  "/contact",
  "/apply",
  "/login",
  "/legal",
  "/menu",
  "/e",
  "/reset-password",
  "/auth",
  "/api",
];

const inArea = (path: string, list: string[]) =>
  list.some((entry) => path === entry || path.startsWith(entry + "/"));

// Keeps the session cookie fresh, and sends signed out people away from
// the member space and the workspaces.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // A page that is open to everybody is never gated, whatever else the
  // lists say.
  if (inArea(path, ALWAYS_OPEN)) return response;

  if (!user && inArea(path, MEMBER_ONLY)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}