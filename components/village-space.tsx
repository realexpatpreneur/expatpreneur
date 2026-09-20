import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/workspace-shell";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

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
        .select("name, city, country")
        .eq("id", profile.village_id)
        .maybeSingle()
    : { data: null };

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
      <PageHead
        title={village ? `${village.name} Village` : "Your Village"}
        sub={
          village
            ? `${members ?? 0} members, ${circles ?? 0} Circle${
                circles === 1 ? "" : "s"
              } of up to 50`
            : undefined
        }
        actions={
          <Link className="btn btn-primary" href="/village/new">
            <Ic name="plus" />
            Post an Ask or Offer
          </Link>
        }
      />
      <div className="tabs">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} aria-current={here === href ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </div>
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
  when,
}: {
  id: string;
  kind: string;
  title: string;
  status: string;
  scope: string;
  replies: number;
  author: string;
  when: string;
}) {
  const offer = kind === "offer";
  return (
    <Link className="ao linkrow ao-tiled" href={`/village/${id}`}>
      <span className={`ao-ic ${offer ? "offer" : "ask"}`}>
        <Ic name={offer ? "sparkle" : "hand"} />
      </span>
      <div className="ao-body">
        <div className="row" style={{ gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span className={`kindtag ${offer ? "offer" : "ask"}`}>
            {offer ? "Offer" : "Ask"}
          </span>
          <span className={`chip ${status === "open" ? "chip-mint" : ""}`}>
            {status === "open" ? "Open" : "Resolved"}
          </span>
          <span className="muted small">
            {scope}, {replies} {replies === 1 ? "reply" : "replies"}
          </span>
        </div>
        <b style={{ fontWeight: 600 }}>{title}</b>
        <div className="row small muted" style={{ marginTop: 4 }}>
          <Av name={author} className="av-sm" />
          {author}, {when}
        </div>
      </div>
    </Link>
  );
}