import { livePage } from "@/lib/pages";
import { Blocks, type BlockData } from "@/components/blocks";

// A page that has been published from the builder shows its blocks.
// Until then it shows the version in the code, which is what sits
// inside this component. Nothing changes for a page nobody has
// published, and nothing is lost if somebody unpublishes one.
export async function PageBlocks({
  slug,
  data,
  children,
}: {
  slug: string;
  data?: BlockData;
  children: React.ReactNode;
}) {
  const page = await livePage(slug);
  if (!page || !(page.blocks ?? []).length) return <>{children}</>;
  return <Blocks blocks={page.blocks} data={data ?? {}} />;
}