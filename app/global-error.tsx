"use client";

// The last resort, when even the layout failed. It has to bring its own
// document, so it carries the wordmark rather than the full header.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#0F1419",
          background: "#fff",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px" }}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: 10,
              background: "#0F1419",
              color: "#fff",
              font: "650 11px/1 Inter, system-ui, sans-serif",
            }}
          >
            EP
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 20 }}>
            The site did not load
          </h1>
          <p style={{ color: "#6B7683", marginTop: 10 }}>
            Something failed before the page could be drawn. Try again, and if
            it keeps happening tell the build team.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              border: 0,
              borderRadius: 999,
              padding: "10px 18px",
              background: "#0F1419",
              color: "#fff",
              font: "600 13px Inter, system-ui, sans-serif",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ color: "#6B7683", fontSize: 12, marginTop: 16 }}>
              Reference {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}