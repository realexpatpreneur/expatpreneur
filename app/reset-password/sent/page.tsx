import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
import { Done } from "@/components/done";

export const metadata = { title: "Check your email, ExpatPreneurs Global" };

export default function ResetSentPage() {
  return (
    <FlowPage photo={PHOTO.nadia} photoAlt="A member at work in her cafe">
      <Done
        title="Check your email"
        icon="mail"
        actions={[{ label: "Back to log in", href: "/login", kind: "primary" }]}
      >
        If an account exists for that address, a reset link is on its way.
        It opens your settings, where you set a new password.
      </Done>
    </FlowPage>
  );
}
