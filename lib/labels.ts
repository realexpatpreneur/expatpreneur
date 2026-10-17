// The words a reader sees for a value the database keeps in its own
// shorthand.
//
// Postgres stores "exploring", "published", "global_admin". Those are
// column values, not English, and the prototype never shows one to
// anybody. Every page that printed one now reads from here, so the
// wording is in one file rather than scattered through six.

export const villageStatusLabel: Record<string, string> = {
  exploring: "Being explored",
  launching: "Launching soon",
  open: "Open",
  paused: "Paused",
  archived: "Archived",
};

export const memberStatusLabel: Record<string, string> = {
  invited: "Invited",
  onboarding: "Onboarding",
  active: "Active",
  quiet: "Quiet",
  left: "Left",
  removed: "Removed",
};

export const publishLabel: Record<string, string> = {
  draft: "Draft",
  published: "Live",
  archived: "Archived",
};

export const resourceKindLabel: Record<string, string> = {
  guide: "Guide",
  template: "Template",
  recording: "Recording",
};

export const roleLabel: Record<string, string> = {
  global_admin: "Global Admin",
  local_admin: "Local Admin",
  circle_host: "Circle Host",
  industry_lead: "Industry Lead",
  pod_lead: "Pod Lead",
  educator: "Educator",
  media: "Media",
};

// Falls back to the stored value rather than to nothing, so a value
// nobody has written a word for is still legible.
export const say = (
  map: Record<string, string>,
  value: string | null | undefined
) => (value ? (map[value] ?? value) : "");

// A date column, as a person would write it.
export function readableDate(value: string | null | undefined) {
  if (!value) return "";
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return value;
  return when.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}