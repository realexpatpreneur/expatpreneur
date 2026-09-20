import Link from "next/link";
import { requireMember } from "@/lib/member";
import { SiteHeader } from "@/components/site-header";
import { PostForm } from "../forms";

export const metadata = { title: "Post to Ask & Offer" };

export default async function NewPostPage() {
  const member = await requireMember("/village/new");

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <p className="muted small">
            <Link href="/village">Ask &amp; Offer</Link>
          </p>
          <h1>Post something</h1>
          <p className="lead">
            Ask for what you need, or offer what you know. No pitching.
          </p>
        </section>
        <section className="band">
          <PostForm villageName={member.villageName} />
        </section>
      </main>
    </>
  );
}