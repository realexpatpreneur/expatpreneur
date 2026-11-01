import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
import { Done } from "@/components/done";

export const metadata = { title: "Thank you, ExpatPreneurs Global" };

export default async function SuggestionSentPage({
  searchParams,
}: {
  searchParams: Promise<{ how?: string }>;
}) {
  const { how } = await searchParams;

  return (
    <FlowPage photo={PHOTO.table} photoAlt="Members around a table at a Village dinner">
          <Done
            title="Thank you"
            actions={[
              { label: "Back to home", href: "/home", kind: "primary" },
              { label: "Send another", href: "/suggestions" },
            ]}
          >
            {how === "anonymous"
              ? "Your suggestion is with the team, and nothing on it says who sent it."
              : "Your suggestion is with the team. They read every one."}
          </Done>
    </FlowPage>
  );
}