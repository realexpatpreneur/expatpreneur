import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { ProposePartnerForm } from "./forms";

export const metadata = { title: "Partnered events, the Local Admin workspace" };

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("partnered_events")
    .select("id, title, partner, partner_gets, members_get, conditions, status, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/admin/events">Events</Link>
          </p>
          <h1>Partnered events</h1>
          <p className="lead">
            A sponsor paying for an event, or putting their name on one.
            Global approves these before anything is agreed.
          </p>
          {done ? (
            <div className="notice good">
              Sent. The Global team has been told.
            </div>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
            <ProposePartnerForm />

            <div className="stack">
              <div className="panel">
                <h3>What you have proposed</h3>
                {(requests ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Nothing yet.
                  </p>
                ) : (
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(requests ?? []).map((request) => (
                      <div className="rowlink" key={request.id}>
                        <div>
                          <b>{request.title}</b>
                          <div className="muted small">
                            {request.partner}. {timeAgo(request.created_at)}
                            {request.conditions ? `. ${request.conditions}` : ""}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span
                            className={`chip ${request.status === "approved" ? "mint" : ""}`}
                          >
                            {request.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel wash">
                <h3>The usual conditions</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  No member data is shared with the partner, and no sales
                  pitch at the table. Global can add others.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}