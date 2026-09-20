import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { Table } from "@/components/admin-bits";
import { Av } from "@/components/bits";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";

const stages: Record<string, string[]> = {
  review: ["new", "with_local"],
  waitlist: ["waitlisted"],
  decided: ["approved", "declined", "recommended"],
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage = "review" } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select("id, full_name, email, city, country, status, created_at, village_id")
    .in("status", stages[stage] ?? stages.review)
    .order("created_at", { ascending: false });

  const { data: villages } = await supabase.from("villages").select("id, name");
  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "No Village yet";

  const rows = (applications ?? []).filter(
    (a) => admin.isGlobal || !a.village_id || admin.villageIds.includes(a.village_id)
  );

  const chipFor = (status: string) =>
    status === "approved" || status === "recommended"
      ? "chip-mint"
      : status === "waitlisted"
        ? "chip-sun"
        : status === "declined"
          ? ""
          : "chip-blue";

  return (
    <>
      <PageHead
        title="Invitation requests"
        sub="Every request is read by a person. Nothing here is automatic."
      />

      <div className="tabs">
        {(
          [
            ["review", "To review"],
            ["waitlist", "Waitlist"],
            ["decided", "Decided"],
          ] as [string, string][]
        ).map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/applications?stage=${key}`}
            aria-current={stage === key ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {rows.length === 0 ? (
          <div className="panel panel-wash">
            <p className="muted" style={{ margin: 0 }}>
              Nothing here at the moment.
            </p>
          </div>
        ) : (
          <Table head={["Applicant", "Where", "Applied", "Status"]}>
            {rows.map((a) => (
              <tr key={a.id} data-go="">
                <td>
                  <Link className="row" href={`/admin/applications/${a.id}`}>
                    <Av name={a.full_name} className="av-sm" />
                    <div>
                      <b>{a.full_name}</b>
                      <div className="muted small">{a.email}</div>
                    </div>
                  </Link>
                </td>
                <td>
                  {a.city}
                  {a.country ? `, ${a.country}` : ""}
                  <div className="muted small">{villageName(a.village_id)}</div>
                </td>
                <td>
                  {new Date(a.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                  })}
                </td>
                <td>
                  <span className={`chip ${chipFor(a.status)}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </>
  );
}