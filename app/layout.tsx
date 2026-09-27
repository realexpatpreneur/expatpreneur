import type { Metadata } from "next";
import "./globals.css";
import { siteUrl, siteName, siteDescription } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  // Every page's own title and description hang off this one.
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s`,
  },
  description: siteDescription,
  // What a link looks like when somebody drops it into WhatsApp or
  // LinkedIn, which is how most people will first see this.
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}