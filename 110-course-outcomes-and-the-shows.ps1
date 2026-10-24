# 110-course-outcomes-and-the-shows.ps1
# The last two items on the comparison list. One migration:
# 0040_course_outcomes.sql.
#
# The course page opened with a paragraph of description. The prototype
# opens with what you will be able to do afterwards, as a ticked list,
# above everything else, because that is the only thing a buyer actually
# wants to know. 0040 adds the column, the educator writes them one per
# line, and the course page leads with them.
#
# The same page now also says when it happens, who it is for, how long
# it takes, and that refunds are open up to 48 hours before a live
# session. All of that was in the prototype and none of it was on the
# page.
#
# Watch and Listen treated a podcast as one more item in a flat list. It
# now has the shows as shows, each with its cover, what it is and how
# many episodes, leading to that show's own page, with the latest
# episodes underneath. The hardcoded link to the one podcast has gone,
# because the list finds every show by itself.
#
# Run the migration in Supabase:
#   supabase/migrations/0040_course_outcomes.sql
#
#   powershell -ExecutionPolicy Bypass -File .\110-course-outcomes-and-the-shows.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $relativePath"
}

$f0 = @'
-- What somebody will be able to do after taking a course.
--
-- The course page leads with this in the prototype, before the lessons
-- and before the price, because it is the only thing a buyer actually
-- wants to know.

alter table courses
  add column if not exists outcomes text[] not null default '{}';
'@
Write-File "supabase\migrations\0040_course_outcomes.sql" $f0

$f1 = @'
import { DualPage } from "@/components/dual-page";
import Link from "next/link";
import { Ic } from "@/components/icon";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { whoIsHere, isPaid } from "@/lib/member";
import { EnrolButton } from "../forms";
import { BuyButton, RefundForm } from "../buy";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await whoIsHere();
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!course) notFound();
  if (!member && !course.public_listing) notFound();

  const locked = course.tier === "paid" && (!member || !isPaid(member));

  // What this reader would pay, and whether they have already.
  const priceCents = member
    ? course.member_price_cents ?? course.price_cents
    : course.price_cents;

  const money = (cents: number) =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency: course.currency ?? "EUR",
      maximumFractionDigits: 0,
    });

  const { data: bought } = member
    ? await supabase
        .from("course_purchases")
        .select("id, created_at")
        .eq("course_id", course.id)
        .eq("profile_id", member.id)
        .eq("status", "paid")
        .maybeSingle()
    : { data: null };

  const paidFor = priceCents === 0 || Boolean(bought);

  const [
    { data: lessons },
    { data: enrolment },
    { data: educator },
    { data: teaching },
    { data: progress },
  ] =
    await Promise.all([
      supabase
        .from("lessons")
        .select("id, position, title, duration")
        .eq("course_id", course.id)
        .order("position"),
      member
        ? supabase
            .from("enrolments")
            .select("started_at, completed_at")
            .eq("course_id", course.id)
            .eq("profile_id", member.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      course.educator_id
        ? supabase
            .from("profiles")
            .select("id, full_name, headline")
            .eq("id", course.educator_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      course.educator_id
        ? supabase
            .from("educator_profiles")
            .select("headline, about, teaches_in, markets")
            .eq("profile_id", course.educator_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      member
        ? supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("profile_id", member.id)
        : Promise.resolve({ data: [] }),
    ]);

  const doneIds = new Set((progress ?? []).map((p) => p.lesson_id));

  return (
    <DualPage member={Boolean(member)} nav="/learning" active="/learning">
        <section className="sec">
          <p className="muted small">
            <Link href="/learning">Learning</Link>
          </p>
          <p>
            <span className="chip">{course.level}</span>{" "}
            {course.duration ? <span className="chip">{course.duration}</span> : null}{" "}
            {course.tier === "paid" ? (
              <span className="chip chip-sun">Paid plan</span>
            ) : null}
          </p>
          <h1>{course.title}</h1>
          <p className="lead">{course.summary}</p>
        </section>

        <section className="sec">
          <div className="gside">
            <div className="stack">
              {(course.outcomes ?? []).length ? (
                <div className="panel">
                  <h3>You will learn to</h3>
                  <ul className="ticks" style={{ marginTop: 10 }}>
                    {(course.outcomes as string[]).map((outcome) => (
                      <li key={outcome}>
                        <Ic name="check" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="panel">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                  {course.description}
                </p>
              </div>

              <div className="panel">
                <h3>The detail</h3>
                <dl className="kv">
                  <dt>When</dt>
                  <dd>
                    {course.format === "live"
                      ? course.starts_at
                        ? new Date(course.starts_at).toLocaleString("en-GB", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "A live workshop, date to be set"
                      : "Recorded, taken whenever you like"}
                  </dd>
                  <dt>For</dt>
                  <dd>{course.level}</dd>
                  <dt>How long</dt>
                  <dd>{course.duration ?? "Not said"}</dd>
                </dl>
                <p className="muted small" style={{ marginTop: 10 }}>
                  Refunds up to 48 hours before a live session.
                </p>
              </div>

              <div className="panel">
                <h3>{(lessons ?? []).length} lessons</h3>
                {(lessons ?? []).length === 0 ? (
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Still being written.
                  </p>
                ) : (
                  <div className="divide" style={{ marginTop: 12 }}>
                    {(lessons ?? []).map((lesson) => (
                      <Link
                        className="li linkrow"
                        key={lesson.id}
                        href={
                          enrolment && !locked && paidFor
                            ? `/learning/${slug}/${lesson.position}`
                            : `/learning/${slug}`
                        }
                      >
                        <div>
                          <b>
                            {lesson.position}. {lesson.title}
                          </b>
                          {lesson.duration ? (
                            <div className="muted small">{lesson.duration}</div>
                          ) : null}
                        </div>
                        <div className="rowmeta">
                          {doneIds.has(lesson.id) ? (
                            <span className="chip chip-mint">Done</span>
                          ) : null}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="stack">
              {bought ? (
                <div className="panel panel-wash">
                  <h3>You bought this</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    If it was not what you expected, say so. Refunds are
                    handled by the Global team, not by the educator.
                  </p>
                  <RefundForm purchaseId={bought.id} slug={slug} />
                </div>
              ) : null}

              <div className="panel">
                {!member ? (
                  <>
                    <h3>
                      {priceCents === 0 ? "Free" : money(priceCents)}
                    </h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {priceCents === 0
                        ? "Free, but you need an account to take it."
                        : "Anyone can buy this. Members pay the member price."}
                    </p>
                    {priceCents === 0 ? (
                      <Link className="btn btn-primary" href="/apply">
                        Request an invitation
                      </Link>
                    ) : (
                      <>
                        <BuyButton slug={slug} label={`Buy it, ${money(priceCents)}`} />
                        <p className="muted small" style={{ marginTop: 10 }}>
                          You will get it by email. Members take it inside the
                          platform, with everything else.
                        </p>
                      </>
                    )}
                  </>
                ) : !paidFor ? (
                  <>
                    <h3>{money(priceCents)}</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {course.member_price_cents !== null &&
                      course.member_price_cents < course.price_cents
                        ? `The member price. Others pay ${money(course.price_cents)}.`
                        : "Yours once you buy it, for good."}
                    </p>
                    <BuyButton slug={slug} label="Buy this course" />
                  </>
                ) : locked ? (
                  <>
                    <h3>Part of the paid plan</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Some courses come with paid membership, along with the
                      rest of the network.
                    </p>
                    <Link className="btn btn-ghost" href="/upgrade">
                      See the paid plan
                    </Link>
                  </>
                ) : enrolment ? (
                  <>
                    <h3>
                      {enrolment.completed_at ? "You finished this" : "You are in"}
                    </h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      {enrolment.completed_at
                        ? "Go back to any lesson whenever you need it."
                        : "Pick up where you left off."}
                    </p>
                    {(lessons ?? []).length ? (
                      <Link
                        className="btn btn-primary"
                        href={`/learning/${slug}/${
                          (lessons ?? []).find((l) => !doneIds.has(l.id))?.position ??
                          1
                        }`}
                      >
                        {enrolment.completed_at ? "Open it" : "Continue"}
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <EnrolButton courseId={course.id} slug={slug} />
                )}
              </div>

              {educator ? (
                <div className="panel">
                  <h3>Taught by</h3>
                  <p className="muted small" style={{ marginTop: 6 }}>
                    {member ? (
                      <Link href={`/members/${educator.id}`}>
                        {educator.full_name}
                      </Link>
                    ) : (
                      educator.full_name
                    )}
                    {teaching?.headline
                      ? `, ${teaching.headline}`
                      : educator.headline
                        ? `, ${educator.headline}`
                        : ""}
                  </p>
                  {teaching?.about ? (
                    <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                      {teaching.about}
                    </p>
                  ) : null}
                  {(teaching?.markets ?? []).length ? (
                    <p className="muted small">
                      Knows {(teaching?.markets ?? []).join(", ")}.
                    </p>
                  ) : null}
                  {(teaching?.teaches_in ?? []).length ? (
                    <p className="muted small">
                      Teaches in {(teaching?.teaches_in ?? []).join(", ")}.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </DualPage>
  );
}
'@
Write-File "app\learning\[slug]\page.tsx" $f1

$f2 = @'
"use client";

import { useActionState } from "react";
import {
  saveCourse,
  saveLesson,
  deleteLesson,
  type EducatorState,
} from "./actions";
import { Uploader } from "@/components/uploader";

export function CourseForm({
  course,
}: {
  course?: {
    id: string;
    title: string;
    summary: string | null;
    description: string | null;
    level: string;
    duration: string | null;
    format?: string | null;
    starts_at?: string | null;
    outcomes?: string[] | null;
    tier: string;
    status: string;
    cover_url?: string | null;
    price_cents?: number;
    member_price_cents?: number | null;
    currency?: string;
    public_listing?: boolean;
  };
}) {
  const [state, action, pending] = useActionState<EducatorState, FormData>(
    saveCourse,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{course ? course.title : "New course"}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      {course ? <input type="hidden" name="id" value={course.id} /> : null}

      <Uploader
        name="cover_url"
        folder="courses"
        label="Cover image"
        current={course?.cover_url}
      />

      <label className="field">
        <span>Title</span>
        <input name="title" required defaultValue={course?.title ?? ""} />
      </label>

      <label className="field">
        <span>One line</span>
        <input name="summary" defaultValue={course?.summary ?? ""} />
      </label>

      <label className="field">
        <span>What it covers</span>
        <textarea name="description" rows={4} defaultValue={course?.description ?? ""} />
      </label>

      <label className="field">
        <span>What will they be able to do afterwards?</span>
        <textarea
          name="outcomes"
          rows={4}
          defaultValue={(course?.outcomes ?? []).join("\n")}
          placeholder={"One per line\nPrice work without apologising for it\nSay no to the wrong client"}
        />
        <span className="hint">
          One per line. These are the first thing somebody reads on the
          course page, above everything else.
        </span>
      </label>

      <div className="g2">
        <label className="field">
          <span>Live or recorded</span>
          <select name="format" defaultValue={course?.format ?? "recorded"}>
            <option value="recorded">Recorded, taken any time</option>
            <option value="live">Live workshop, on a date</option>
          </select>
        </label>
        <label className="field">
          <span>When, if it is live</span>
          <input
            name="starts_at"
            type="datetime-local"
            defaultValue={course?.starts_at ? course.starts_at.slice(0, 16) : ""}
          />
          <span className="hint">Leave it empty for anything recorded.</span>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Who it is for</span>
          <select name="level" defaultValue={course?.level ?? "anyone"}>
            <option value="anyone">Anyone</option>
            <option value="starting out">Starting out</option>
            <option value="running it">Already running it</option>
          </select>
        </label>
        <label className="field">
          <span>How long</span>
          <input
            name="duration"
            defaultValue={course?.duration ?? ""}
            placeholder="4 lessons, about an hour"
          />
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Price for everybody</span>
          <input
            name="price"
            type="number"
            min={0}
            step="1"
            defaultValue={(course?.price_cents ?? 0) / 100}
          />
          <span className="hint">Zero is free.</span>
        </label>
        <label className="field">
          <span>Price for members</span>
          <input
            name="member_price"
            type="number"
            min={0}
            step="1"
            defaultValue={
              course?.member_price_cents === null ||
              course?.member_price_cents === undefined
                ? ""
                : course.member_price_cents / 100
            }
            placeholder="Same as above"
          />
          <span className="hint">
            Leave it empty to charge members the same.
          </span>
        </label>
      </div>

      <div className="g2">
        <label className="field">
          <span>Currency</span>
          <select name="currency" defaultValue={course?.currency ?? "EUR"}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
          </select>
        </label>
        <label className="field">
          <span>Who can take it</span>
          <select name="tier" defaultValue={course?.tier ?? "all"}>
            <option value="all">Every member</option>
            <option value="paid">Paid members only</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={course?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="retired">Retired</option>
          </select>
        </label>
      </div>

      <label className="check">
        <input
          type="checkbox"
          name="public_listing"
          defaultChecked={course?.public_listing ?? true}
        />
        <span>
          <b>Sell it to people who are not members</b>
          <small>
            Off keeps it inside the network. On means it appears on the public
            learning page, which is how somebody finds their way in.
          </small>
        </span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function LessonForm({
  courseId,
  nextPosition,
  lesson,
}: {
  courseId: string;
  nextPosition: number;
  lesson?: {
    id: string;
    position: number;
    title: string;
    body: string | null;
    video_url: string | null;
    duration: string | null;
  };
}) {
  const [state, action, pending] = useActionState<EducatorState, FormData>(
    saveLesson,
    {}
  );

  return (
    <form action={action} className="panel">
      <h3>{lesson ? `${lesson.position}. ${lesson.title}` : "New lesson"}</h3>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="course_id" value={courseId} />
      {lesson ? <input type="hidden" name="id" value={lesson.id} /> : null}

      <div className="g2" style={{ marginTop: 10 }}>
        <label className="field">
          <span>Position</span>
          <input
            name="position"
            type="number"
            min={1}
            defaultValue={lesson?.position ?? nextPosition}
          />
        </label>
        <label className="field">
          <span>How long</span>
          <input name="duration" defaultValue={lesson?.duration ?? ""} placeholder="12 minutes" />
        </label>
      </div>

      <label className="field">
        <span>Title</span>
        <input name="title" required defaultValue={lesson?.title ?? ""} />
      </label>

      <label className="field">
        <span>Video link</span>
        <input name="video_url" defaultValue={lesson?.video_url ?? ""} placeholder="https://" />
      </label>

      <label className="field">
        <span>The lesson</span>
        <textarea name="body" rows={6} defaultValue={lesson?.body ?? ""} />
      </label>

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save"}
      </button>
    </form>
  );
}

export function DeleteLessonButton({
  id,
  courseId,
}: {
  id: string;
  courseId: string;
}) {
  const [state, action, pending] = useActionState<EducatorState, FormData>(
    deleteLesson,
    {}
  );

  return (
    <form action={action} style={{ marginTop: 10 }}>
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="course_id" value={courseId} />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Taking it down" : "Take this lesson down"}
      </button>
    </form>
  );
}
'@
Write-File "app\educator\forms.tsx" $f2

$f3 = @'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/events";

export type EducatorState = { error?: string };

// A course belongs to the person teaching it. The database checks that
// again on every write.
export async function saveCourse(
  _prev: EducatorState,
  formData: FormData
): Promise<EducatorState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/educator");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A title is needed." };

  const id = String(formData.get("id") ?? "");
  const row = {
    title,
    summary: String(formData.get("summary") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    level: String(formData.get("level") ?? "anyone"),
    duration: String(formData.get("duration") ?? "").trim() || null,
    format: String(formData.get("format") ?? "recorded") === "live" ? "live" : "recorded",
    outcomes: String(formData.get("outcomes") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    starts_at: String(formData.get("starts_at") ?? "").trim() || null,
    tier: String(formData.get("tier") ?? "all"),
    price_cents: Math.round(Number(formData.get("price") ?? 0) * 100),
    member_price_cents:
      String(formData.get("member_price") ?? "").trim() === ""
        ? null
        : Math.round(Number(formData.get("member_price")) * 100),
    currency: String(formData.get("currency") ?? "EUR"),
    public_listing: Boolean(formData.get("public_listing")),
    status: String(formData.get("status") ?? "draft"),
  };

  const { error } = id
    ? await supabase.from("courses").update(row).eq("id", id)
    : await supabase
        .from("courses")
        .insert({ ...row, educator_id: user.id, slug: slugify(title) });

  if (error) {
    return { error: "That was refused. Courses are written by Educators." };
  }

  revalidatePath("/educator");
  redirect("/educator?done=1");
}

export async function saveLesson(
  _prev: EducatorState,
  formData: FormData
): Promise<EducatorState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/educator");

  const courseId = String(formData.get("course_id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A lesson needs a title." };

  const id = String(formData.get("id") ?? "");
  const row = {
    title,
    body: String(formData.get("body") ?? "").trim() || null,
    video_url: String(formData.get("video_url") ?? "").trim() || null,
    duration: String(formData.get("duration") ?? "").trim() || null,
    format: String(formData.get("format") ?? "recorded") === "live" ? "live" : "recorded",
    outcomes: String(formData.get("outcomes") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    starts_at: String(formData.get("starts_at") ?? "").trim() || null,
    position: Number(formData.get("position") ?? 1),
  };

  const { error } = id
    ? await supabase.from("lessons").update(row).eq("id", id)
    : await supabase.from("lessons").insert({ ...row, course_id: courseId });

  if (error) {
    return {
      error:
        "That was refused. Two lessons cannot share a position in the same course.",
    };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();

  revalidatePath(`/educator/${course?.slug}`);
  redirect(`/educator/${course?.slug}?done=1`);
}

export async function deleteLesson(
  _prev: EducatorState,
  formData: FormData
): Promise<EducatorState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/educator");

  const courseId = String(formData.get("course_id"));

  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", String(formData.get("id")));

  if (error) {
    return { error: "Only the educator who wrote it can take it down." };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();

  revalidatePath(`/educator/${course?.slug}`);
  redirect(`/educator/${course?.slug}?done=1`);
}
'@
Write-File "app\educator\actions.ts" $f3

$f4 = @'
import { DualPage } from "@/components/dual-page";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/member";

export const metadata = { title: "Watch and Listen, ExpatPreneurs Global" };

const covers = ["blue", "mint", "pink", "navy", "sun", "paper"] as const;

const kindLabel: Record<string, string> = {
  video: "Video",
  episode: "Podcast",
  article: "Article",
};

// Open to everyone. Members also see the pieces kept for members.
export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show = "all" } = await searchParams;
  const supabase = await createClient();

  const user = await currentUser();

  let query = supabase
    .from("media_items")
    .select("id, slug, kind, title, summary, duration, member_only, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(60);

  if (show !== "all") query = query.eq("kind", show);

  const [{ data: items }, { data: shows }] = await Promise.all([
    query,
    supabase
      .from("shows")
      .select("slug, name, about, cover_url")
      .order("name"),
  ]);

  // How many episodes each show has, so the row can say.
  const { data: episodeCounts } = await supabase
    .from("media_items")
    .select("show_slug")
    .eq("kind", "episode")
    .not("published_at", "is", null);

  const episodesIn = (slug: string) =>
    (episodeCounts ?? []).filter((e) => e.show_slug === slug).length;

  return (
    <DualPage member={Boolean(user)} nav="/watch" active="/watch">
        <section className={user ? "sec" : "pubsec hero-center"}>
          <h1>Watch and Listen</h1>
          <p className="lead">
            Members talking about what building a business away from home
            actually takes.
          </p>
          <div className="tabs">
            {[
              ["all", "Everything"],
              ["video", "Videos"],
              ["episode", "Podcast"],
              ["article", "Articles"],
            ].map(([key, label]) => (
              <Link
                key={key}
                className={`chip ${show === key ? "chip-mint" : ""}`}
                href={`/watch?show=${key}`}
              >
                {label}
              </Link>
            ))}
          </div>
</section>

        {(shows ?? []).length && show !== "video" && show !== "article" ? (
          <section className="sec">
            <div className="sechead">
              <h2 style={{ fontSize: 20 }}>The shows</h2>
            </div>
            <div className="pshows">
              {(shows ?? []).map((item) => (
                <Link
                  className="pshow linkrow"
                  key={item.slug}
                  href={`/watch/show/${item.slug}`}
                >
                  {item.cover_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.cover_url} alt="" />
                  ) : (
                    <span className="cover navy">{item.name}</span>
                  )}
                  <div>
                    <b>{item.name}</b>
                    <div className="muted small">{item.about}</div>
                    <div className="muted small">
                      {episodesIn(item.slug)}{" "}
                      {episodesIn(item.slug) === 1 ? "episode" : "episodes"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="sec">
          <div className="sechead">
            <h2 style={{ fontSize: 20 }}>
              {show === "episode" ? "Latest episodes" : "Latest"}
            </h2>
          </div>
          {(items ?? []).length === 0 ? (
            <div className="panel panel-wash">
              <p className="muted" style={{ margin: 0 }}>
                Nothing published yet.
              </p>
            </div>
          ) : (
            <div className="g3">
              {(items ?? []).map((item, i) => (
                <article className="card" key={item.id}>
                  <Link href={`/watch/${item.slug}`}>
                    <div className={`cover ${covers[i % covers.length]}`}>
                      {item.title}
                    </div>
                    <div className="kind">
                      {kindLabel[item.kind] ?? item.kind}
                      {item.duration ? `, ${item.duration}` : ""}
                    </div>
                    <p>{item.summary}</p>
                    {item.member_only ? (
                      <div className="meta">
                        <span className="chip">Members only</span>
                      </div>
                    ) : null}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </DualPage>
        );
}
'@
Write-File "app\watch\page.tsx" $f4

git add app supabase
git commit -m "Course outcomes, the course detail, and podcast shows as shows"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Run 0040_course_outcomes.sql in Supabase."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
