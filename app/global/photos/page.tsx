import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { SiteHeader } from "@/components/site-header";
import { PhotoForm, RetireButton, RotationForm } from "./forms";

export const metadata = { title: "Photos and consent, the Global team" };

const consentLabel: Record<string, string> = {
  signed: "Signed",
  waiting: "Waiting",
  no_faces: "No faces in focus",
};

export default async function PhotosConsentPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: photos }, { data: settings }, { data: people }] =
    await Promise.all([
      supabase
        .from("photo_uses")
        .select("id, who, profile_id, appears_on, taken_on, consent, consent_note, review_by, retired_at")
        .order("created_at", { ascending: false }),
      supabase.from("settings").select("key, value"),
      supabase
        .from("member_records")
        .select("id, full_name")
        .eq("status", "active")
        .order("full_name")
        .limit(300),
    ]);

  const values = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const live = (photos ?? []).filter((p) => !p.retired_at);
  const retired = (photos ?? []).filter((p) => p.retired_at);

  const today = new Date().toISOString().slice(0, 10);
  const dueForReview = live.filter((p) => p.review_by && p.review_by <= today);
  const waiting = live.filter((p) => p.consent === "waiting");

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Photos and consent</h1>
          <p className="lead">
            Who appears on the public pages, and when each photograph is next
            reviewed.
          </p>
        </section>

        <section className="band">
          <div className="grid">
            <div className="card">
              <div className="kind">Photographs in use</div>
              <p>
                <b style={{ fontSize: 24 }}>{live.length}</b>
              </p>
            </div>
            <div className="card">
              <div className="kind">Permissions signed</div>
              <p>
                <b style={{ fontSize: 24 }}>
                  {live.filter((p) => p.consent === "signed").length}
                </b>
              </p>
            </div>
            <div className="card">
              <div className="kind">Waiting for a signature</div>
              <p>
                <b style={{ fontSize: 24 }}>{waiting.length}</b>
              </p>
            </div>
            <div className="card">
              <div className="kind">Due for review</div>
              <p>
                <b style={{ fontSize: 24 }}>{dueForReview.length}</b>
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="cols">
            <div className="stack">
              <div className="panel">
                <h3>In use</h3>
                {live.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing recorded yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {live.map((photo) => (
                      <div className="rowlink" key={photo.id}>
                        <div>
                          <b>{photo.who}</b>
                          <div className="muted small">
                            {photo.appears_on}
                            {photo.taken_on ? `. Taken ${photo.taken_on}` : ""}
                            {photo.review_by ? `. Review by ${photo.review_by}` : ". No review date"}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span
                            className={`chip ${
                              photo.consent === "signed"
                                ? "mint"
                                : photo.consent === "waiting"
                                  ? "sun"
                                  : ""
                            }`}
                          >
                            {consentLabel[photo.consent] ?? photo.consent}
                          </span>
                          <RetireButton id={photo.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {retired.length ? (
                <div className="panel">
                  <h3>Taken down</h3>
                  <div className="rows" style={{ marginTop: 12 }}>
                    {retired.map((photo) => (
                      <div className="rowlink" key={photo.id}>
                        <div>
                          <b>{photo.who}</b>
                          <div className="muted small">
                            {photo.appears_on}. {photo.consent_note ?? ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="panel wash">
                <h3>How we use member photographs</h3>
                <ul>
                  <li>Only a few members appear on permanent pages</li>
                  <li>Everyone signs a photo permission before we publish</li>
                  <li>Photographs are rotated so nobody stays on the site indefinitely</li>
                  <li>A member can ask us to remove their photograph at any time, and we do it</li>
                  <li>Wide shots and event photographs carry the pages between rotations</li>
                </ul>
                <p className="muted small">
                  When a member leaves, their photographs are marked to come
                  down at the next rotation, and sooner if they ask. The
                  platform does that marking itself.
                </p>
              </div>
            </div>

            <div className="stack">
              <PhotoForm people={people ?? []} />
              <RotationForm values={values} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}