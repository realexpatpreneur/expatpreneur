import Link from "next/link";
import { requireAdmin } from "@/lib/access";

export const metadata = { title: "Saved, the Local Admin workspace" };

// Confirmation for saved settings, limits and Circle changes.
export default async function AdminSavedPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from = "settings" } = await searchParams;
  await requireAdmin();

  const back: Record<string, [string, string]> = {
    settings: ["/admin/settings", "Village settings"],
    mix: ["/admin/mix", "Village mix"],
    circles: ["/admin/circles", "Circles"],
    members: ["/admin/members", "Members"],
  };

  const [href, label] = back[from] ?? back.settings;

  return (
    <main className="wrap">
        <section className="sec">
          <h1>Saved</h1>
          <p className="lead">
            {from === "mix"
              ? "The new limits apply to requests from now on, and the Global team has been told."
              : "Your changes are live."}
          </p>
          <p>
            <Link className="btn btn-primary" href={href}>
              Back to {label}
            </Link>
          </p>
        </section>
    </main>
  );
}