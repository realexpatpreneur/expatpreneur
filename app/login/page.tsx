import Link from "next/link";
import { LoginForm } from "./form";
import { Faces, PHOTO } from "@/components/design/parts";

export const metadata = { title: "Log in, ExpatPreneurs Global" };

// Log in as the design board draws it: the form on one side and the
// people it opens the door to on the other.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="d-page d-login">
      <div className="d-login-form">
        <div style={{ width: "100%", maxWidth: 440 }}>
          <h1 className="d-h1" style={{ fontSize: "clamp(32px, 3.4vw, 44px)" }}>Welcome back.</h1>
          <p className="d-lead" style={{ marginTop: 12, fontSize: 17 }}>
            We send a link instead of asking for a password.
          </p>
          <div className="d-form" style={{ marginTop: 32 }}>
            <LoginForm next={next ?? "/home"} />
          </div>
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #E3E6EA", display: "flex", alignItems: "center", gap: 14 }}>
            <Faces srcs={[PHOTO.tomas, PHOTO.ines, PHOTO.julien]} size={36} />
            <p className="d-body" style={{ fontSize: 14 }}>
              Not a member yet? <Link className="d-ulink" href="/apply" style={{ fontSize: 14 }}>Request an invitation</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="d-login-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHOTO.members} alt="Members of a Village working together" />
        <div className="d-card-paper d-float" style={{ position: "absolute", left: 40, top: 48, display: "flex", alignItems: "center", gap: 12, maxWidth: 300 }}>
          <Faces srcs={[PHOTO.nadia]} size={36} />
          <span style={{ fontSize: 13, lineHeight: 1.4 }}>
            <b style={{ display: "block" }}>Nadia replied to your Ask</b>
            <span style={{ color: "#6B7683" }}>Dubai Village</span>
          </span>
        </div>
        <figure style={{ position: "absolute", left: 40, right: 40, bottom: 40, background: "#FFFFFF", borderRadius: 6, padding: 28 }}>
          <blockquote style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.4, letterSpacing: "-.015em" }}>
            I moved to Lisbon knowing two people. Four months later I had a
            supplier, an accountant and somebody to have dinner with on a Tuesday.
          </blockquote>
          <figcaption style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
            <Faces srcs={[PHOTO.ines]} size={44} />
            <span style={{ fontSize: 14, lineHeight: 1.4 }}>
              <b style={{ display: "block" }}>Inês Carvalho</b>
              <span style={{ color: "#6B7683" }}>Casa Tinta, Lisbon Village</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
