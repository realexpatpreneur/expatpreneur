import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
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
      <FlowPage
        title="This place is already confirmed"
        lead="Somebody has been through this link already, which will have been you. Sign in and carry on."
      >
        <Link className="btn btn-primary" href="/login" style={{ marginTop: 0 }}>
          Sign in
        </Link>
      </FlowPage>
    );
  }

  if (invite.status === "declined") {
    return (
      <FlowPage
        title="You have already told us"
        lead="If you have changed your mind, request an invitation and your Local Admin will see it."
      >
        <Link className="btn btn-ghost" href="/apply">
          Request an invitation
        </Link>
      </FlowPage>
    );
  }

  return (
    <FlowPage
      title={`Welcome back, ${firstName}`}
      lead={`Confirm your details to keep your place in ExpatPreneurs ${village.name ?? "your Village"}.`}
      card={{ title: village.name ? `${village.name} Village` : "Your Village", line: "Your place is kept for you" }}
    >
          <div>
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
    </FlowPage>
  );
}