import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
import { Done } from "@/components/done";

export const metadata = { title: "Thank you, ExpatPreneurs Global" };

export default function ReEnrolDeclinedPage() {
  return (
    <FlowPage photo={PHOTO.table} photoAlt="Members around a table at a Village dinner">
      <Done
        title="Thank you for being part of it"
        actions={[{ label: "Back to home", href: "/", kind: "primary" }]}
      >
        We will take you out of the WhatsApp group. If you ever want to come
        back, you can request an invitation and your Local Admin will see it.
      </Done>
    </FlowPage>
  );
}
