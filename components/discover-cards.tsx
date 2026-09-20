import Link from "next/link";

const TONES = ["dc-blue", "dc-mint", "dc-navy", "dc-sun", "dc-pink"];

// dcard: a colour block with a kicker, then the name, a line about it
// and one line of detail underneath.
export function DCard({
  href,
  kicker,
  title,
  sub,
  meta,
  image,
  i = 0,
}: {
  href: string;
  kicker?: string | null;
  title: string;
  sub?: string | null;
  meta?: string | null;
  image?: string | null;
  i?: number;
}) {
  return (
    <Link className="dcard" href={href}>
      <span
        className={`dcover ${TONES[i % TONES.length]}`}
        style={image ? { backgroundImage: `url('${image}')` } : undefined}
      >
        {kicker ? <span className="dkick">{kicker}</span> : null}
        {image ? null : <b>{title}</b>}
      </span>
      <span className="dbody">
        <b>{title}</b>
        {sub ? <span className="dsub">{sub}</span> : null}
        {meta ? <span className="dmeta">{meta}</span> : null}
      </span>
    </Link>
  );
}

// dperson: a tall card with the initials behind the name.
export function DPerson({
  href,
  name,
  line,
  i = 0,
}: {
  href: string;
  name: string;
  line?: string | null;
  i?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <Link className={`dperson dp${(i % 5) + 1}`} href={href}>
      <span className="dp-initials">{initials}</span>
      <span className="dp-shade" />
      <span className="dp-who">
        <b>{name}</b>
        {line ? <span>{line}</span> : null}
      </span>
    </Link>
  );
}

// dsec: a heading with a See all link, then the cards.
export function DSec({
  title,
  href,
  people = false,
  children,
}: {
  title: string;
  href?: string;
  people?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="dsec">
      <div className="dhead">
        <h2>{title}</h2>
        {href ? <Link href={href}>See all</Link> : null}
      </div>
      <div className={people ? "dpeople" : "dgrid"}>{children}</div>
    </section>
  );
}

// dband: the blue strip between sections.
export function DBand({
  title,
  line,
  cta,
  href,
  end = false,
}: {
  title: string;
  line: string;
  cta: string;
  href: string;
  end?: boolean;
}) {
  return (
    <div className={`dband ${end ? "dband-end" : ""}`}>
      <div>
        <b>{title}</b>
        <span>{line}</span>
        <Link className="btn btn-mint" href={href}>
          {cta}
        </Link>
      </div>
      <div className="dband-art">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}