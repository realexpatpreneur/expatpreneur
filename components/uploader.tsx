"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// One uploader for every image on the platform. It puts the file in the
// person's own folder, which is what the storage rules check, and hands
// the address back through a hidden field so the form saves it like any
// other value.
export function Uploader({
  name,
  bucket = "covers",
  folder,
  label,
  hint,
  current,
  shape = "wide",
}: {
  name: string;
  bucket?: "avatars" | "covers";
  folder?: string;
  label: string;
  hint?: string;
  current?: string | null;
  shape?: "wide" | "round";
}) {
  const [url, setUrl] = useState<string | null>(current ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You are signed out.");

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${folder ? `${folder}/` : ""}${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch {
      setError("That did not upload. Images only, and under five megabytes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <span>{label}</span>
      <input type="hidden" name={name} value={url ?? ""} />

      {url ? (
        <div className={`shot ${shape}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" />
        </div>
      ) : null}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        disabled={busy}
      />

      {busy ? <span className="hint">Uploading</span> : null}
      {error ? <span className="hint">{error}</span> : null}
      {hint && !error ? <span className="hint">{hint}</span> : null}
      {url ? (
        <button
          className="btn"
          type="button"
          style={{ marginTop: 8 }}
          onClick={() => setUrl(null)}
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}