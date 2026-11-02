import { DualPage } from "@/components/dual-page";
import { PublicPage } from "@/components/public-page";
import { Arrow } from "@/components/design/parts";
import { siteUrl } from "@/lib/site";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere } from "@/lib/member";

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

  const site = siteUrl;
  const link = media ? `${site}/watch/${media.slug}` : `${site}/watch`;
  const title = media?.title ?? "Watch and Listen";

  // A visitor gets the designed public page. A member keeps their workspace.
  if (!member) {
    return (
      <PublicPage active="/watch">
        <div className="d-page">
          <section style={{ padding: "72px 0 112px" }}>
            <div className="d-wrap">
              <div className="d-boxed d-form" style={{ maxWidth: 560 }}>
                <h2 className="d-h2">Share</h2>
                <p className="d-small" style={{ marginTop: 8 }}>
                  {title}
                </p>

                <label className="field" style={{ marginTop: 24 }}>
                  <span>Link</span>
                  <input value={link} readOnly />
                </label>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
                  <a
                    className="d-btn d-btn-sm d-btn-line d-shine"
                    href={`https://wa.me/?text=${encodeURIComponent(`${title} ${link}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                  <a
                    className="d-btn d-btn-sm d-btn-line d-shine"
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                  <a
                    className="d-btn d-btn-sm d-btn-line d-shine"
                    href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(link)}`}
                  >
                    Email
                  </a>
                </div>

                <div style={{ marginTop: 32, paddingTop: 26, borderTop: "1px solid #E3E6EA" }}>
                  <Link
                    className="d-btn d-btn-dark d-shine"
                    href={media ? `/watch/${media.slug}` : "/watch"}
                  >
                    Done <Arrow />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </PublicPage>
    );
  }

  return (
    <DualPage member={Boolean(member)} nav="/watch/share" active="/watch/share">
        <section className="sec">
          <div className="panel" style={{ maxWidth: 520 }}>
            <h2>Share</h2>
            <p className="muted small" style={{ marginTop: 4 }}>
              {title}
            </p>

            <label className="field" style={{ marginTop: 16 }}>
              <span>Link</span>
              <input value={link} readOnly />
            </label>

            <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
              <a
                className="btn btn-ghost"
                href={`https://wa.me/?text=${encodeURIComponent(`${title} ${link}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="btn btn-ghost"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <a
                className="btn btn-ghost"
                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(link)}`}
              >
                Email
              </a>
            </div>

            <p style={{ marginTop: 16 }}>
              <Link
                className="btn btn-primary"
                href={media ? `/watch/${media.slug}` : "/watch"}
              >
                Done
              </Link>
            </p>
          </div>
        </section>
      </DualPage>
  );
}
