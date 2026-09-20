import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CitySuggestionForm } from "./form";

export const metadata = { title: "Suggest a city, ExpatPreneurs Global" };

export default async function SuggestCityPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <section className="sec">
          <h1>Your city is not here yet</h1>
          <p className="lead">
            Villages open where enough people ask. Tell us where you are and we
            will count you in.
          </p>
        </section>
        <section className="sec">
          {done ? (
            <div className="panel" style={{ maxWidth: 680 }}>
              <h3>Thank you</h3>
              <p className="muted small" style={{ marginTop: 6 }}>
                You are counted. When that city has enough people and someone to
                run it, you will be among the first to hear.
              </p>
              <Link className="btn btn-ghost" href="/villages">
                Back to Villages
              </Link>
            </div>
          ) : (
            <div className="gside">
              <CitySuggestionForm />
              <div className="panel panel-wash">
                <h3>What makes a Village work</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Enough expat entrepreneurs in one city, a language they share,
                  and someone local willing to run it. Two out of three is not
                  enough, which is why some cities wait.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}