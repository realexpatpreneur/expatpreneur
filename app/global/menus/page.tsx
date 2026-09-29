import { PageHead } from "@/components/workspace-shell";
import { createClient } from "@/lib/supabase/server";
import { requireGlobal } from "@/lib/access";
import { MenuEditor } from "./forms";

export const metadata = { title: "Menus, ExpatPreneurs Global" };

const MENUS: [string, string][] = [
  ["header", "The header, across the top of every page"],
  ["footer_explore", "Footer, Explore"],
  ["footer_villages", "Footer, Villages"],
  ["footer_marketplace", "Footer, Marketplace"],
  ["footer_stories", "Footer, Stories"],
  ["footer_company", "Footer, Company"],
  ["legal", "Footer, the small print"],
];

// Where a new page gets put so people can find it.
export default async function MenusPage() {
  await requireGlobal();
  const supabase = await createClient();

  const [{ data: items }, { data: pages }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, menu, label, href, position, new_tab, signed_in")
      .order("position"),
    supabase.from("pages").select("title, path, status").order("title"),
  ]);

  return (
    <>
      <PageHead
        title="Menus"
        sub="What appears in the header and the footer. A page nobody links to is a page nobody finds."
      />

      <MenuEditor
        menus={MENUS}
        items={items ?? []}
        pages={(pages ?? []).map((p) => ({
          label: p.title,
          href: p.path,
          live: p.status === "live",
        }))}
      />
    </>
  );
}