import { requireAdmin } from "@/lib/access";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata = { title: "Local Admin, ExpatPreneurs Global" };

// Every page under /admin sits inside the workspace: the icon rail, the
// sidebar for this space, and the bar across the top. Without this the
// pages rendered on their own, with no navigation and no margin.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <WorkspaceShell
      kind="admin"
      searchText="Search members, requests, events"
      searchHref="/admin/members"
    >
      {children}
    </WorkspaceShell>
  );
}