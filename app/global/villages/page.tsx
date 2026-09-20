import { createClient } from "@/lib/supabase/server";
import { VillageForm } from "../forms";

export default async function GlobalVillagesPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const supabase = await createClient();

  const { data: villages } = await supabase
    .from("villages")
    .select("*")
    .order("name");

  return (
    <main className="wrap">
      <section className="band">
        <h1>Villages</h1>
        <p className="lead">
          A Village opens where there are enough members, a shared language and
          someone to run it.
        </p>
        {done ? <div className="notice good">Saved.</div> : null}
      </section>

      <section className="band">
        <div className="cols">
          <div className="stack">
            {(villages ?? []).map((village) => (
              <VillageForm key={village.id} village={village} />
            ))}
          </div>
          <VillageForm />
        </div>
      </section>
    </main>
  );
}