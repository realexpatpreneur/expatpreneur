import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { TemplateForm } from "../forms";

export default async function EmailTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { key } = await params;
  const { done } = await searchParams;
  await requireGlobal();
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("email_templates")
    .select("key, name, sent_when, subject, body, button_label, button_path, active")
    .eq("key", key)
    .maybeSingle();

  if (!template) notFound();

  return (
    <main className="wrap">
        <section className="sec">
          <p className="muted small">
            <Link href="/global/emails">Emails</Link>
          </p>
          <h1>{template.name}</h1>
          <p className="lead">Sent when: {template.sent_when.toLowerCase()}.</p>
          {done ? <div className="flag ok">Saved.</div> : null}
          <p>
            <Link className="btn btn-ghost" href={`/global/emails/${key}/preview`}>
              Preview
            </Link>
          </p>
        </section>

        <section className="sec">
          <div className="gside">
            <TemplateForm template={template} />

            <div className="stack">
              <div className="panel panel-wash">
                <h3>Placeholders</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Anything in braces is filled in when the email is sent.
                </p>
                <ul>
                  <li>{"{first_name}"}</li>
                  <li>{"{village}"}</li>
                  <li>{"{local_admins}"}</li>
                  <li>{"{circle}"}</li>
                  <li>{"{event}"}</li>
                  <li>{"{reference}"}</li>
                  <li>{"{link}"}</li>
                </ul>
                <p className="muted small">
                  A placeholder that does not belong to this email comes out
                  empty rather than breaking it.
                </p>
              </div>

              <div className="panel panel-wash">
                <h3>What it looks like</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Every email carries the ExpatPreneurs heading, the message,
                  the button if there is one, and a line to the member&apos;s
                  own settings.
                </p>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}