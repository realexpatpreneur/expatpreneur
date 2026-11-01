import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/member";
import { PostForm } from "../forms";

export const metadata = { title: "Post to Ask & Offer" };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  const member = await requireMember("/village/new");
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("profiles")
    .select("headline")
    .eq("id", member.id)
    .maybeSingle();

  return (
    <WorkspaceShell kind="member" nav="/village/new">
      <nav className="m-crumb" aria-label="Breadcrumb">
        <Link href="/my-village">Ask &amp; Offer</Link>
        <span>/</span>
        <span>Post something</span>
      </nav>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.1 }}>
        What do you need, or what can you give?
      </h1>
      <p style={{ margin: "10px 0 0", fontSize: 16, color: "#3B4650", maxWidth: "60ch" }}>
        Ask for what you need, or offer what you know. No pitching.
      </p>
      <PostForm
        villageName={member.villageName}
        name={member.full_name}
        avatar={member.avatar_url}
        headline={me?.headline ?? null}
        initialKind={kind === "offer" ? "offer" : "ask"}
      />
    </WorkspaceShell>
  );
}
