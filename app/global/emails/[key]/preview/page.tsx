import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";

// What the email looks like, with the placeholders filled in with example
// values. The prototype has this for the welcome and the re-enrolment
// invitation; every template has one here.
export default async function EmailPreviewPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: template }, { data: settings }] = await Promise.all([
    supabase
      .from("email_templates")
      .select("key, name, sent_when, subject, body, button_label, button_path")
      .eq("key", key)
      .maybeSingle(),
    supabase.from("settings").select("key, value"),
  ]);

  if (!template) notFound();

  const values = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));

  const example: Record<string, string> = {
    first_name: "Omar",
    village: "Dubai",
    local_admins: "Nadia and Rahel",
    circle: "Circle 02",
    event: "Founders dinner",
    reference: "EP-7K3M",
    link: `${values.domain ?? "expatpreneurs.com"}/home`,
  };

  const fill = (text: string) =>
    Object.entries(example).reduce(
      (out, [name, value]) => out.split(`{${name}}`).join(value),
      text
    );

  const lines = fill(template.body).split("\n").filter((line) => line.trim());

  return (
    <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href={`/global/emails/${template.key}`}>{template.name}</Link>
          </p>
          <h1>Preview</h1>
          <p className="lead">
            Sent when: {template.sent_when.toLowerCase()}. The placeholders
            are filled in with example values.
          </p>
        </section>

        <section className="band">
          <div className="panel" style={{ maxWidth: 620 }}>
            <p className="muted small">
              From: ExpatPreneurs {example.village}
              <br />
              Subject: {fill(template.subject)}
            </p>

            <div className="panel wash" style={{ marginTop: 14 }}>
              <p>
                <b>ExpatPreneurs</b>
              </p>
              <h3 style={{ marginTop: 10 }}>{fill(template.subject)}</h3>
              {lines.map((line, i) => (
                <p key={i} style={{ marginTop: 10 }}>
                  {line}
                </p>
              ))}
              {template.button_label ? (
                <p style={{ marginTop: 16 }}>
                  <span className="btn primary">{template.button_label}</span>
                </p>
              ) : null}
              <p className="muted small" style={{ marginTop: 16 }}>
                ExpatPreneurs Global.{" "}
                {values.domain ?? "expatpreneurs.com"}. Choose what reaches
                your inbox.
              </p>
            </div>

            <p className="muted small" style={{ marginTop: 12 }}>
              This is how it is laid out. Send yourself a test from the
              template page to see it in a real inbox.
            </p>
          </div>
        </section>
    </main>
  );
}