import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// The member space and the workspaces are behind a sign in, so a search
// engine could not read them anyway. Saying so keeps them out of the
// index if a link ever leaks.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/home",
          "/my-village",
          "/my-circle",
          "/directory",
          "/messages",
          "/notifications",
          "/settings",
          "/me",
          "/admin",
          "/global",
          "/lead",
          "/educator",
          "/re-enrol",
          "/api",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}