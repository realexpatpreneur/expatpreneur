import { requireGlobal } from "@/lib/access";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata = { title: "Global team, ExpatPreneurs Global" };

// As with /admin: the whole Global workspace lives inside the shell.
export default async function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGlobal();

  return (
    <WorkspaceShell
      kind="global"
      searchText="Search the whole network"
      searchHref="/admin/members"
    >
      {children}
    </WorkspaceShell>
  );
}