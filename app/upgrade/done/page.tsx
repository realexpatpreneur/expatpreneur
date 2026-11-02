import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
import { Done } from "@/components/done";

export const metadata = { title: "Thank you, ExpatPreneurs Global" };

export default async function UpgradeDonePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const cancelled = state === "cancelled";

  return (
    <FlowPage
      photo={cancelled ? PHOTO.nadia : PHOTO.members}
      photoAlt={cancelled ? "A member at work in her cafe" : "Members of a Village working together"}
      card={cancelled ? undefined : { title: "Every Village is open", line: "Members, events and introductions" }}
    >
      <Done
        title={cancelled ? "Your plan will end" : "Every Village is open"}
        icon={cancelled ? "info" : "check"}
        warn={cancelled}
        actions={
          cancelled
            ? [{ label: "Back to home", href: "/home", kind: "primary" },
               { label: "Your profile", href: "/me" }]
            : [
                { label: "Back to home", href: "/home", kind: "primary" },
                { label: "See every Village", href: "/directory?village=all" },
              ]
        }
      >
        {cancelled
          ? "It runs to the end of the period you have paid for. After that the member side closes: your profile and your settings stay open, and everything else waits until you come back. Your Circle place is held for 35 days, so if you return inside that time you walk back into the same Circle."
          : "The payment went through. It can take a few seconds for the platform to catch up, so if a page still looks closed, reload it."}
      </Done>
    </FlowPage>
  );
}
