import Link from "next/link";
import { Ic } from "@/components/icon";

// The prototype's crumbs(). A trail of links with a chevron between
// them, ending in the page you are on, which is a span rather than a
// link because you are already there.
//
// Every item but the last is [label, href]. The last is [label] on its
// own: the page itself.
export function Crumbs({ trail }: { trail: ([string, string] | [string])[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map((item, i) =>
        i < trail.length - 1 && item[1] ? (
          <span key={`${item[0]}-${i}`} style={{ display: "contents" }}>
            <Link href={item[1]}>{item[0]}</Link>
            <Ic name="chev" />
          </span>
        ) : (
          <span key={`${item[0]}-${i}`}>{item[0]}</span>
        )
      )}
    </nav>
  );
}