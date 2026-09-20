import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { MediaForm } from "../resources/forms";

export const metadata = { title: "Watch and Listen, Admin" };

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("media_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="wrap">
      <section className="sec">
        <h1>Watch and Listen</h1>
        <p className="lead">
          Videos, podcast episodes and articles. Published pieces appear on the
          public site unless they are kept for members.
        </p>
        {done ? <div className="flag ok">Saved.</div> : null}
        {!admin.isGlobal ? (
          <div className="flag hold">
            This is managed by the Global team. You can look, but saving will be
            refused.
          </div>
        ) : null}
      </section>

      <section className="sec">
        <div className="gside">
          <div className="stack">
            {(items ?? []).length === 0 ? (
              <div className="panel panel-wash">
                <p className="muted" style={{ margin: 0 }}>
                  Nothing yet.
                </p>
              </div>
            ) : (
              (items ?? []).map((item) => <MediaForm key={item.id} item={item} />)
            )}
          </div>
          <MediaForm />
        </div>
      </section>
    </main>
  );
}