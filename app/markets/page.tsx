import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, isPaid } from "@/lib/member";

export const metadata = { title: "Market pathways, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

export default async function MarketsPage() {
  const member = await requireMember("/markets");
  const supabase = await createClient();

  const [{ data: pathways }, { data: following }] = await Promise.all([
    supabase
      .from("market_pathways")
      .select("id, slug, country, city, title, summary, industry, tier")
      .eq("status", "published")
      .order("country"),
    supabase
      .from("pathway_progress")
      .select("pathway_id, steps, done")
      .eq("profile_id", member.id),
  ]);

  const progressOf = (id: string) =>
    following?.find((f) => f.pathway_id === id);

  return (
    <WorkspaceShell kind="member" nav="/markets">
        <section className="band">
          <h1>Market pathways</h1>
          <p className="lead">
            Market Exploration is where you ask. A pathway is the route:
            the steps of getting into one country, in order, from members who
            have already done it.
          </p>
        </section>

        <section className="band">
          {(pathways ?? []).length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                None published yet. They are written from what members work out
                in Market Exploration, so the questions come first.
              </p>
              <Link className="btn" href="/market-exploration">
                Go to Market Exploration
              </Link>
            </div>
          ) : (
            <div className="grid three">
              {(pathways ?? []).map((pathway, i) => {
                const progress = progressOf(pathway.id);
                const locked = pathway.tier === "paid" && !isPaid(member);
                return (
                  <article className="card" key={pathway.id}>
                    <Link href={`/markets/${pathway.slug}`}>
                      <div className={`cover ${covers[i % covers.length]}`}>
                        {pathway.city ?? pathway.country}
                      </div>
                      <div className="kind">
                        {pathway.country}
                        {pathway.industry ? `, ${pathway.industry}` : ""}
                      </div>
                      <p>{pathway.summary}</p>
                      <div className="meta">
                        {progress ? (
                          <span className="chip mint">
                            {progress.done} of {progress.steps} steps
                          </span>
                        ) : locked ? (
                          <span className="chip sun">Paid plan</span>
                        ) : (
                          <span className="chip">{pathway.title}</span>
                        )}
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </WorkspaceShell>
  );
}