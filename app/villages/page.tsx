import Link from "next/link";
import { PageBlocks } from "@/components/page-blocks";
import { createClient } from "@/lib/supabase/server";
import { pageText } from "@/lib/text";
import { PublicPage } from "@/components/public-page";
import { villagePhoto, villageStatus } from "@/components/cards";
import { Arrow } from "@/components/design/parts";

export const metadata = {
  title: "Villages, ExpatPreneurs Global",
  description:
    "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network.",
};

const FILTERS: [string, string][] = [
  ["all", "All"],
  ["open", "Open"],
  ["soon", "Launching soon"],
];

type CardVillage = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  status: string;
  cover_url: string | null;
  members: number | null;
  circles: number | null;
};

// The photograph a Village card carries: its own cover where it has one,
// and the city picture the site already holds where it does not.
function Cover({ village, height }: { village: CardVillage; height: number }) {
  return (
    <span
      className={village.cover_url ? undefined : `vphoto ${villagePhoto(village.slug)}`}
      role="img"
      aria-label={village.name}
      style={{
        display: "block",
        height,
        padding: 0,
        borderRadius: 0,
        background: village.cover_url
          ? `linear-gradient(to top,rgba(20,32,44,.72) 0%,rgba(20,32,44,.1) 60%),url('${village.cover_url}') center/cover`
          : undefined,
      }}
    />
  );
}

// The line under a Village's name, word for word the one the cards have
// always carried.
function countLine(village: CardVillage) {
  const launching = village.status === "launching";
  const empty = village.status !== "open" && !village.members;
  return (
    <>
      {village.country}.{" "}
      {launching
        ? "Opening soon."
        : empty
          ? "Opening soon."
          : `${village.members ?? 0} members in ${village.circles ?? 0} Circle${
              (village.circles ?? 0) === 1 ? "" : "s"
            }.`}
    </>
  );
}

export default async function VillagesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const supabase = await createClient();
  const t = await pageText("villages");

  const [{ data: villages }, { data: counts }] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary, cover_url")
      // the same three the footer, the home page and the invitation form
      // list, so a Village that is paused or archived is off the public site
      .in("status", ["open", "launching", "exploring"])
      .order("name"),
    supabase.from("village_public_counts").select("village_id, members, circles"),
  ]);

  const countFor = (id: string) =>
    (counts ?? []).find((c) => c.village_id === id) ?? { members: 0, circles: 0 };

  const rank: Record<string, number> = { open: 0, launching: 1, exploring: 2 };
  const rows = [...(villages ?? [])]
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9))
    .map((v) => ({ ...v, ...countFor(v.id) }))
    .filter((v) =>
      show === "open"
        ? v.status === "open"
        : show === "soon"
          ? ["launching", "exploring"].includes(v.status)
          : true
    );

  const cards = rows as unknown as CardVillage[];
  const [lead, ...rest] = cards;
  const statusLabel = (v: CardVillage) => (villageStatus[v.status] ?? [v.status, ""])[0];
  const statusClass = (v: CardVillage) => (v.status === "open" ? "d-open" : "d-soon");
  const action = (v: CardVillage) =>
    v.status === "launching" ? "Join the waitlist" : `Explore ${v.name}`;

  return (
    <PublicPage active="/villages">
      <PageBlocks slug="villages">
      <div className="d-page">
        <section style={{ padding: "64px 0 48px" }}>
          <div className="d-wrap">
            <h2 className="d-h1" style={{ maxWidth: "18ch" }}>{t("title", "Find your Village")}</h2>
            <p className="d-lead" style={{ marginTop: 18, maxWidth: "52ch" }}>
              {t("intro", "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network.")}
            </p>
          </div>
        </section>

        <div className="d-wrap">
          <div className="d-tabs">
            {FILTERS.map(([key, label]) => (
              <Link
                key={key}
                className={show === key ? "on" : ""}
                href={`/villages?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {lead ? (
          <section style={{ padding: "56px 0 0" }}>
            <div className="d-wrap">
              <div className="d-vfeat">
                <Link className="d-vcard" href={`/villages/${lead.slug}`}>
                  <Cover village={lead} height={400} />
                  <span style={{ display: "block", padding: 32 }}>
                    <span className={`d-status ${statusClass(lead)}`} style={{ fontSize: 13 }}>{statusLabel(lead)}</span>
                    <b style={{ display: "block", marginTop: 12, fontSize: 34, fontWeight: 800, letterSpacing: "-.035em" }}>{lead.name}</b>
                    <span className="d-body" style={{ display: "block", marginTop: 8, fontSize: 16 }}>{countLine(lead)}</span>
                    <span style={{ display: "block", marginTop: 22, fontSize: 15, fontWeight: 600 }}>{action(lead)}</span>
                  </span>
                </Link>
                {rest.length ? (
                  <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
                    {rest.map((village) => (
                      <Link className="d-vcard" href={`/villages/${village.slug}`} key={village.id}>
                        <Cover village={village} height={150} />
                        <span style={{ display: "block", padding: 24 }}>
                          <span className={`d-status ${statusClass(village)}`} style={{ fontSize: 13 }}>{statusLabel(village)}</span>
                          <b style={{ display: "block", marginTop: 10, fontSize: 24, fontWeight: 800, letterSpacing: "-.03em" }}>{village.name}</b>
                          <span className="d-body" style={{ display: "block", marginTop: 6, fontSize: 15 }}>{countLine(village)}</span>
                          <span style={{ display: "block", marginTop: 14, fontSize: 14, fontWeight: 600 }}>{action(village)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section style={{ padding: "96px 0 104px" }}>
          <div className="d-wrap">
            <div
              className="d-dark"
              style={{
                borderRadius: 6,
                padding: 52,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 32,
              }}
            >
              <div style={{ flex: "1 1 420px", minWidth: 0 }}>
                <h3 className="d-h2">No Village in your city yet?</h3>
                <p className="d-lead" style={{ marginTop: 12, maxWidth: "48ch" }}>
                  Tell us where you are. New Villages open when there are enough
                  members and trusted people ready to host them.
                </p>
              </div>
              <Link className="d-btn d-btn-mint d-shine" href="/villages/suggest">
                Suggest your city
                <Arrow />
              </Link>
            </div>
          </div>
        </section>
      </div>
          </PageBlocks>
</PublicPage>
  );
}
