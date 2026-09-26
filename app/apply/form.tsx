"use client";

import { useActionState, useState } from "react";
import { Ic } from "@/components/icon";
import { submitApplication, type ApplyState } from "./actions";

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



export function ApplyForm({ villages }: { villages: Village[] }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(
    submitApplication,
    {}
  );
  // Picking a city with no Village opens the panel that explains what
  // happens next, as the prototype does.
  const [village, setVillage] = useState("");

  return (
    <form action={action} className="panel">
      {/* Not for people. Anything that fills this in is a machine. */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <h3 className="formsec">
        <Ic name="user" />
        About you
      </h3>
      <div className="formgrid">
        <label className="field">
          <span>First name</span>
          <input name="first_name" required autoComplete="given-name" />
        </label>
        <label className="field">
          <span>Last name</span>
          <input name="last_name" required autoComplete="family-name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="field">
          <span>Phone (WhatsApp)</span>
          <input name="phone" autoComplete="tel" />
        </label>
        <label className="field">
          <span>City you live in now</span>
          <input name="city" required />
        </label>
        <label className="field">
          <span>Country</span>
          <input name="country" required />
        </label>
        <label className="field">
          <span>Nationalities</span>
          <input name="nationalities" placeholder="Separate with commas" />
          <span className="hint">Up to five.</span>
        </label>
        <label className="field">
          <span>Languages you work in</span>
          <input name="languages" placeholder="Separate with commas" />
        </label>
        <label className="field full">
          <span>Countries you have lived in</span>
          <input name="lived_in" placeholder="Separate with commas" />
        </label>
        <div className="field full privacy">
          <Ic name="globe" style={{ color: "#4074AE" }} />
          <span className="muted small">
            Your nationalities, languages and the countries you have lived in
            make up your expat journey on your profile.
          </span>
        </div>
      </div>

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
          <span>What is your biggest challenge in business at this moment?</span>
          <textarea name="challenge" rows={3} />
        </label>
        <label className="field full">
          <span>Website or LinkedIn</span>
          <input name="link" placeholder="studiodubois.com" />
        </label>
      </div>

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
            <div className="panel" style={{ borderColor: "#CFDDEE", background: "#FBFCFE" }}>
              <h3 style={{ fontSize: 15 }}>No Village in your city yet</h3>
              <p className="muted small" style={{ marginTop: 4 }}>
                We will still read your request, and we will add your city to
                our list of suggestions. You can join the network and come to
                events online in the meantime.
              </p>
              <label className="check" style={{ marginTop: 12 }}>
                <input type="checkbox" name="offers_admin" />
                <span>
                  <b>I would be interested in helping start one</b>
                  <small>
                    A Village needs somebody local who knows people and turns
                    up. Tell us and we will talk.
                  </small>
                </span>
              </label>
            </div>
          </div>
        ) : null}

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
      </div>

      <h3 className="formsec">
        <Ic name="heart" />
        Our values
      </h3>
      <div className="stack">
        {[
          ["people", "I will put people before transactions"],
          ["contribute_value", "I will contribute as well as receive"],
          [
            "not_dating",
            "I understand this is a professional community, not a dating space",
          ],
          ["conduct", "I agree to the terms and the privacy policy"],
        ].map(([name, label]) => (
          <label className="check" key={name}>
            <input type="checkbox" name={name} required />
            <span>
              <b>{label}</b>
            </span>
          </label>
        ))}
      </div>

      <button
        className="btn btn-primary"
        type="submit"
        disabled={pending}
        style={{ marginTop: 18 }}
      >
        {pending ? "Sending" : "Send my request"}
      </button>
    </form>
  );
}