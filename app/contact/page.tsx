import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { ContactForm } from "./form";

export const metadata = { title: "Contact, ExpatPreneurs Global" };

const TABS: [string, string][] = [
  ["general", "General"],
  ["partnership", "Partnerships"],
  ["press", "Press"],
];

const HEADINGS: Record<string, [string, string]> = {
  general: [
    "Contact us",
    "Questions about membership or a Village? We usually reply within two working days.",
  ],
  partnership: [
    "Partner with ExpatPreneurs",
    "Sponsors, venues and organisations who want to support expat founders. Partnerships are agreed with the Global team.",
  ],
  press: ["Press and media", "Interviews, stories and speaking requests."],
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = "general" } = await searchParams;
  const here = HEADINGS[kind] ? kind : "general";
  const [title, intro] = HEADINGS[here];

  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("slug, name")
    .order("name");

  return (
    <PublicPage active="/contact">
      <section className="pubsec">
        <div className="article" style={{ maxWidth: 680 }}>
          <h2>{title}</h2>
          <p className="intro">{intro}</p>

          <div className="tabs" style={{ marginTop: 18 }}>
            {TABS.map(([key, label]) => (
              <Link
                key={key}
                href={`/contact?kind=${key}`}
                aria-current={here === key ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <ContactForm kind={here} villages={villages ?? []} />
          </div>

          <div className="g3" style={{ marginTop: 22 }}>
            <Link className="panel" href="/apply">
              <h3 style={{ fontSize: 14 }}>You want to join</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                Requesting an invitation is the way in, and it is read by a
                person.
              </p>
            </Link>
            <Link className="panel" href="/villages/suggest">
              <h3 style={{ fontSize: 14 }}>Your city is not here</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                Villages open where enough people ask.
              </p>
            </Link>
            <Link className="panel" href="/apply/status">
              <h3 style={{ fontSize: 14 }}>You already applied</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                Your reference and email show you where it stands.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}