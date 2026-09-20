import Link from "next/link";

// The wordmark, exactly as the prototype draws it: the EP mark, then
// Expat with Preneurs in the display serif, then Global in small type.
export function Logo({
  href = "/",
  alt = false,
  small = "Global",
  smallStyle,
}: {
  href?: string;
  alt?: boolean;
  small?: string;
  smallStyle?: React.CSSProperties;
}) {
  return (
    <Link className="logo" href={href}>
      <span className={`mark${alt ? " alt" : ""}`} aria-hidden="true">
        EP
      </span>
      <span className="lgname">
        Expat<span className="serif">Preneurs</span>
      </span>{" "}
      <small style={smallStyle}>{small}</small>
    </Link>
  );
}

export function LogoPlain({ alt = false, smallStyle }: { alt?: boolean; smallStyle?: React.CSSProperties }) {
  return (
    <div className="logo">
      <span className={`mark${alt ? " alt" : ""}`} aria-hidden="true">
        EP
      </span>
      <span className="lgname">
        Expat<span className="serif">Preneurs</span>
      </span>{" "}
      <small style={smallStyle}>Global</small>
    </div>
  );
}