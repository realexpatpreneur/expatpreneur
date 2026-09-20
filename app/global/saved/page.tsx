import Link from "next/link";
import { requireGlobal } from "@/lib/access";

export const metadata = { title: "Saved, the Global team" };

// Confirmation for Global changes. Each is recorded in the audit log.
export default async function GlobalSavedPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from = "" } = await searchParams;
  await requireGlobal();

  return (
    <main className="wrap">
        <section className="sec">
          <h1>Saved</h1>
          <p className="lead">
            The change is live and recorded in the audit log.
          </p>
          <p>
            <Link className="btn btn-primary" href={from ? `/global/${from}` : "/global"}>
              Back
            </Link>{" "}
            <Link className="btn btn-ghost" href="/global/audit">
              Audit log
            </Link>
          </p>
        </section>
    </main>
  );
}