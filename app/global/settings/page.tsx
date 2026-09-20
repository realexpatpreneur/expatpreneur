import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { SiteHeader } from "@/components/site-header";
import { GeneralForm, IntegrationRow, SecurityForm } from "./forms";

export const metadata = { title: "System settings, the Global team" };

const tabs = [
  ["general", "General"],
  ["integrations", "Integrations"],
  ["security", "Security"],
] as const;

export default async function SystemSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "general" } = await searchParams;
  await requireGlobal();
  const supabase = await createClient();

  const { data: rows } = await supabase.from("settings").select("key, value");
  const values = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));

  // Three of these are decided by whether the keys are set, so the page
  // reports what is true rather than what somebody typed.
  const emailLive = Boolean(process.env.RESEND_API_KEY);
  const paymentsLive = Boolean(process.env.STRIPE_SECRET_KEY);
  const liveLive = Boolean(process.env.LIVEKIT_API_KEY);

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/global">The Global team</Link>
          </p>
          <h1>System settings</h1>
          <p className="lead">
            Languages, integrations, security and backups.
          </p>
          <div className="tabs">
            {tabs.map(([key, label]) => (
              <Link
                className={`chip ${show === key ? "mint" : ""}`}
                href={`/global/settings?show=${key}`}
                key={key}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="band">
          <div className="stack" style={{ maxWidth: 820 }}>
            {show === "general" ? <GeneralForm values={values} /> : null}

            {show === "integrations" ? (
              <>
                <div className="panel">
                  <div className="rows">
                    <IntegrationRow
                      name="Email delivery"
                      settingKey="integration_email"
                      status={values.integration_email ?? ""}
                      fixed={emailLive ? "Connected" : "Not connected yet"}
                    />
                    <IntegrationRow
                      name="Payments"
                      settingKey="integration_payments"
                      status={values.integration_payments ?? ""}
                      fixed={paymentsLive ? "Connected" : "Not connected yet"}
                    />
                    <IntegrationRow
                      name="Live rooms and recording"
                      settingKey="integration_live"
                      status={values.integration_live ?? ""}
                      fixed={liveLive ? "Connected" : "Not connected yet"}
                    />
                    <IntegrationRow
                      name="YouTube"
                      settingKey="integration_youtube"
                      status={values.integration_youtube ?? ""}
                    />
                    <IntegrationRow
                      name="Podcast host"
                      settingKey="integration_podcast"
                      status={values.integration_podcast ?? ""}
                    />
                    <IntegrationRow
                      name="Calendar invites"
                      settingKey="integration_calendar"
                      status={values.integration_calendar ?? ""}
                      fixed="Connected"
                    />
                    <IntegrationRow
                      name="Newsletter"
                      settingKey="integration_newsletter"
                      status={values.integration_newsletter ?? ""}
                    />
                    <IntegrationRow
                      name="CRM"
                      settingKey="integration_crm"
                      status={values.integration_crm ?? ""}
                    />
                  </div>
                </div>

                <div className="panel wash">
                  <h3>What the chips mean</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Email, payments and live rooms say Connected when their
                    keys are set in the hosting, so nobody can mark them
                    connected by typing it. The rest are notes, because
                    nothing on the platform reads them yet.
                  </p>
                </div>
              </>
            ) : null}

            {show === "security" ? (
              <>
                <SecurityForm values={values} />
                <div className="panel">
                  <h3>The record</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Every decision a leader makes is recorded: memberships,
                    roles, moderation, and anything called off.
                  </p>
                  <Link className="btn" href="/global/audit">
                    Audit log
                  </Link>
                </div>
                <div className="panel wash">
                  <h3>Backups</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Supabase takes the backups and holds them. Downloading one
                    is done there, under Database, Backups, with the project
                    owner&apos;s account.
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}