import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { siteUrl } from "@/lib/site";
import { Stat, Table, SecHead } from "@/components/admin-bits";
import { Av } from "@/components/bits";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";
import { timeAgo } from "@/lib/member";
import {
  ImportForm,
  RemindButton,
  DeadlineForm,
  CloseOutButton,
  ComplimentaryToggle,
} from "./forms";

export const metadata = { title: "Re-enrolment, Local Admin" };

const LABEL: Record<string, string> = {
  invited: "Invited, not yet",
  reminded: "Reminded",
  re_enrolled: "Re-enrolled",
  declined: "Stepping away",
  removed: "To remove",
};

export default async function ReEnrolmentPage({
  searchParams,
}: {
  searchParams: Promise<{ village?: string }>;
}) {
  const { village: chosen = "" } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  // A Local Admin has one Village and lands on it. The Global team has
  // all of them, which is who does this at launch, so they choose.
  const { data: mine } = admin.villageIds.length
    ? await supabase
        .from("villages")
        .select("id, slug, name")
        .in("id", admin.villageIds)
        .order("name")
    : { data: [] };

  const villageId =
    (mine ?? []).find((v) => v.slug === chosen)?.id ??
    [...admin.villageIds].sort()[0] ??
    null;

  const [{ data: village }, { data: people }] = await Promise.all([
    villageId
      ? supabase
          .from("villages")
          .select("id, name, reenrol_deadline")
          .eq("id", villageId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    villageId
      ? supabase
          .from("founding_invites")
          .select(
            "id, full_name, email, phone, status, last_contact, token, complimentary"
          )
          .eq("village_id", villageId)
          .order("full_name")
      : Promise.resolve({ data: [] }),
  ]);

  const rows = people ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;

  // Nobody was written to without an address, so the admin needs to know
  // which of them to reach another way.
  const noAddress = rows
    .filter((r) => !r.email && !["re_enrolled", "declined", "removed"].includes(r.status))
    .map((r) => r.full_name);
  const site = siteUrl;

  return (
    <>
      <PageHead
        title="Add someone directly"
        sub={`Putting people into ${village?.name ?? "the Village"} by hand, without waiting for an invitation request. This is also how the current WhatsApp members were brought onto the platform.`}
      />

      {(mine ?? []).length > 1 ? (
        <div className="tabs" style={{ marginBottom: 16 }}>
          {(mine ?? []).map((v) => (
            <Link
              className={`chip ${v.id === villageId ? "chip-mint" : ""}`}
              href={`/admin/re-enrolment?village=${v.slug}`}
              key={v.id}
            >
              {v.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="g3 g4">
        <Stat label="On the list" value={rows.length} note="From the WhatsApp group" />
        <Stat label="Re-enrolled" value={count("re_enrolled")} note="They have an account" />
        <Stat
          label="Still waiting"
          value={count("invited") + count("reminded")}
          note="Invited, not yet through"
        />
        <Stat label="Stepping away" value={count("declined")} note="They told us" />
      </div>

      {noAddress.length ? (
        <div className="panel panel-wash" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14 }}>
            {noAddress.length === 1
              ? "One person has no email address"
              : `${noAddress.length} people have no email address`}
          </h3>
          <p className="muted small" style={{ marginTop: 6 }}>
            Nothing was written to them. Send their link by WhatsApp: it is
            beside their name in the list. {noAddress.join(", ")}.
          </p>
        </div>
      ) : null}

      <div className="gside" style={{ marginTop: 22 }}>
        <div className="stack">
          <div className="panel">
            <SecHead title="The list" />
            {rows.length === 0 ? (
              <p className="muted small">
                Nobody on it yet. Paste the WhatsApp list beside this.
              </p>
            ) : (
              <Table head={["Member", "Status", "Last contact", "", ""]}>
                {rows.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <Av name={person.full_name} className="av-sm" />
                        <div>
                          <b>{person.full_name}</b>
                          <div className="muted small">
                            {person.email ?? person.phone ?? "No contact yet"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`chip ${
                          person.status === "re_enrolled"
                            ? "chip-mint"
                            : person.status === "declined" || person.status === "removed"
                              ? ""
                              : "chip-sun"
                        }`}
                      >
                        {LABEL[person.status] ?? person.status}
                      </span>
                      {person.complimentary ? (
                        <span className="chip chip-mint" style={{ marginLeft: 6 }}>
                          Complimentary
                        </span>
                      ) : null}
                    </td>
                    <td className="hide-m">
                      {person.last_contact ? timeAgo(person.last_contact) : "Not yet"}
                    </td>
                    <td>
                      {person.status === "re_enrolled" ? null : (
                        <>
                          <RemindButton id={person.id} />
                          <ComplimentaryToggle
                            id={person.id}
                            on={Boolean(person.complimentary)}
                          />
                        </>
                      )}
                    </td>
                    <td style={{ minWidth: 200 }}>
                      {person.status === "re_enrolled" ? null : (
                        <span className="muted small" style={{ wordBreak: "break-all" }}>
                          {site}/re-enrol/{person.token}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </div>

          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>After the deadline</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              People who did not re-enrol become tasks to remove from the
              WhatsApp group. Nobody is removed automatically, because the
              last thing you want is a machine cutting off a member who was
              simply on holiday.
            </p>
            {villageId ? <CloseOutButton villageId={villageId} /> : null}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 style={{ fontSize: 14 }}>Add people</h3>
            {villageId ? <ImportForm villageId={villageId} /> : null}
          </div>

          <div className="panel">
            <h3 style={{ fontSize: 14 }}>Deadline</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              {village?.reenrol_deadline
                ? `Currently ${new Date(village.reenrol_deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
                : "None set."}
            </p>
            {villageId ? (
              <DeadlineForm
                villageId={villageId}
                deadline={village?.reenrol_deadline ?? null}
              />
            ) : null}
          </div>

          <div className="panel panel-wash">
            <h3 style={{ fontSize: 14 }}>How the link works</h3>
            <p className="muted small" style={{ marginTop: 6 }}>
              Each person has their own address. Send it by WhatsApp or email.
              It opens a page with their details already filled in, where they
              confirm, set a password and keep their founding member badge, or
              say it is not for them.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}