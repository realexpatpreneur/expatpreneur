import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Av } from "@/components/bits";

const TABS: [string, string][] = [
  ["/my-village", "Ask & Offer"],
  ["/my-village/circles", "Circles"],
  ["/my-village/members", "Members"],
  ["/my-village/announcements", "Announcements"],
  ["/my-village/resources", "Resources"],
];

// The head of the Village space: the name, what it holds, and the tabs
// that run along the top of every one of its pages.
export async function VillageHead({ here }: { here: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("village_id")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: village } = profile?.village_id
    ? await supabase
        .from("villages")
        .select("name, city, country, cover_url")
        .eq("id", profile.village_id)
        .maybeSingle()
    : { data: null };

  // A few of the people in it, so the head of the Village is faces.
  const { data: faces } = profile?.village_id
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("village_id", profile.village_id)
        .eq("status", "active")
        .not("avatar_url", "is", null)
        .limit(5)
    : { data: null };

  const cover =
    ((village as { cover_url?: string | null } | null)?.cover_url ?? "").trim().replace(/['"\\()]/g, "") ||
    "/brand/members.jpg";

  const [{ count: members }, { count: circles }] = profile?.village_id
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("village_id", profile.village_id)
          .eq("status", "active"),
        supabase
          .from("circles")
          .select("id", { count: "exact", head: true })
          .eq("village_id", profile.village_id),
      ])
    : [{ count: 0 }, { count: 0 }];

  return (
    <>
      <header className="m-vhead" style={{ backgroundImage: `url('${cover}')` }}>
        <div>
          <div>
            <h1>{village ? `${village.name} Village` : "Your Village"}</h1>
            {village ? (
              <p>
                {members ?? 0} members, {circles ?? 0} Circle{circles === 1 ? "" : "s"} of up to 50
              </p>
            ) : null}
          </div>
          {faces && faces.length ? (
            <Link className="m-faces" href="/my-village/members" aria-label="Members">
              {faces.map((f) => (
                <Av key={f.id} name={f.full_name} className="av-lg" src={f.avatar_url ?? null} />
              ))}
            </Link>
          ) : null}
        </div>
      </header>
      <nav className="tabs m-vtabs" aria-label="Your Village">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} aria-current={here === href ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

// aoCard: the icon tile, what kind of post it is, whether it is still
// open, and who wrote it.
export function AskCard({
  id,
  kind,
  title,
  status,
  scope,
  replies,
  author,
  authorAvatar = null,
  when,
}: {
  id: string;
  kind: string;
  title: string;
  status: string;
  scope: string;
  replies: number;
  author: string;
  authorAvatar?: string | null;
  when: string;
}) {
  const tag = kind === "offer" ? "offer" : kind === "introduction" ? "introduction" : "ask";
  const label = kind === "offer" ? "Offer" : kind === "introduction" ? "Hello" : "Ask";
  return (
    <Link className="m-aorow" href={`/village/${id}`}>
      <span className={`m-tag ${tag}`}>{label}</span>
      <span style={{ minWidth: 0 }}>
        <b>{title}</b>
        <span className="m-aometa">
          <Av name={author} src={authorAvatar} />
          <span>
            {author}, {when}
          </span>
          <span>{scope}</span>
        </span>
      </span>
      <span className="m-status" style={{ color: status === "open" ? "#24675A" : "#6B7683" }}>
        {status === "open" ? "Open" : "Resolved"}
        <small>
          {replies} {replies === 1 ? "reply" : "replies"}
        </small>
      </span>
    </Link>
  );
}
