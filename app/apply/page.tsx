import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { ApplyForm } from "./form";
import { WhyJoin } from "@/components/why-join";
import { Faces, Pm, PHOTO } from "@/components/design/parts";

export const metadata = { title: "Request an invitation, ExpatPreneurs Global" };

const NEXT: [string, string][] = [
  ["Review", "Your request is read personally."],
  ["A conversation", "We may ask a few questions or invite you to an open evening."],
  ["Welcome", "Once accepted, you complete your profile."],
  ["Village Membership", "Membership begins when it is paid for, and your Circle and its WhatsApp group follow."],
];

const said: Record<string, [string, string]> = {
  open: ["Open now", "#24675A"],
  launching: ["Opening soon", "#8A5520"],
  exploring: ["Being explored", "#8A5520"],
};

export default async function ApplyPage() {
  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("slug, name, status")
    .in("status", ["open", "launching"])
    .order("name");

  // The panel beside the form names every Village, including the ones
  // being explored, because somebody reading this may be in one of them.
  const { data: allVillages } = await supabase
    .from("villages")
    .select("name, status")
    .in("status", ["open", "launching", "exploring"])
    .order("name");

  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const listed = [...(allVillages ?? [])].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));

  return (
    <PublicPage>
      <PageBlocks slug="apply">
      <div className="d-page">
        <section style={{ padding: "56px 0 104px" }}>
          <div className="d-wrap d-apply">
            <div>
              <h1 className="d-h1" style={{ fontSize: "clamp(32px, 3.6vw, 46px)" }}>Request an invitation</h1>
              <p className="d-lead" style={{ marginTop: 14, maxWidth: "54ch" }}>
                Every request is read personally. Tell us about you, your business
                and where your journey has taken you.
              </p>
              <p className="d-small" style={{ marginTop: 10 }}>
                Already asked? <Link className="d-ulink" href="/apply/status" style={{ fontSize: 14 }}>Check where it stands</Link>
              </p>

              <details className="d-why" style={{ marginTop: 32 }}>
                <summary>
                  <Faces srcs={[PHOTO.tomas, PHOTO.ines, PHOTO.nadia]} size={36} />
                  Why join ExpatPreneurs?
                  <Pm />
                </summary>
                <WhyJoin villages={allVillages ?? []} />
              </details>

              <div className="d-apply-card d-form">
                <ApplyForm villages={villages ?? []} />
              </div>
            </div>

            <aside>
              <div className="d-zoom" style={{ borderRadius: 6, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PHOTO.reader} alt="A member who reads invitation requests" style={{ width: "100%", height: 260, objectFit: "cover", objectPosition: "85% 30%" }} />
              </div>
              <h2 style={{ marginTop: 28, fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>What happens next</h2>
              <ol className="d-next" style={{ marginTop: 14 }}>
                {NEXT.map(([title, line], i) => (
                  <li key={title}>
                    <span className="d-num">{i + 1}</span>
                    <span style={{ fontSize: 15, lineHeight: 1.55 }}>
                      <b style={{ display: "block" }}>{title}</b>
                      <span style={{ color: "#3B4650" }}>{line}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <figure className="d-dark" style={{ marginTop: 28, borderRadius: 6, padding: 26 }}>
                <blockquote style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.45 }}>
                  I moved to Lisbon knowing two people. Four months later I had a
                  supplier, an accountant and somebody to have dinner with on a Tuesday.
                </blockquote>
                <figcaption style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                  <Faces srcs={[PHOTO.ines]} size={40} />
                  <span style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <b style={{ display: "block" }}>Inês Carvalho</b>
                    <span style={{ color: "#B9C3CD" }}>Lisbon Village</span>
                  </span>
                </figcaption>
              </figure>
              {listed.length ? (
                <div style={{ marginTop: 28 }}>
                  <b style={{ fontSize: 15 }}>Our Villages</b>
                  <div style={{ marginTop: 10, fontSize: 15, borderBottom: "1px solid #E3E6EA" }}>
                    {listed.map((v) => {
                      const [label, color] = said[v.status] ?? [v.status, "#6B7683"];
                      return (
                        <div key={v.name} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #E3E6EA" }}>
                          <span>{v.name}</span>
                          <span style={{ fontWeight: 600, color }}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </section>
      </div>
      </PageBlocks>
    </PublicPage>
  );
}
