import Link from "next/link";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

// The prototype's mcard(). A member on a card: the avatar and the name
// as one link, where they are, what they do, their chips, and the one
// action that matters along the bottom.
//
// The action follows the prototype's rule, which is the rule the member
// profile page already applies: somebody in your own Village can be
// messaged, and somebody in another Village needs a connection, which
// is part of the paid plan.
//
// The prototype's card also carries nationalities. Migration 0015 took
// that column away from members deliberately, so there is nothing to
// read and the line is left out rather than faked.

export type CardMember = {
  id: string;
  full_name: string;
  headline?: string | null;
  business_name?: string | null;
  industry?: string | null;
  founding?: boolean | null;
  avatar_url?: string | null;
  village_id?: string | null;
  circle_id?: string | null;
};

export type CardViewer = {
  id: string;
  village_id: string | null;
  paid: boolean;
};

export function MemberCard({
  person,
  where,
  viewer = null,
  requested = false,
  connected = false,
}: {
  person: CardMember;
  where: string;
  viewer?: CardViewer | null;
  requested?: boolean;
  connected?: boolean;
}) {
  const other =
    Boolean(viewer) &&
    Boolean(person.village_id) &&
    person.village_id !== viewer!.village_id;

  let action: React.ReactNode = null;
  if (viewer && person.id !== viewer.id) {
    if (!other) {
      action = (
        <Link className="btn btn-ghost btn-sm" href={`/messages/${person.id}`}>
          Message
        </Link>
      );
    } else if (connected) {
      action = <span className="chip chip-blue">Connected</span>;
    } else if (requested) {
      action = <span className="chip chip-blue">Request sent</span>;
    } else if (viewer.paid) {
      action = (
        <Link className="btn btn-ghost btn-sm" href={`/members/${person.id}`}>
          Request to connect
        </Link>
      );
    } else {
      action = (
        <Link className="chip chip-sun" href="/upgrade">
          <Ic name="lock" style={{ width: 13, height: 13 }} />
          Paid members can contact
        </Link>
      );
    }
  }

  return (
    <article className="mcard">
      <Link className="row linkrow" href={`/members/${person.id}`}>
        <Av name={person.full_name} src={person.avatar_url ?? null} />
        <div style={{ minWidth: 0 }}>
          <b style={{ fontWeight: 650, display: "block" }}>
            {person.full_name}
          </b>
          <span className="where">{where}</span>
        </div>
      </Link>
      <p className="small">{person.headline || person.business_name || ""}</p>
      <div className="tags">
        {person.industry ? <span className="chip">{person.industry}</span> : null}
        {person.founding ? (
          <span className="chip chip-founding">
            <Ic name="star" style={{ width: 13, height: 13 }} />
            Founding member
          </span>
        ) : null}
        {other ? <span className="chip chip-blue">Other Village</span> : null}
      </div>
      {action ? (
        <div className="row" style={{ marginTop: "auto" }}>
          {action}
        </div>
      ) : null}
    </article>
  );
}