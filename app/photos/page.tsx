import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";

export const metadata = { title: "Photographs, ExpatPreneurs Global" };

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "village" } = await searchParams;
  const member = await requireMember("/photos");
  const supabase = await createClient();

  let query = supabase
    .from("village_gallery")
    .select("id, url, caption, created_at, event_title, event_slug, village_id")
    .order("created_at", { ascending: false })
    .limit(60);

  if (show === "village" && member.village_id) {
    query = query.eq("village_id", member.village_id);
  }

  const { data: photos } = await query;

  return (
    <WorkspaceShell kind="member" nav="/photos">
        <section className="band">
          <h1>Photographs</h1>
          <p className="lead">
            What the rooms actually looked like. Put up by the people who were
            there.
          </p>
          <div className="tabs">
            {[
              ["village", "My Village"],
              ["all", "Everywhere"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={`chip ${show === key ? "mint" : ""}`}
                href={`/photos?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="band">
          {(photos ?? []).length === 0 ? (
            <div className="panel wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing yet. After the next event, add one from the event page.
              </p>
            </div>
          ) : (
            <div className="grid three">
              {(photos ?? []).map((photo) => (
                <div className="card" key={photo.id}>
                  <Link href={`/events/${photo.event_slug}`}>
                    <div className="cover photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.caption ?? ""} />
                    </div>
                    <div className="kind">{photo.event_title}</div>
                    <p>{photo.caption}</p>
                    <div className="meta">{timeAgo(photo.created_at)}</div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </WorkspaceShell>
  );
}