import Link from "next/link";
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
          items={[
            <Link key="h" href="/how-it-works">How it works</Link>,
            <Link key="m" href="/membership">Membership</Link>,
            <Link key="d" href="/members">Members</Link>,
            <Link key="e" href="/events">Events</Link>,
            <Link key="a" href="/apply">Request your invitation</Link>,
            <Link key="s" href="/apply/status">Your invitation request</Link>,
          ]}
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
            <Link key="a" href="/villages">All Villages</Link>,
            <Link key="s" href="/villages/suggest">Suggest a city</Link>,
          ]}
        />
        <Col
          title="Marketplace"
          items={[
            <Link key="b" href="/businesses">Businesses</Link>,
            <Link key="l" href="/learning">Learning</Link>,
            <Link key="t" href="/membership">Teach in the network</Link>,
          ]}
        />
        <Col
          title="Stories"
          items={[
            <Link key="m" href="/media">Media</Link>,
            <Link key="v" href="/watch">Videos</Link>,
            <Link key="p" href="/watch?kind=podcast">Podcasts</Link>,
            <Link key="f" href="/media">Founder story</Link>,
          ]}
        />
        <Col
          title="Company"
          items={[
            <Link key="c" href="/contact">Contact</Link>,
            <Link key="p" href="/contact">Partnerships</Link>,
            <Link key="r" href="/contact">Press</Link>,
            <Link key="l" href="/login">Log in</Link>,
          ]}
        />
      </div>

      <div className="ft-bottom">
        <span>&copy; {new Date().getFullYear()} ExpatPreneurs Global. All rights reserved.</span>
        <nav>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/cookies">Cookies</Link>
        </nav>
      </div>
    </footer>
  );
}