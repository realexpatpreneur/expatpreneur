import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Thank you, ExpatPreneurs Global" };

export default async function UpgradeDonePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const cancelled = state === "cancelled";

  return (
    <>
      <SiteHeader signedIn />
      <main className="wrap">
        <section className="band">
          <h1>{cancelled ? "Your plan will end" : "Every Village is open"}</h1>
          <p className="lead">
            {cancelled
              ? "It runs to the end of the period you have paid for, and then your membership goes back to free. Your Village and your Circle stay exactly as they are."
              : "The payment went through. It can take a few seconds for the platform to catch up, so if a page still looks closed, reload it."}
          </p>
          <p>
            <Link className="btn primary" href="/home">
              Back to home
            </Link>{" "}
            {cancelled ? null : (
              <Link className="btn" href="/directory?village=all">
                See every Village
              </Link>
            )}
          </p>
        </section>
      </main>
    </>
  );
}