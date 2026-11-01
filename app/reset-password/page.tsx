import Link from "next/link";
import { FlowPage } from "@/components/design/flow-page";
import { PHOTO } from "@/components/design/parts";
import { ResetForm } from "./form";

export const metadata = { title: "Reset your password, ExpatPreneurs Global" };

export default function ResetPasswordPage() {
  return (
    <FlowPage
      title="Reset your password"
      lead="Only if you set one. Most members sign in with a link instead, which needs no password at all."
      photo={PHOTO.nadia}
      photoAlt="A member at work in her cafe"
    >
      <ResetForm />
      <div className="d-aside-note">
        <b>Or skip it</b>
        A sign in link does the same job without a password to forget.{" "}
        <Link className="d-ulink" href="/login" style={{ fontSize: 14 }}>
          Send me a sign in link
        </Link>
      </div>
    </FlowPage>
  );
}
