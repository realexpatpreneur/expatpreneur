import Link from "next/link";
import { PublicPage } from "@/components/public-page";
import { PHOTO } from "@/components/design/parts";
import { CitySuggestionForm } from "./form";

export const metadata = { title: "Suggest a city, ExpatPreneurs Global" };

export default async function SuggestCityPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; city?: string; country?: string }>;
}) {
  const { done, city = "", country = "" } = await searchParams;

  return (
    <PublicPage>
      <main className="d-page">
        <section style={{ padding: "64px 0 40px" }}>
          <div className="d-wrap">
            <h1 className="d-h1" style={{ maxWidth: "20ch" }}>{city ? `The ${city} Village is not open yet` : "Your city is not here yet"}</h1>
            <p className="d-lead" style={{ marginTop: 18, maxWidth: "52ch" }}>
              {city
                ? "Join the waitlist and you will hear the day it opens. If you could help run it, tell us that too."
                : "Villages open where enough people ask. Tell us where you are and we will count you in."}
            </p>
          </div>
        </section>
        <section style={{ padding: "0 0 104px" }}>
          <div className="d-wrap">
            {done ? (
              <div className="d-boxed" style={{ maxWidth: 680 }}>
                <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em" }}>Thank you</h3>
                <p className="d-body" style={{ marginTop: 12, fontSize: 16, maxWidth: "52ch" }}>
                  You are counted. When that city has enough people and someone to
                  run it, you will be among the first to hear.
                </p>
                <Link className="d-btn d-btn-line d-shine" href="/villages" style={{ marginTop: 28 }}>
                  Back to Villages
                </Link>
              </div>
            ) : (
              <div className="d-apply">
                <div className="d-apply-card d-form" style={{ marginTop: 0 }}>
                  <CitySuggestionForm city={city} country={country} />
                </div>
                <aside>
                  <div className="d-zoom" style={{ borderRadius: 6, overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={PHOTO.members} alt="" style={{ width: "100%", height: 240, objectFit: "cover" }} />
                  </div>
                  <h3 style={{ marginTop: 28, fontSize: 21, fontWeight: 800, letterSpacing: "-.02em" }}>What makes a Village work</h3>
                  <p className="d-body" style={{ marginTop: 12, paddingTop: 18, borderTop: "1px solid #E3E6EA" }}>
                    Enough expat entrepreneurs in one city, a language they share,
                    and someone local willing to run it. Two out of three is not
                    enough, which is why some cities wait.
                  </p>
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
