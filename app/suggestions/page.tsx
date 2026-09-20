import { WorkspaceShell } from "@/components/workspace-shell";
import Link from "next/link";
import { requireMember } from "@/lib/member";
import { SuggestionForm } from "./form";

export const metadata = { title: "Suggestion box, ExpatPreneurs Global" };

export default async function SuggestionsPage() {
  const member = await requireMember("/suggestions");

  return (
    <WorkspaceShell kind="member" nav="/suggestions">
        <section className="sec">
          <h1>Suggestion box</h1>
          <p className="lead">
            How could ExpatPreneurs be better? Local Admins and the Global team
            read everything that comes in.
          </p>
        </section>
        <section className="sec">
          <div className="gside">
            <SuggestionForm villageName={member.villageName} />
            <div className="stack">
              <div className="panel">
                <h3>Who reads it</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Suggestions about your Village go to your Local Admins. Ones
                  about the whole community go to the Global team. Nothing you
                  write here appears in the Village or in any WhatsApp group.
                </p>
              </div>
              <div className="panel panel-wash">
                <h3>This is not a report</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  If something has happened between you and another member,
                  report it instead. Those go straight to the Local Admins and
                  are handled privately.
                </p>
                <Link className="btn btn-ghost" href="/report">
                  Report something
                </Link>
              </div>
            </div>
          </div>
        </section>
      </WorkspaceShell>
  );
}