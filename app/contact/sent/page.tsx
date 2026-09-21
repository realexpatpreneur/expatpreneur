import Link from "next/link";
import { PublicPage } from "@/components/public-page";
import { Ic } from "@/components/icon";

export const metadata = { title: "Message sent, ExpatPreneurs Global" };

export default async function ContactSentPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind = "general" } = await searchParams;

  return (
    <PublicPage active="/contact">
      <section className="pubsec">
        <div className="done">
          <span className="doneic">
            <Ic name="check" />
          </span>
          <h1>Thanks for getting in touch</h1>
          <p>
            {kind === "partnership"
              ? "Your message is with the Global team, who agree every partnership."
              : kind === "press"
                ? "Your request is with the Global team. They handle interviews and stories."
                : "Your message has reached us. We usually reply within two working days."}
          </p>
          <div className="row" style={{ justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
            <Link className="btn btn-primary" href="/">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}