import Link from "next/link";
import { menu, type MenuItem } from "@/lib/menus";
import { createClient } from "@/lib/supabase/server";
import { Ic } from "@/components/icon";
import { LogoPlain } from "@/components/brand";
import { SubscribeForm } from "@/app/media/subscribe-form";

// pubFoot, as the prototype writes it: brand and newsletter across the
// top, five columns of links, then the small print.
function Col({ title, items }: { title: string; items: React.ReactNode[] }) {
  return (
    <div>
      <h4>{title}</h4>
      <nav>{items}</nav>
    </div>
  );
}

const SOCIAL: [string, string, string][] = [
  ["youtube", "YouTube", "https://www.youtube.com/"],
  ["instagram", "Instagram", "https://www.instagram.com/"],
  ["linkedin", "LinkedIn", "https://www.linkedin.com/"],
  ["mic", "Podcast", "https://open.spotify.com/"],
];

export async function SiteFooter() {
  // Each column shows the menu the Global team keeps, or the links
  // written below if they have not made one.
  const saved: Record<string, MenuItem[]> = Object.fromEntries(
    await Promise.all(
      [
        "footer_explore",
        "footer_villages",
        "footer_marketplace",
        "footer_stories",
        "footer_company",
        "legal",
      ].map(async (name) => [name, await menu(name)] as const)
    )
  );

  const links = (name: string, fallback: [string, string][]) =>
    (saved[name]?.length
      ? saved[name].map((i) => [i.href, i.label] as [string, string])
      : fallback
    ).map(([href, label]) => (
      <Link key={`${href}${label}`} href={href}>
        {label}
      </Link>
    ));

  // The Villages come from the database, so a new one appears here the
  // day it is created rather than the day somebody remembers to edit
  // this file.
  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("slug, name, status")
    .in("status", ["open", "launching", "exploring"])
    .order("name");

  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const listed = [...(villages ?? [])].sort(
    (a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9)
  );

  return (
    <footer className="pubfoot">
      <div className="ft-top">
        <div className="ft-brand">
          <LogoPlain alt smallStyle={{ color: "#A8DCD1" }} />
          <p>
            A curated network of expat entrepreneurs. Local enough to belong,
            global enough to grow, and human enough to matter.
          </p>
          <div className="social">
            {SOCIAL.map(([icon, name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener"
                aria-label={`ExpatPreneurs on ${name}`}
              >
                <Ic name={icon} />
              </a>
            ))}
          </div>
        </div>

        <div className="ft-news">
          <b>The monthly newsletter</b>
          <p>New stories, videos, podcast episodes and events from every Village.</p>
          <SubscribeForm source="footer" />
        </div>
      </div>

      <div className="ft-cols">
        <Col
          title="Explore"
          items={links("footer_explore", [
            ["/how-it-works", "How it works"],
            ["/membership", "Membership"],
            ["/members", "Members"],
            ["/events", "Events"],
            ["/apply", "Request your invitation"],
            ["/apply/status", "Your invitation request"],
          ])}
        />
        <Col
          title="Villages"
          items={[
            ...listed.map((village) => (
              <Link key={village.slug} href={`/villages/${village.slug}`}>
                <span className={`vdot${village.status === "open" ? "" : " soon"}`} />
                {village.name}
                {village.status === "open" ? null : (
                  <small>
                    {village.status === "launching" ? "Launching soon" : "Being explored"}
                  </small>
                )}
              </Link>
            )),
            ...links("footer_villages", [
              ["/villages", "All Villages"],
              ["/villages/suggest", "Suggest a city"],
            ]),
          ]}
        />
        <Col
          title="Marketplace"
          items={links("footer_marketplace", [
            ["/businesses", "Businesses"],
            ["/learning", "Learning"],
            ["/membership", "Teach in the network"],
          ])}
        />
        <Col
          title="Stories"
          items={links("footer_stories", [
            ["/media", "Media"],
            ["/watch", "Videos"],
            ["/watch?kind=podcast", "Podcasts"],
            ["/media", "Founder story"],
          ])}
        />
        <Col
          title="Company"
          items={links("footer_company", [
            ["/contact", "Contact"],
            ["/contact", "Partnerships"],
            ["/contact", "Press"],
            ["/login", "Log in"],
          ])}
        />
      </div>

      <div className="ft-bottom">
        <span>&copy; {new Date().getFullYear()} ExpatPreneurs Global. All rights reserved.</span>
        <nav>
          {links("legal", [
            ["/legal/privacy", "Privacy"],
            ["/legal/terms", "Terms"],
            ["/legal/cookies", "Cookies"],
          ])}
        </nav>
      </div>
    </footer>
  );
}