import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { Table } from "@/components/admin-bits";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/access";

export const metadata = { title: "Members, Admin" };

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  const { q = "", show = "all" } = await searchParams;
  const admin = await requireAdmin();
  const supabase = await createClient();

  // The full record, including the email, comes from the admin view. The
  // profiles table no longer hands those columns to anybody signed in.
  let query = supabase
    .from("member_records")
    .select("id, full_name, email, headline, status, plan, village_id, circle_id")
    .order("full_name")
    .limit(200);

  if (!admin.isGlobal && admin.villageIds.length) {
    query = query.in("village_id", admin.villageIds);
  }
  if (show === "onboarding") query = query.eq("status", "onboarding");
  if (show === "unplaced") query = query.is("circle_id", null);
  if (show === "paid") query = query.eq("plan", "paid");
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const [{ data: members }, { data: villages }, { data: circles }] =
    await Promise.all([
      query,
      supabase.from("villages").select("id, name"),
      supabase.from("circles").select("id, name"),
    ]);

  const villageName = (id: string | null) =>
    villages?.find((v) => v.id === id)?.name ?? "No Village";
  const circleName = (id: string | null) =>
    circles?.find((c) => c.id === id)?.name ?? "Not placed";

  return (
    <>
      <PageHead
        title="Members"
        sub="Who is here, where they sit, and how they are doing."
        actions={
          <Link className="btn btn-ghost btn-sm" href="/admin/care">
            Member care
          </Link>
        }
      />

      <form className="searchrow">
        <label className="input" style={{ maxWidth: 520 }}>
          <Ic name="search" />
          <input name="q" defaultValue={q} placeholder="Name or email" />
        </label>
        <button className="btn btn-ghost" type="submit">
          Search
        </button>
      </form>

      <div className="filters">
        {(
          [
            ["all", "All"],
            ["onboarding", "Still onboarding"],
            ["unplaced", "Not in a Circle"],
            ["paid", "Paid"],
          ] as [string, string][]
        ).map(([key, label]) => (
          <Link
            key={key}
            className={`fchip ${show === key ? "on" : ""}`}
            href={`/admin/members?show=${key}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {(members ?? []).length === 0 ? (
        <div className="panel panel-wash">
          <p className="muted" style={{ margin: 0 }}>
            Nobody matches that.
          </p>
        </div>
      ) : (
        <Table head={["Member", "Circle", "Village", "Plan", "Status"]}>
          {(members ?? []).map((member) => (
            <tr key={member.id}>
              <td>
                <Link className="row" href={`/admin/members/${member.id}`}>
                  <Av name={member.full_name} className="av-sm" />
                  <div>
                    <b>{member.full_name}</b>
                    <div className="muted small">{member.email}</div>
                  </div>
                </Link>
              </td>
              <td>
                {member.circle_id ? (
                  circleName(member.circle_id)
                ) : (
                  <span className="chip chip-sun">Not placed</span>
                )}
              </td>
              <td className="hide-m">{villageName(member.village_id)}</td>
              <td>
                <span className={`tiertag ${member.plan === "paid" ? "" : "free"}`}>
                  {member.plan === "paid" ? "Paid" : "Member"}
                </span>
              </td>
              <td>
                <span className="chip">{member.status}</span>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}