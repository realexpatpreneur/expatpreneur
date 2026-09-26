import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicPage } from "@/components/public-page";
import { VillageCard, type VillageRow } from "@/components/cards";

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

export default async function VillagesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const supabase = await createClient();

  const [{ data: villages }, { data: counts }] = await Promise.all([
    supabase
      .from("villages")
      .select("id, slug, name, city, country, status, summary")
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

  return (
    <PublicPage active="/villages">
      <section className="pubsec">
        <h2>Find your Village</h2>
        <p className="intro">
          Each Village is a local community of expat entrepreneurs in one city,
          connected to every other Village in the network.
        </p>

        <div className="filters">
          {FILTERS.map(([key, label]) => (
            <Link
              key={key}
              className={`fchip ${show === key ? "on" : ""}`}
              href={`/villages?show=${key}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="g3">
          {rows.map((village) => (
            <VillageCard key={village.id} village={village as VillageRow} />
          ))}
        </div>

        <div
          className="panel panel-wash"
          style={{
            marginTop: 22,
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3 style={{ fontSize: 15 }}>No Village in your city yet?</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Tell us where you are. New Villages open when there are enough
              members and trusted people ready to host them.
            </p>
          </div>
          <Link className="btn btn-dark" href="/villages/suggest">
            Suggest your city
          </Link>
        </div>
      </section>
    </PublicPage>
  );
}