import { SiteFooter } from "@/components/site-footer";

// A public page: the page itself and the footer. The header is in the
// root layout, on every page of the site.
export function PublicPage({
  active,
  children,
}: {
  active?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pub" data-active={active}>
      {children}
      <SiteFooter />
    </div>
  );
}