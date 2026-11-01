// Small pieces the designed public pages share: icons, stacks of faces,
// initials and the open and close mark on the question lists.

export function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </svg>
  );
}

export function Tick({ color = "#2F8F77" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function Cross({ color = "#9AA5B1" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function Pm() {
  return (
    <span className="d-pm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </span>
  );
}

export function GoArrow() {
  return (
    <svg className="d-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// The prototype's seven tints, picked from the name so a person always
// gets the same one.
const TINTS = ["#A8DCD1", "#FEEEEC", "#CFE0F2", "#FBDDB9", "#D9E9D2", "#E8DDF3", "#FFE3A8"];

export function tintFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// A face: the photograph when there is one, the initials when not.
export function Face({
  name,
  src,
  size = 36,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img className="d-av" src={src} alt="" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="d-ini"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size / 3), background: tintFor(name) }}
    >
      {initialsOf(name)}
    </span>
  );
}

export function Faces({ srcs, size = 36 }: { srcs: string[]; size?: number }) {
  return (
    <span className="d-stack">
      {srcs.map((src, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img key={`${src}${i}`} className="d-av" src={src} alt="" style={{ width: size, height: size }} />
      ))}
    </span>
  );
}

export function Plus({ size = 34 }: { size?: number }) {
  return (
    <span className="d-plus" aria-hidden="true" style={{ width: size, height: size }}>
      +
    </span>
  );
}

export const PHOTO = {
  tomas: "/brand/face-c.jpg",
  ines: "/brand/face-b.jpg",
  julien: "/brand/face-a.jpg",
  nadia: "/brand/cafe.jpg",
  kristiane: "/brand/founder.jpg",
  reader: "/brand/invite.jpg",
  members: "/brand/members.jpg",
  table: "/brand/table.jpg",
  globe: "/brand/globe.png",
  village: "/brand/village.png",
  circle: "/brand/circle.png",
};
