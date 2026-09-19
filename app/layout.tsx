import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExpatPreneurs Global",
  description:
    "A curated network of expat entrepreneurs. Belong to a small, trusted community in your city, and reach people you can trust in other markets.",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
