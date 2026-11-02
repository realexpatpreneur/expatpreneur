import Link from "next/link";
import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
import { StatusForm } from "./form";

export const metadata = {
  title: "Where your request stands, ExpatPreneurs Global",
};

// The lead and the card are drawn on the server, above a result worked
// out in the browser, which is the fault /auth/finish had. They said "it
// takes days rather than minutes" and "A week is normal" directly above
// the answer, so somebody declined read that a week was normal above
// "This one was decided and is closed", and somebody approved read it
// above their place being offered. Both were true of a request still
// waiting and neither of a decided one, so they say something true of
// every outcome now.
export default function ApplicationStatusPage() {
  return (
    <FlowPage
      title="Where your request stands"
      lead="Your address and your reference show you where it stands."
      photo={PHOTO.reader}
      photoAlt="A member reading invitation requests"
      card={{ title: "Read by a person", line: "Never by a machine" }}
    >
      <StatusForm />
      <div className="d-aside-note">
        <b>Why it takes a while</b>
        Requests go to the Local Admins of the city you named, and they are
        members with businesses of their own. A week is normal.
      </div>
      <div className="d-aside-note" style={{ marginTop: 20, paddingTop: 20 }}>
        <b>Lost the reference?</b>
        Write to us and say which address you used. We will not confirm
        anything about a request to anybody but the person who made it.{" "}
        <Link className="d-ulink" href="/contact" style={{ fontSize: 14 }}>
          Contact
        </Link>
      </div>
    </FlowPage>
  );
}
