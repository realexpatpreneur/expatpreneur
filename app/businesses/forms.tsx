"use client";

import { useActionState } from "react";
import { saveBusiness, saveJob, closeJob, type BusinessState, type JobState } from "./actions";

export function BusinessForm({
  business,
}: {
  business?: {
    id: string;
    name: string;
    tagline: string | null;
    description: string | null;
    industry: string | null;
    website: string | null;
    founded: string | null;
    serves: string[] | null;
    public: boolean;
  };
}) {
  const [state, action, pending] = useActionState<BusinessState, FormData>(
    saveBusiness,
    {}
  );

  return (
    <form action={action} className="panel" style={{ maxWidth: 720 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}
      {business ? <input type="hidden" name="id" value={business.id} /> : null}

      <label className="field">
        <span>Name</span>
        <input name="name" required defaultValue={business?.name ?? ""} />
      </label>

      <label className="field">
        <span>One line</span>
        <input
          name="tagline"
          defaultValue={business?.tagline ?? ""}
          placeholder="What it does, without the adjectives"
        />
      </label>

      <div className="two">
        <label className="field">
          <span>Industry</span>
          <input name="industry" defaultValue={business?.industry ?? ""} />
        </label>
        <label className="field">
          <span>Started</span>
          <input name="founded" defaultValue={business?.founded ?? ""} placeholder="2021" />
        </label>
      </div>

      <label className="field">
        <span>Website</span>
        <input name="website" defaultValue={business?.website ?? ""} placeholder="https://" />
      </label>

      <label className="field">
        <span>What it does</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={business?.description ?? ""}
        />
      </label>

      <label className="field">
        <span>Countries you sell into</span>
        <input
          name="serves"
          defaultValue={(business?.serves ?? []).join(", ")}
          placeholder="Separate with commas"
        />
        <span className="hint">
          This is how members find you when they are looking at a market.
        </span>
      </label>

      <label className="check">
        <input type="checkbox" name="public" defaultChecked={business?.public ?? false} />
        <span>
          <b>Show it on the public site</b>
          <small>
            Members see it either way. This puts it in front of people who are
            not members yet.
          </small>
        </span>
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function JobForm({
  businesses,
  villageName,
}: {
  businesses: { id: string; name: string }[];
  villageName: string | null;
}) {
  const [state, action, pending] = useActionState<JobState, FormData>(saveJob, {});

  return (
    <form action={action} className="panel" style={{ maxWidth: 720 }}>
      {state.error ? <div className="notice bad">{state.error}</div> : null}

      <label className="field">
        <span>What are you looking for?</span>
        <select name="kind" defaultValue="job">
          <option value="job">Someone to hire</option>
          <option value="freelance">Freelance or a project</option>
          <option value="partner">A partner or a collaborator</option>
        </select>
      </label>

      <label className="field">
        <span>Title</span>
        <input name="title" required placeholder="Operations manager, part time" />
      </label>

      {businesses.length ? (
        <label className="field">
          <span>Which business?</span>
          <select name="business_id" defaultValue={businesses[0]?.id}>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
            <option value="">Not for a listed business</option>
          </select>
        </label>
      ) : null}

      <div className="two">
        <label className="field">
          <span>Where</span>
          <input name="location" placeholder="Dubai, or anywhere" />
        </label>
        <label className="field">
          <span>Pay</span>
          <input name="compensation" placeholder="Be honest about the range" />
        </label>
      </div>

      <label className="check">
        <input type="checkbox" name="remote" />
        <span>
          <b>Can be done remotely</b>
        </span>
      </label>

      <label className="field">
        <span>Who should see it?</span>
        <select name="reach" defaultValue="village">
          <option value="village">
            {villageName ? `${villageName} Village only` : "My Village only"}
          </option>
          <option value="all_villages">Every Village</option>
        </select>
      </label>

      <label className="field">
        <span>The detail</span>
        <textarea name="description" rows={5} required />
      </label>

      <label className="field">
        <span>How should people get in touch?</span>
        <input name="apply_note" placeholder="Message me here, or write to..." />
      </label>

      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Posting" : "Post"}
      </button>
    </form>
  );
}

export function CloseJobForm({ jobId }: { jobId: string }) {
  const [, action, pending] = useActionState<JobState, FormData>(closeJob, {});

  return (
    <form action={action} className="row">
      <input type="hidden" name="job_id" value={jobId} />
      <button className="btn" name="status" value="filled" disabled={pending}>
        Filled it
      </button>
      <button className="btn" name="status" value="closed" disabled={pending}>
        Close it
      </button>
    </form>
  );
}