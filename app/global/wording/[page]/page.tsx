import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHead } from "@/components/workspace-shell";
import { Ic } from "@/components/icon";
import { textPage } from "@/lib/text-keys";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { WordingForm } from "../forms";

export default async function EditWordingPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  await requireGlobal();

  const spec = textPage(page);
  if (!spec) notFound();

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("page_text")
    .select("key, value")
    .eq("page", page);

  const current = new Map((rows ?? []).map((r) => [r.key, r.value]));

  return (
    <>
      <div className="crumbs">
        <Link href="/global/wording">Wording</Link>
        <Ic name="chev" />
        <span>{spec.name}</span>
      </div>

      <PageHead
        title={spec.name}
        sub={`The wording on ${spec.path}. Leave a box empty to go back to the wording in the build.`}
      />

      <WordingForm
        page={page}
        path={spec.path}
        keys={spec.keys}
        current={Object.fromEntries(current)}
      />
    </>
  );
}