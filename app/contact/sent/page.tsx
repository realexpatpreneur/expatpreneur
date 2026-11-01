import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
import { Done } from "@/components/done";

export const metadata = { title: "Message sent, ExpatPreneurs Global" };

export default async function ContactSentPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = "general" } = await searchParams;

  return (
    <FlowPage photo={PHOTO.members}>
          <Done
            title="Thanks for getting in touch"
            actions={[{ label: "Back to home", href: "/", kind: "primary" }]}
          >
            {kind === "partnership"
              ? "Your message is with the Global team, who agree every partnership."
              : kind === "press"
                ? "Your request is with the Global team. They handle interviews and stories."
                : "Your message has reached the Global team. We will reply by email."}
          </Done>
    </FlowPage>
  );
}