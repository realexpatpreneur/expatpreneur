import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";
import { TransferForm } from "./form";

export const metadata = { title: "Moving city, ExpatPreneurs Global" };

export default async function TransferPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const member = await requireMember("/settings/transfer");
  const supabase = await createClient();

  const [{ data: villages }, { data: asked }] = await Promise.all([
    supabase
      .from("villages")
      .select("id, name, status")
      .in("status", ["open", "launching"])
      .order("name"),
    supabase
      .from("transfer_requests")
      .select("id, to_village, moving_on, status, created_at")
      .eq("profile_id", member.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "another Village";

  return (
    <WorkspaceShell kind="member" nav="/settings/transfer">
        <section className="band">
          <p className="muted small">
            <Link href="/settings">Settings</Link>
          </p>
          <h1>Moving city</h1>
          <p className="lead">
            Your profile, your history and the people you know stay with you.
            Only the Village and the Circle change.
          </p>
          {done ? (
            <div className="notice good">
              Asked. The admins at both ends have been told, and somebody will
              be in touch before you move.
            </div>
          ) : null}
        </section>

        <section className="band">
          <div className="cols">
            <TransferForm
              villages={(villages ?? []).filter((v) => v.id !== member.village_id)}
            />

            <div className="stack">
              {(asked ?? []).length ? (
                <div className="panel">
                  <h3>What you have asked</h3>
                  <div className="rows" style={{ marginTop: 12 }}>
                    {(asked ?? []).map((request) => (
                      <div className="rowlink" key={request.id}>
                        <div>
                          <b>{villageName(request.to_village)}</b>
                          <div className="muted small">
                            {timeAgo(request.created_at)}
                          </div>
                        </div>
                        <div className="rowmeta">
                          <span className="chip">{request.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="panel wash">
                <h3>What happens next</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  The Local Admins where you are going place you in a Circle,
                  and the ones you are leaving take you out of the WhatsApp
                  groups. Nothing changes until they do it.
                </p>
              </div>

              <div className="panel wash">
                <h3>Your city is not listed?</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Tell us where you are going and we will count you in when a
                  Village opens there.
                </p>
                <Link className="btn" href="/villages/suggest">
                  Suggest a city
                </Link>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}