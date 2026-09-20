import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { HideButton } from "./forms";

export const metadata = { title: "Business listings, the Global team" };

export default async function GlobalBusinessesPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: businesses }, { data: villages }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, slug, name, owner_id, village_id, offer, public, hidden, hidden_reason")
      .order("name"),
    supabase.from("villages").select("id, name"),
  ]);

  const ids = [...new Set((businesses ?? []).map((b) => b.owner_id))];
  const { data: people } = ids.length
    ? await supabase.from("member_records").select("id, full_name").in("id", ids)
    : { data: [] };

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "";

  return (
    <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Business listings</h1>
          <p className="lead">
            Listings and offers across the network, and a way to take down
            one that breaks the rules.
          </p>
        </section>

        <section className="band">
          {(businesses ?? []).length === 0 ? (
            <p className="muted">Nobody has listed a business yet.</p>
          ) : (
            <div className="rows">
              {(businesses ?? []).map((business) => (
                <div className="rowlink" key={business.id}>
                  <div>
                    <b>
                      <Link href={`/businesses/${business.slug}`}>
                        {business.name}
                      </Link>
                    </b>
                    <div className="muted small">
                      {people?.find((p) => p.id === business.owner_id)
                        ?.full_name ?? "A member"}
                      . {villageName(business.village_id)}.{" "}
                      {business.offer ?? "No offer"}
                      {business.hidden_reason ? `. ${business.hidden_reason}` : ""}
                    </div>
                  </div>
                  <div className="rowmeta">
                    <span
                      className={`chip ${
                        business.hidden ? "" : business.public ? "mint" : ""
                      }`}
                    >
                      {business.hidden
                        ? "Taken down"
                        : business.public
                          ? "Live"
                          : "Members only"}
                    </span>
                    <HideButton id={business.id} hidden={business.hidden} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
    </main>
  );
}