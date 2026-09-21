"use client";

import { useActionState } from "react";
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

  return (
    <form action={action} className="panel" style={{ maxWidth: 720 }}>
      {/* Not for people. Anything that fills this in is a machine. */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>


      {state.error ? <div className="flag hold">{state.error}</div> : null}

      <label className="field">
        <span>Your name</span>
        <input name="full_name" required autoComplete="name" />
      </label>

      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>

      <label className="field">
        <span>Phone, with country code</span>
        <input name="phone" autoComplete="tel" />
      </label>

      <label className="field">
        <span>Which city do you live in?</span>
        <input name="city" required />
      </label>

      <label className="field">
        <span>Country</span>
        <input name="country" />
      </label>

      <label className="field">
        <span>Which Village is closest to you?</span>
        <select name="village" defaultValue="">
          <option value="">Somewhere else</option>
          {villages.map((village) => (
            <option key={village.slug} value={village.slug}>
              {village.name}
            </option>
          ))}
        </select>
        <span className="hint">
          If your city is not here yet, tell us and we will count you in.
        </span>
      </label>

      <label className="field">
        <span>Your business</span>
        <input name="business_name" />
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
        <span>Your role</span>
        <input name="role" placeholder="Founder, cofounder, director" />
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

      <label className="field">
        <span>Nationalities</span>
        <input name="nationalities" placeholder="Separate with commas" />
        <span className="hint">Up to five.</span>
      </label>

      <label className="field">
        <span>Languages you work in</span>
        <input name="languages" placeholder="Separate with commas" />
      </label>

      <label className="field">
        <span>Countries you have lived in</span>
        <input name="lived_in" placeholder="Separate with commas" />
        <span className="hint">
          This becomes your expat journey on your profile.
        </span>
      </label>

      <label className="field">
        <span>What type of business do you run or are you building?</span>
        <textarea name="about_business" rows={4} />
      </label>

      <label className="field">
        <span>What is your biggest challenge in business at this moment?</span>
        <textarea name="challenge" rows={3} />
      </label>

      <label className="field">
        <span>Website or LinkedIn</span>
        <input name="link" placeholder="studiodubois.com" />
      </label>

      <label className="field">
        <span>Why would you like to be part of ExpatPreneurs?</span>
        <textarea name="why_join" rows={4} />
        <span className="hint">
          A few sentences on what you hope to get from the community.
        </span>
      </label>

      <label className="field">
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

      <fieldset className="field choiceset">
        <legend>Which of these resonate with you?</legend>
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

      <label className="field">
        <span>Can you come to gatherings in person?</span>
        <select name="attend" defaultValue={ATTEND[0]}>
          {ATTEND.map((answer) => (
            <option key={answer}>{answer}</option>
          ))}
        </select>
      </label>

      <label className="check">
        <input type="checkbox" name="conduct" required />
        <span>
          <b>I agree to follow the community code of conduct</b>
          <small>
            People before transactions. No pitching in the groups. What is said
            in a Circle stays in it.
          </small>
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send my request"}
      </button>
    </form>
  );
}