import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// pubPage in the prototype: the header, the page, the footer, inside .pub.
export function PublicPage({
  active,
  children,
}: {
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pub">
      <SiteHeader active={active} />
      {children}
      <SiteFooter />
    </div>
  );
}