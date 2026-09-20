import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { SuggestionAdminForm } from "./form";

export default async function AdminSuggestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();

  const { data: suggestion } = await supabase
    .from("suggestions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!suggestion) notFound();

  const { data: author } = suggestion.author_id
    ? await supabase
        .from("profiles")
        .select("id, full_name, headline")
        .eq("id", suggestion.author_id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="wrap">
      <section className="sec">
        <p className="muted small">
          <Link href="/admin/suggestions">Suggestion box</Link>
        </p>
        <h1>{suggestion.title}</h1>
        <p className="lead">
          {suggestion.about === "community" ? "The whole community" : "Village"}.{" "}
          {timeAgo(suggestion.created_at)}.
        </p>
        {done ? <div className="flag ok">Saved.</div> : null}
      </section>

      <section className="sec">
        <div className="gside">
          <div className="stack">
            <div className="panel">
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{suggestion.body}</p>
            </div>
            {suggestion.anonymous ? (
              <div className="panel panel-wash">
                <h3>Sent anonymously</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  No name, no email and no Circle were stored with this
                  suggestion, so it cannot be traced or replied to.
                </p>
              </div>
            ) : (
              <div className="panel">
                <h3>From</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  <Link href={`/members/${author?.id}`}>{author?.full_name}</Link>
                  {author?.headline ? `, ${author.headline}` : ""}
                </p>
              </div>
            )}
          </div>

          <SuggestionAdminForm
            id={id}
            status={suggestion.status}
            note={suggestion.admin_note}
            toGlobal={suggestion.to_global}
          />
        </div>
      </section>
    </main>
  );
}