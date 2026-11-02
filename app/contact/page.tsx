import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
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

// The three ways on from here, as ruled rows beside the form.
const ELSEWHERE: [string, string, string][] = [
  [
    "/apply",
    "You want to join",
    "Requesting an invitation is the way in, and it is read by a person.",
  ],
  [
    "/villages/suggest",
    "Your city is not here",
    "Villages open where enough people ask.",
  ],
  [
    "/apply/status",
    "You already applied",
    "Your reference and email show you where it stands.",
  ],
];

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
      <PageBlocks slug="contact">
      <div className="d-page">
        <section style={{ padding: "56px 0 44px" }}>
          <div className="d-wrap">
            <h1 className="d-h1" style={{ maxWidth: "20ch" }}>{title}</h1>
            <p className="d-lead" style={{ marginTop: 18, maxWidth: "46ch" }}>{intro}</p>
            <nav className="d-tabs" aria-label="What this is about" style={{ marginTop: 36 }}>
              {TABS.map(([key, label]) => (
                <Link
                  key={key}
                  className={here === key ? "on" : ""}
                  href={`/contact?kind=${key}`}
                  aria-current={here === key ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="d-sec d-sec-top0" style={{ paddingBottom: 104 }}>
          <div className="d-wrap d-apply">
            <div className="d-boxed d-form">
              <ContactForm kind={here} villages={villages ?? []} />
            </div>

            <div>
              <div className="d-rows">
                {ELSEWHERE.map(([href, heading, line]) => (
                  <Link className="d-row" key={href} href={href} style={{ display: "block" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700 }}>{heading}</h3>
                    <p className="d-body" style={{ marginTop: 6, fontSize: 14 }}>{line}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
          </PageBlocks>
</PublicPage>
  );
}
