import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Share, ExpatPreneurs Global" };

// Sharing sends people to the ExpatPreneurs page rather than to YouTube,
// so they land inside the feed rather than beside it.
export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  const member = await whoIsHere();
  const supabase = await createClient();

  const { data: media } = item
    ? await supabase
        .from("media_items")
        .select("slug, title, kind")
        .eq("slug", item)
        .maybeSingle()
    : { data: null };

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://expatpreneur.vercel.app";
  const link = media ? `${site}/watch/${media.slug}` : `${site}/watch`;
  const title = media?.title ?? "Watch and Listen";

  return (
    <>
      <SiteHeader signedIn={Boolean(member)} />
      <main className="wrap">
        <section className="band">
          <div className="panel" style={{ maxWidth: 520 }}>
            <h2>Share</h2>
            <p className="muted small" style={{ marginTop: 4 }}>
              {title}
            </p>

            <label className="field" style={{ marginTop: 14 }}>
              <span>Link</span>
              <input value={link} readOnly />
            </label>

            <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
              <a
                className="btn"
                href={`https://wa.me/?text=${encodeURIComponent(`${title} ${link}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="btn"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <a
                className="btn"
                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(link)}`}
              >
                Email
              </a>
            </div>

            <p style={{ marginTop: 16 }}>
              <Link
                className="btn primary"
                href={media ? `/watch/${media.slug}` : "/watch"}
              >
                Done
              </Link>
            </p>
          </div>
        </section>
      </main>
      {member ? null : <SiteFooter />}
    </>
  );
}