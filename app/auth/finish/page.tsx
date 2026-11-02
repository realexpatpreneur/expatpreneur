import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
import { FinishSignIn } from "./finish";

export const metadata = {
  title: "Signing you in, ExpatPreneurs Global",
  robots: { index: false, follow: false },
};

export default async function FinishPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Only somewhere on this site. The browser is handed this value and
  // told to go there, so anything that is not a plain path, a protocol
  // relative address included, is thrown away.
  const asked = next ?? "";
  const safe =
    asked.startsWith("/") && !asked.startsWith("//") ? asked : "/home";

  return (
    // The heading belongs to the client half. A link that failed and a
    // heading still saying the site is about to open would be a page
    // disagreeing with itself.
    <FlowPage photo={PHOTO.reader} photoAlt="A member reading an invitation">
      <FinishSignIn next={safe} />
    </FlowPage>
  );
}
