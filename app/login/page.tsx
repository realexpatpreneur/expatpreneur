import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { LoginForm } from "./form";

export const metadata = { title: "Log in, ExpatPreneurs Global" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <>
      <main className="wrap">
        <section className="sec">
          <h1>Log in</h1>
          <p className="lead">
            We send a link instead of asking for a password.
          </p>
        </section>
        <section className="sec">
          <LoginForm next={next ?? "/home"} />
          <p className="muted small" style={{ marginTop: 16 }}>
            Not a member yet? <Link href="/apply">Request an invitation</Link>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}