import { PublicPage } from "@/components/public-page";
import { WorkspaceShell } from "@/components/workspace-shell";

// Some pages serve both: a visitor sees the public site around them, a
// member sees their workspace. One wrapper decides which.
export function DualPage({
  member,
  nav,
  active,
  children,
}: {
  member: boolean;
  nav: string;
  active?: string;
  children: React.ReactNode;
}) {
  if (member) {
    return (
      <WorkspaceShell kind="member" nav={nav}>
        {children}
      </WorkspaceShell>
    );
  }
  return <PublicPage active={active}>{children}</PublicPage>;
}