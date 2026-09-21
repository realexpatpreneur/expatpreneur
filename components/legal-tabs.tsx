import Link from "next/link";

const TABS: [string, string][] = [
  ["/legal/privacy", "Privacy"],
  ["/legal/terms", "Terms"],
  ["/legal/cookies", "Cookies"],
];

// The three legal pages sit together, as the prototype has them, so
// somebody reading one can find the other two.
export function LegalTabs({ here }: { here: string }) {
  return (
    <div className="tabs">
      {TABS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={here === href ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </div>
  );
}