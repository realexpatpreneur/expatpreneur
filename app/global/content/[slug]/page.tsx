import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { PageEditor, AddBlockForm, StatusButton } from "../forms";
import type { Block } from "@/lib/blocks";

export default async function PageEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { slug } = await params;
  const { done } = await searchParams;
  await requireGlobal();
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("slug, title, path, blocks, search_title, search_description, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!page) notFound();

  return (
    <main className="wrap">
        <section className="sec">
          <p className="muted small">
            <Link href="/global/content">Pages</Link>
          </p>
          <h1>{page.title}</h1>
          <p className="lead">
            {page.path}.{" "}
            {page.status === "live"
              ? "Live: the site shows these blocks."
              : "A draft: the site still shows what is in the code."}
          </p>
          {done === "published" ? (
            <div className="flag ok">Published.</div>
          ) : done === "saved" ? (
            <div className="flag ok">Saved as a draft.</div>
          ) : null}
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn btn-ghost" href={page.path} target="_blank">
              Preview
            </Link>
            <StatusButton slug={page.slug} status={page.status} />
          </div>
        </section>

        <section className="sec">
          <PageEditor
            page={{ ...page, blocks: (page.blocks ?? []) as Block[] }}
          />
        </section>

        <section className="sec">
          <AddBlockForm slug={page.slug} />
        </section>
    </main>
  );
}