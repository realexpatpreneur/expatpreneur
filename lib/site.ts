// The address of the site, in one place.
//
// It was written into six files, each with the same fallback. That is
// six chances to miss one on the day the domain changes.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://expatpreneur.vercel.app"
).replace(/\/$/, "");

// A full address for a path, for emails, shared links and anywhere else
// that leaves the browser.
export const siteLink = (path: string) =>
  `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

// What the site is called and what it says about itself, used in the
// page title, in link previews and in the sitemap.
export const siteName = "ExpatPreneurs Global";
export const siteDescription =
  "A curated network of expat entrepreneurs. Belong to a small, trusted community in your city, and reach people you can trust in other markets.";