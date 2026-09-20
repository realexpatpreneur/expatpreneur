import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { timeAgo } from "@/lib/member";

export const metadata = { title: "Pages, the Global team" };

export default async function PagesListPage() {
  await requireGlobal();
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("pages")
    .select("slug, title, path, status, updated_at")
    .order("title");

  return (
    <main className="wrap">
        <section className="sec">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Pages</h1>
          <p className="lead">
            The public website, edited in blocks.
          </p>
        </section>

        <section className="sec">
          <div className="divide">
            {(pages ?? []).map((page) => (
              <Link
                className="li linkrow"
                href={`/global/content/${page.slug}`}
                key={page.slug}
              >
                <div>
                  <b>{page.title}</b>
                  <div className="muted small">
                    {page.path}. {timeAgo(page.updated_at)}
                  </div>
                </div>
                <div className="rowmeta">
                  <span className={`chip ${page.status === "live" ? "chip-mint" : ""}`}>
                    {page.status === "live" ? "Live" : "Draft"}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="panel panel-wash" style={{ marginTop: 20 }}>
            <h3>How this works</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Each page is a list of blocks. While a page is a draft, the site
              shows what is written in the code. Publishing makes the site
              show your blocks instead, and taking it back to draft puts the
              original back.
            </p>
          </div>
        </section>
    </main>
  );
}