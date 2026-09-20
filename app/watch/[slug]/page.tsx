import { DualPage } from "@/components/dual-page";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: item } = await supabase
    .from("media_items")
    .select("show_slug, *")
    .eq("slug", slug)
    .maybeSingle();

  if (!item) notFound();

  return (
    <DualPage member={Boolean(user)} nav="/watch" active="/watch">
        <section className="band">
          <p className="muted small">
            <Link href="/watch">Watch and Listen</Link>
          </p>
          <h1>{item.title}</h1>
          <p className="lead">{item.summary}</p>
          <p>
            <span className="chip">{item.kind}</span>{" "}
            {item.duration ? <span className="chip">{item.duration}</span> : null}{" "}
            {item.member_only ? <span className="chip">Members only</span> : null}
          </p>
          {item.external_url ? (
            <p>
              <a
                className="btn primary"
                href={item.external_url}
                target="_blank"
                rel="noreferrer"
              >
                {item.kind === "episode" ? "Listen" : "Watch"}
              </a>
            </p>
          ) : null}
        </section>

        {item.body ? (
          <section className="band">
            <div className="panel" style={{ maxWidth: 760 }}>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{item.body}</p>
            </div>
          </section>
        ) : null}

        {user ? null : (
          <section className="band">
            <div className="band cta">
              <h2>This is what the network sounds like</h2>
              <p style={{ color: "#fff" }}>
                Most of what happens here is between members, in their own
                cities.
              </p>
              <Link className="btn" href="/apply">
                Request an invitation
              </Link>
            </div>
          <section className="band">
          <div className="row">
            <Link className="btn" href={`/watch/share?item=${slug}`}>
              Share this
            </Link>
            {item.show_slug ? (
              <Link className="btn" href={`/watch/show/${item.show_slug}`}>
                The whole show
              </Link>
            ) : null}
          </div>
        </section>

        </section>
        )}
      </DualPage>
        );
}