import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireMember, timeAgo } from "@/lib/member";
import { WorkspaceShell } from "@/components/workspace-shell";
import { VillageHead, AskCard } from "@/components/village-space";
import { Av } from "@/components/bits";
import { Ic } from "@/components/icon";

export const metadata = { title: "Ask & Offer, ExpatPreneurs Global" };

const FILTERS: [string, string][] = [
  ["all", "All"],
  ["asks", "Asks"],
  ["offers", "Offers"],
  ["mine", "Yours"],
  ["resolved", "Resolved"],
];

export default async function VillageAskOfferPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const member = await requireMember("/my-village");
  const supabase = await createClient();

  let query = supabase
    .from("asks")
    .select("id, kind, reach, title, body, category, status, created_at, author_id, village_id")
    .order("created_at", { ascending: false })
    .limit(40);

  if (show === "resolved") query = query.eq("status", "resolved");
  else query = query.eq("status", "open");
  if (show === "asks") query = query.eq("kind", "ask");
  if (show === "offers") query = query.eq("kind", "offer");
  if (show === "mine") query = query.eq("author_id", member.id);

  const { data: posts } = await query;

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
  const [{ data: authors }, { data: replies }, { data: leadRoles }] =
    await Promise.all([
      authorIds.length
        ? supabase.from("profiles").select("id, full_name, headline").in("id", authorIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("ask_replies")
        .select("ask_id")
        .in("ask_id", (posts ?? []).map((p) => p.id).length ? (posts ?? []).map((p) => p.id) : ["none"]),
      member.village_id
        ? supabase
            .from("member_roles")
            .select("profile_id, role")
            .eq("scope_id", member.village_id)
            .eq("role", "local_admin")
            .is("ended_at", null)
        : Promise.resolve({ data: [] }),
    ]);

  const adminIds = (leadRoles ?? []).map((r) => r.profile_id);
  const { data: admins } = adminIds.length
    ? await supabase.from("profiles").select("id, full_name, headline").in("id", adminIds)
    : { data: [] };

  const authorOf = (id: string) => authors?.find((a) => a.id === id);
  const replyCount = (id: string) =>
    (replies ?? []).filter((r) => r.ask_id === id).length;

  return (
    <WorkspaceShell kind="member">
      <VillageHead here="/my-village" />

      <div className="gside" style={{ marginTop: 16 }}>
        <div>
          <div className="filters">
            {FILTERS.map(([key, label]) => (
              <Link
                key={key}
                className={`fchip ${show === key ? "on" : ""}`}
                href={`/my-village?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="stack">
            {posts && posts.length ? (
              posts.map((post) => (
                <AskCard
                  key={post.id}
                  id={post.id}
                  kind={post.kind}
                  title={post.title}
                  status={post.status}
                  scope={
                    post.reach === "global"
                      ? "All Villages"
                      : member.villageName ?? "Your Village"
                  }
                  replies={replyCount(post.id)}
                  author={authorOf(post.author_id)?.full_name ?? "A member"}
                  when={timeAgo(post.created_at)}
                />
              ))
            ) : (
              <div className="panel panel-wash">
                <h3 style={{ fontSize: 14 }}>Nothing open right now</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Post the first one. An Ask is something you need; an Offer is
                  something you can give.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 style={{ fontSize: 14 }}>How Ask &amp; Offer works</h3>
            <ul className="ticks" style={{ marginTop: 10 }}>
              <li>
                <Ic name="check" />
                Ask for an introduction, a supplier or advice
              </li>
              <li>
                <Ic name="check" />
                Offer your expertise, a resource or a contact
              </li>
              <li>
                <Ic name="check" />
                Mark it resolved and say what happened
              </li>
            </ul>
          </div>

          {admins && admins.length ? (
            <div className="panel">
              <h3 style={{ fontSize: 14 }}>Local Admins</h3>
              {admins.map((a) => (
                <div className="li" key={a.id}>
                  <Av name={a.full_name} className="av-sm" />
                  <div className="grow">
                    <b>{a.full_name}</b>
                  </div>
                  <Link className="btn btn-ghost btn-sm" href={`/messages/${a.id}`}>
                    Message
                  </Link>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </WorkspaceShell>
  );
}