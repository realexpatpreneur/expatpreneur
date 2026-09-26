import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public-page";
import { inviteByToken } from "../actions";
import { ReEnrolForm } from "../form";

export const metadata = { title: "Welcome back, ExpatPreneurs Global" };

export default async function ReEnrolPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await inviteByToken(token);

  if (!invite) notFound();

  const village = (invite.villages ?? {}) as { name?: string; city?: string };
  const firstName = invite.full_name.split(" ")[0];

  if (invite.status === "re_enrolled") {
    return (
      <PublicPage>
        <section className="pubsec">
          <div className="panel" style={{ maxWidth: 620 }}>
            <h1 style={{ fontSize: 22 }}>This place is already confirmed</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Somebody has been through this link already, which will have been
              you. Sign in and carry on.
            </p>
            <Link className="btn btn-primary" href="/login">
              Sign in
            </Link>
          </div>
        </section>
      </PublicPage>
    );
  }

  if (invite.status === "declined") {
    return (
      <PublicPage>
        <section className="pubsec">
          <div className="panel" style={{ maxWidth: 620 }}>
            <h1 style={{ fontSize: 22 }}>You have already told us</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              If you have changed your mind, request an invitation and your
              Local Admin will see it.
            </p>
            <Link className="btn btn-ghost" href="/apply">
              Request an invitation
            </Link>
          </div>
        </section>
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <section className="pubsec">
        <div style={{ maxWidth: 680 }}>
          <h1 style={{ fontSize: 26 }}>Welcome back, {firstName}</h1>
          <p className="intro">
            Confirm your details to keep your place in ExpatPreneurs{" "}
            {village.name ?? "your Village"}.
          </p>

          <div style={{ marginTop: 18 }}>
            <ReEnrolForm
              token={token}
              invite={{
                full_name: invite.full_name,
                phone: invite.phone,
                email: invite.email,
              }}
              villageName={village.name ?? "your Village"}
              cityName={village.city ?? ""}
            />
          </div>
        </div>
      </section>
    </PublicPage>
  );
}