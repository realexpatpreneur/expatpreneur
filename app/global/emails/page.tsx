import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Emails, the Global team" };

export default async function EmailsPage() {
  await requireGlobal();
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("email_templates")
    .select("key, name, sent_when, active, updated_at")
    .order("position");

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>Emails</h1>
          <p className="lead">
            Sent automatically by the platform. Each one is edited here.
          </p>
        </section>

        <section className="band">
          <div className="rows">
            {(templates ?? []).map((template) => (
              <Link
                className="rowlink"
                href={`/global/emails/${template.key}`}
                key={template.key}
              >
                <div>
                  <b>{template.name}</b>
                  <div className="muted small">{template.sent_when}</div>
                </div>
                <div className="rowmeta">
                  <span className={`chip ${template.active ? "mint" : ""}`}>
                    {template.active ? "Live" : "Off"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}