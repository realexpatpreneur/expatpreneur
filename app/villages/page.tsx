import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteFooter } from "@/components/site-footer";

const covers = ["blue", "mint", "pink", "paper", "navy", "sun"] as const;

export default async function VillagesPage() {
  const supabase = await createClient();
  const { data: villages } = await supabase
    .from("villages")
    .select("id, slug, name, city, country, status, summary")
    .order("name");

  return (
    <>
      <main className="wrap">
        <section className="pubsec hero-center">
          <h1>Villages</h1>
          <p className="lead">
            A Village opens where there are enough expat entrepreneurs, a shared
            language and a trusted Local Admin.
          </p>
        </section>
        <section className="sec">
          <div className="g3 g4">
            {(villages ?? []).map((village, i) => (
              <article className="card" key={village.id}>
                <div className={`cover ${covers[i % covers.length]}`}>
                  {village.name}
                </div>
                <div className="kind">{village.country}</div>
                <p>{village.summary}</p>
                <div className="meta">
                  <span className="chip">{village.status}</span>
                </div>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 24 }}>
            <Link className="btn btn-ghost" href="/villages/suggest">
              Suggest a city
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}