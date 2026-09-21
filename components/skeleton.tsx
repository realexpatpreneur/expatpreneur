// The shape of a page, drawn instantly while the real one is fetched.
// Without it a click did nothing at all until the server came back.
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skel-page" aria-hidden="true">
      <div className="skel skel-title" />
      <div className="skel skel-line" style={{ width: "42%" }} />
      <div className="skel-grid">
        {Array.from({ length: rows }).map((_, i) => (
          <div className="panel skel-panel" key={i}>
            <div className="skel skel-line" style={{ width: "60%" }} />
            <div className="skel skel-line" style={{ width: "90%" }} />
            <div className="skel skel-line" style={{ width: "75%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}