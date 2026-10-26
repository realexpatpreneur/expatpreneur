import Link from "next/link";

// An empty panel is an invitation, not an apology. A bare muted sentence
// in the middle of a white field is what made this product read as
// unfinished: nothing to look at and nothing to do.
export function Empty({
  line,
  action,
  tight = false,
}: {
  line: string;
  action?: { label: string; href: string };
  tight?: boolean;
}) {
  return (
    <div className={`empty${tight ? " empty-tight" : ""}`}>
      <p>{line}</p>
      {action ? (
        <Link className="btn btn-sm" href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
