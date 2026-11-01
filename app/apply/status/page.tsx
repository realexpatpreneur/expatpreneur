import Link from "next/link";
import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
import { StatusForm } from "./form";

export const metadata = {
  title: "Where your request stands, ExpatPreneurs Global",
};

export default function ApplicationStatusPage() {
  return (
    <FlowPage
      title="Where your request stands"
      lead="Somebody reads every one, so it takes days rather than minutes. You can check here in the meantime."
      photo={PHOTO.reader}
      photoAlt="A member reading invitation requests"
      card={{ title: "Read by a person", line: "A week is normal" }}
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
