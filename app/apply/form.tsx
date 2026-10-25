"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Captcha } from "@/components/captcha";
import { Ic } from "@/components/icon";
import { submitApplication, type ApplyState } from "./actions";
import { Combo } from "@/components/combo";
import { COUNTRIES, NATIONALITIES } from "@/lib/lists/countries";
import { LANGUAGES } from "@/lib/lists/languages";
import { CITIES } from "@/lib/lists/cities";

type Village = { slug: string; name: string; status: string };

const INDUSTRIES = [
  "Consulting & Coaching",
  "Marketing & Branding",
  "Tech & Software Development",
  "Design & Creative Services",
  "Finance & Legal",
  "Health & Wellness",
  "E-commerce & Retail",
  "Real Estate & Property",
  "Hospitality & F&B",
  "Education & Training",
  "Media & Content Creation",
  "Other",
];

const STAGES = [
  "Idea stage (planning)",
  "Just started (0-1 year)",
  "Early stage (1-3 years)",
  "Established (3-5 years)",
  "Scaling (5+ years)",
];

const HEARD = [
  "Personal invitation",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "Friend or colleague referral",
  "Google search",
  "Other",
];

const RESONATE = [
  "I value collaboration over competition",
  "I believe in giving as much as I take",
  "I am done with surface level networking",
  "I respect and appreciate diverse cultures",
  "I am building a business with purpose beyond profit",
  "I am ready to show up consistently, not just when I need something",
];

const ATTEND = [
  "Yes, I will do my best to attend regularly",
  "Maybe, depending on the schedule and where it is",
  "No, I prefer an online community",
];

const STEPS = ["About you", "Your business", "Good fit", "Review"] as const;

// The three questions the prototype asks when somebody picks a city
// with no Village in it yet, and the five it asks of anybody offering
// to run one.
const HOW_MANY = ["Fewer than 10", "10 to 30", "More than 30"];
const ENGLISH = ["Yes", "Partly", "No"];
const LA_YEARS = ["Less than a year", "1 to 3 years", "More than 3 years"];
const LA_HOURS = ["Up to 5 hours", "5 to 10 hours", "More than 10 hours"];

// The asterisk the prototype puts on every required question.
const Req = () => (
  <span className="req" aria-label="required">
    {" "}
    *
  </span>
);

// What the review step shows, in the order it was asked. The label is
// what the reader sees; the second entry is the field it came from, and
// a list of names is joined, which is how the multi value fields and
// the checkbox groups come back.
type Row = [string, string];
type Panel = [string, string, Row[]];

type Source = [string, string | string[], string?];

const REVIEW: [number, string, Source[]][] = [
  [1, "About you", [
    ["Name", ["first_name", "last_name"], " "],
    ["Email", "email"],
    ["Phone (WhatsApp)", "phone"],
    ["City", "city"],
    ["Country", "country"],
    ["Nationalities", "nationalities"],
    ["Languages", "languages"],
    ["Lived in", "lived_in"],
  ]],
  [2, "Your business", [
    ["Business", ["business_name", "role"]],
    ["Type of business", "about_business"],
    ["Industry", "industry"],
    ["Stage", "stage"],
    ["Biggest challenge", "challenge"],
    ["Website or LinkedIn", "link"],
  ]],
  [3, "Good fit", [
    ["Village", "village"],
    ["Heard about us", "heard_about"],
    ["Referred by", "referrer"],
    ["Code of Conduct", "code_of_conduct"],
    ["Resonates", "resonate"],
    ["In-person meetups", "attend"],
    ["Why join", "why_join"],
    ["Could give back", "contribute"],
    ["Looking for", "looking_for"],
    ["Can help with", "can_help_with"],
    ["Shared with the Village", "share_answers"],
    ["Expat entrepreneurs there", "city_entrepreneurs"],
    ["English used there", "city_english"],
    ["Would be Local Admin", "la_why"],
  ]],
];

export function ApplyForm({ villages }: { villages: Village[] }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(
    submitApplication,
    {}
  );
  // Picking a city with no Village opens the panel that explains what
  // happens next, as the prototype does.
  const [village, setVillage] = useState("");
  const [offersAdmin, setOffersAdmin] = useState(false);
  const [step, setStep] = useState(1);
  const [summary, setSummary] = useState<Panel[]>([]);
  const form = useRef<HTMLFormElement>(null);

  // Every step stays in the page, hidden rather than unmounted, so
  // nothing typed on step one is lost by the time step four submits it.
  // Only the step you are on carries its required marks, because the
  // browser will not let a form submit while an invisible field is
  // refusing.
  const on = (n: number) => step === n;

  const valid = (n: number) => {
    const panel = document.getElementById(`apply-step-${n}`);
    if (!panel) return true;
    const fields = Array.from(
      panel.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input, select, textarea")
    );
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  };

  const go = (to: number) => {
    if (to > step && !valid(step)) return;
    if (to === 4) setSummary(readBack());
    setStep(to);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // The review reads the form back out of the page rather than keeping
  // a second copy of every answer in state.
  const readBack = (): Panel[] => {
    if (!form.current) return [];
    const data = new FormData(form.current);
    const one = (name: string) => String(data.get(name) ?? "").trim();
    const many = (name: string) => data.getAll(name).map(String).filter(Boolean);

    return REVIEW.map(([n, title, rows]) => {
      const out: Row[] = [];
      for (const [label, from, join] of rows) {
        const value = Array.isArray(from)
          ? from.map(one).filter(Boolean).join(join ?? ", ")
          : many(from).join(", ") || one(from);
        if (value) out.push([label, value]);
      }
      return [title, String(n), out] as Panel;
    });
  };

  return (
    <>
      <div className="steps" style={{ margin: "18px 0" }}>
        {STEPS.map((label, i) => (
          <button
            type="button"
            className={`step ${i + 1 === step ? "on" : ""}`}
            key={label}
            onClick={() => go(i + 1)}
            style={{ border: 0, cursor: "pointer", font: "inherit" }}
          >
            <i>{i + 1 < step ? <Ic name="check" /> : i + 1}</i>
            {label}
          </button>
        ))}
      </div>

      <form action={action} className="panel" ref={form}>
        {/* Not for people. Anything that fills this in is a machine. */}
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {state.error ? <div className="flag hold">{state.error}</div> : null}

        {/* ------------------------------------------------ step one */}
        <div id="apply-step-1" hidden={!on(1)}>
          <h3 className="formsec">
            <Ic name="user" />
            About you
          </h3>
          <div className="formgrid">
            <label className="field">
              <span>
                First name
                <Req />
              </span>
              <input name="first_name" required={on(1)} autoComplete="given-name" />
            </label>
            <label className="field">
              <span>
                Last name
                <Req />
              </span>
              <input name="last_name" required={on(1)} autoComplete="family-name" />
            </label>
            <label className="field">
              <span>
                Email
                <Req />
              </span>
              <input name="email" type="email" required={on(1)} autoComplete="email" />
            </label>
            <label className="field">
              <span>Phone (WhatsApp)</span>
              <input name="phone" autoComplete="tel" />
            </label>
            <Combo
              name="city"
              label="City you live in now"
              options={CITIES}
              allowNew
              required={on(1)}
              icon="pin"
            />
            <Combo
              name="country"
              label="Country"
              options={COUNTRIES}
              required={on(1)}
            />
            <Combo
              name="nationalities"
              label="Nationalities"
              options={NATIONALITIES}
              multi
              max={5}
              hint="Up to five."
            />
            <Combo
              name="languages"
              label="Languages you work in"
              options={LANGUAGES}
              multi
            />
            <Combo
              name="lived_in"
              label="Countries you have lived in"
              options={COUNTRIES}
              multi
              full
            />
            <div className="field full privacy">
              <Ic name="globe" style={{ color: "#4074AE" }} />
              <span className="muted small">
                Your nationalities, languages and the countries you have lived
                in make up your expat journey on your profile.
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ step two */}
        <div id="apply-step-2" hidden={!on(2)}>
          <h3 className="formsec">
            <Ic name="briefcase" />
            Tell us more about your business
          </h3>
          <div className="formgrid">
            <label className="field">
              <span>Business name</span>
              <input name="business_name" />
            </label>
            <label className="field">
              <span>Your role</span>
              <input name="role" placeholder="Founder, cofounder, director" />
            </label>
            <label className="field">
              <span>What industry or niche are you in?</span>
              <select name="industry" defaultValue="">
                <option value="">Choose one</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry}>{industry}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>What stage is your business at?</span>
              <select name="stage" defaultValue="">
                <option value="">Choose one</option>
                {STAGES.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>
            <label className="field full">
              <span>What type of business do you run or are you building?</span>
              <textarea name="about_business" rows={3} />
            </label>
            <label className="field full">
              <span>
                What is your biggest challenge in business at this moment?
              </span>
              <textarea name="challenge" rows={3} />
            </label>
            <label className="field full">
              <span>Website or LinkedIn</span>
              <input name="link" placeholder="studiodubois.com" />
            </label>
          </div>
        </div>

        {/* ---------------------------------------------- step three */}
        <div id="apply-step-3" hidden={!on(3)}>
          <h3 className="formsec">
            <Ic name="check" />
            Now, let us see if we are a good fit
          </h3>
          <div className="formgrid">
            <label className="field full">
              <span>Which Village would you like to join?</span>
              <select
                name="village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              >
                <option value="">Choose one</option>
                {villages.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {v.name}
                    {v.status === "open"
                      ? " (open now)"
                      : v.status === "launching"
                        ? " (opening soon)"
                        : " (being explored)"}
                  </option>
                ))}
                <option value="none">There is no Village in my city yet</option>
              </select>
            </label>

            {village === "none" ? (
              <div className="field full novillage">
                <div
                  className="panel"
                  style={{ borderColor: "#CFDDEE", background: "#FBFCFE" }}
                >
                  <h3 style={{ fontSize: 15 }}>No Village in your city yet</h3>
                  <p className="muted small" style={{ marginTop: 4 }}>
                    We will still read your request, and we will add your city
                    to our list of suggestions. You can join the network and
                    come to events online in the meantime.
                  </p>

                  <div className="panel panel-wash" style={{ marginTop: 12 }}>
                    <h3 style={{ fontSize: 14 }}>
                      What we look for in a new city
                    </h3>
                    <ul className="ticks" style={{ marginTop: 10 }}>
                      {[
                        "A large community of expat entrepreneurs",
                        "English works as the community language",
                        "A trusted member ready to be the Local Admin",
                      ].map((line) => (
                        <li key={line}>
                          <Ic name="check" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* The city itself was asked on step one, so it is not
                      asked again here. */}
                  <div className="formgrid" style={{ marginTop: 14 }}>
                    <label className="field">
                      <span>
                        How many expat entrepreneurs do you know there?
                      </span>
                      <select name="city_entrepreneurs" defaultValue="">
                        <option value="">Choose one</option>
                        {HOW_MANY.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>
                        Is English widely used by entrepreneurs there?
                      </span>
                      <select name="city_english" defaultValue="">
                        <option value="">Choose one</option>
                        {ENGLISH.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="check" style={{ marginTop: 14 }}>
                    <input
                      type="checkbox"
                      name="offers_admin"
                      checked={offersAdmin}
                      onChange={(e) => setOffersAdmin(e.target.checked)}
                    />
                    <span>
                      <b>I would like to be considered as the Local Admin</b>
                      <small>
                        Local Admins are trusted members who look after their
                        Village.
                      </small>
                    </span>
                  </label>

                  <div className="la-extra" hidden={!offersAdmin}>
                    <h3 style={{ fontSize: 14 }}>
                      About you as a possible Local Admin
                    </h3>
                    <div className="formgrid" style={{ marginTop: 10 }}>
                      <label className="field">
                        <span>How long have you lived in this city?</span>
                        <select name="la_years" defaultValue="">
                          <option value="">Choose one</option>
                          {LA_YEARS.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>How many hours a month could you give?</span>
                        <select name="la_hours" defaultValue="">
                          <option value="">Choose one</option>
                          {LA_HOURS.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field full">
                        <span>
                          Have you run or helped run a community before?
                        </span>
                        <textarea
                          name="la_experience"
                          rows={2}
                          placeholder="What you did, and for how long"
                        />
                      </label>
                      <label className="field full">
                        <span>
                          Why would you be a good Local Admin for this city?
                        </span>
                        <textarea name="la_why" rows={3} />
                      </label>
                      <label className="field full">
                        <span>Who could run it with you?</span>
                        <input name="la_partner" placeholder="Optional" />
                        <span className="hint">
                          Villages usually have two Local Admins.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <label className="field">
              <span>How did you hear about ExpatPreneurs?</span>
              <select name="heard_about" defaultValue="">
                <option value="">Choose one</option>
                {HEARD.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Member who referred you</span>
              <input name="referrer" placeholder="Optional" />
            </label>

            <label className="field full">
              <span>
                What I am looking for
                <Req />
              </span>
              <textarea
                name="looking_for"
                rows={3}
                required={on(3)}
                placeholder="The help, the people or the openings that would make a difference right now"
              />
            </label>

            <label className="field full">
              <span>
                What I can help with
                <Req />
              </span>
              <textarea
                name="can_help_with"
                rows={3}
                required={on(3)}
                placeholder="What you know, who you know, or what you are glad to be asked about"
              />
            </label>

            <label className="check field full">
              <input type="checkbox" name="share_answers" value="Yes" />
              <span>
                <b>These two answers may be shared with my Village.</b>
                <span className="hint" style={{ display: "block" }}>
                  They become the introduction waiting for you when you
                  join, so members know how to help and what to ask you.
                  Leave this unticked and only the team reading your
                  request will see them.
                </span>
              </span>
            </label>

            <fieldset className="field full choiceset">
              <legend>
                Do you agree to follow our Community Code of Conduct?
                <Req />
              </legend>
              <div className="hint" style={{ margin: "-2px 0 8px" }}>
                <Link href="/legal/terms">Read the Community Code of Conduct</Link>
              </div>
              <div className="choicegrid">
                {["Yes, I agree", "No"].map((answer) => (
                  <label className="radio" key={answer}>
                    <input
                      type="radio"
                      name="code_of_conduct"
                      value={answer}
                      required={on(3)}
                    />
                    <span>
                      <b>{answer}</b>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="field full choiceset">
              <legend>
                Which of these statements resonate with you? Choose any that do.
              </legend>
              <div className="choicegrid">
                {RESONATE.map((line) => (
                  <label className="check" key={line}>
                    <input type="checkbox" name="resonate" value={line} />
                    <span>
                      <b>{line}</b>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="field full">
              <span>Can you come to gatherings in person?</span>
              <select name="attend" defaultValue={ATTEND[0]}>
                {ATTEND.map((answer) => (
                  <option key={answer}>{answer}</option>
                ))}
              </select>
            </label>

            <label className="field full">
              <span>Why would you like to be part of ExpatPreneurs?</span>
              <textarea name="why_join" rows={4} />
              <span className="hint">
                A few sentences on what you hope to get from the community.
              </span>
            </label>

            <label className="field full">
              <span>What could you give back to the ExpatPreneurs community?</span>
              <textarea name="contribute" rows={3} />
              <span className="hint">
                Expertise, your network, mentoring time, anything.
              </span>
            </label>
          </div>

          <h3 className="formsec">
            <Ic name="heart" />
            Our values
          </h3>
          <div className="stack">
            {([
              ["people", "I will put people before transactions"],
              ["contribute_value", "I will contribute as well as receive"],
              [
                "not_dating",
                "I understand this is a professional community, not a dating space",
              ],
              ["conduct", "I agree to the terms and the privacy policy"],
            ] as Row[]).map(([name, label]) => (
              <label className="check" key={name}>
                <input type="checkbox" name={name} required={on(3)} />
                <span>
                  <b>{label}</b>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------- step four */}
        <div id="apply-step-4" hidden={!on(4)}>
          <div className="stack">
            {summary.map(([title, n, rows]: Panel) => (
              <div className="panel panel-wash" key={title}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: 14 }}>{title}</h3>
                  <button
                    type="button"
                    className="small"
                    onClick={() => go(Number(n))}
                    style={{
                      border: 0,
                      background: "none",
                      fontWeight: 600,
                      color: "var(--blue)",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                </div>
                {rows.length ? (
                  <dl className="kv" style={{ marginTop: 8 }}>
                    {rows.map(([label, value]: Row) => (
                      <div key={label} style={{ display: "contents" }}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Nothing filled in yet.
                  </p>
                )}
              </div>
            ))}
          </div>

          <Captcha />
        </div>

        <p className="small muted" style={{ marginTop: 14 }}>
          Questions marked <span className="req">*</span> are required.
        </p>

        <div
          className="row"
          style={{ justifyContent: "space-between", marginTop: 14 }}
        >
          {step > 1 ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => go(step - 1)}
            >
              Back
            </button>
          ) : (
            <Link className="btn btn-ghost" href="/">
              Cancel
            </Link>
          )}

          {step < 4 ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => go(step + 1)}
            >
              {["Continue to your business", "Continue", "Review your request"][
                step - 1
              ]}
            </button>
          ) : (
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? "Sending" : "Send my request"}
            </button>
          )}
        </div>
      </form>
    </>
  );
}