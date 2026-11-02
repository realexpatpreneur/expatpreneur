import { PublicPage } from "@/components/public-page";
import { Done } from "@/components/done";
import { PHOTO } from "@/components/design/parts";

export const metadata = { title: "You are on the list, ExpatPreneurs Global" };

// A screen on the way out, in the Log in shape: what happened on one
// side, the people it was about on the other.
export default function SubscribedPage() {
  return (
    <PublicPage>
      <div className="d-page d-flow d-login">
        <div className="d-login-form">
          <div className="d-form" style={{ width: "100%", maxWidth: 460 }}>
            <Done
              title="You are on the list"
              icon="mail"
              actions={[{ label: "Back to Media", href: "/media", kind: "primary" }]}
            >
              The next one comes to you. Every email we send has a way off it
              at the bottom.
            </Done>
          </div>
        </div>

        <div className="d-login-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PHOTO.reader} alt="" />
        </div>
      </div>
    </PublicPage>
  );
}
