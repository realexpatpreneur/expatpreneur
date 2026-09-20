import Link from "next/link";
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
    <main className="wrap">
      <section className="band">
        <h1>Members</h1>
        <p className="lead">Who is here, where they sit, and how they are doing.</p>
        <form className="searchrow">
          <input name="q" defaultValue={q} placeholder="Name or email" />
          <button className="btn" type="submit">
            Search
          </button>
        </form>
        <div className="tabs">
          {[
            ["all", "All"],
            ["onboarding", "Still onboarding"],
            ["unplaced", "Not in a Circle"],
            ["paid", "Paid"],
          ].map(([key, label]) => (
            <Link
              key={key}
              className={`chip ${show === key ? "mint" : ""}`}
              href={`/admin/members?show=${key}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="band">
        {(members ?? []).length === 0 ? (
          <div className="panel wash">
            <p className="muted" style={{ margin: 0 }}>
              Nobody matches that.
            </p>
          </div>
        ) : (
          <div className="rows">
            {(members ?? []).map((member) => (
              <Link className="rowlink" key={member.id} href={`/admin/members/${member.id}`}>
                <div>
                  <b>{member.full_name}</b>
                  <div className="muted small">
                    {member.email}. {villageName(member.village_id)}.{" "}
                    {circleName(member.circle_id)}.
                  </div>
                </div>
                <div className="rowmeta">
                  {member.plan === "paid" ? (
                    <span className="chip mint">Paid</span>
                  ) : null}
                  <span className="chip">{member.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}