# 119-eight-of-ten-the-legal-drafts.ps1
# Eight of ten. One migration: 0043_cookies_page.sql.
#
# I cannot write these and should not try. What I can do is stop the
# lawyer starting from nothing, which is most of what they would charge
# you for.
#
# legal/BRIEF-FOR-THE-LAWYER.md is a factual description of what the
# platform does with personal data, taken from the database rather than
# from anybody's memory: the fifteen tables that hold something about a
# person and exactly which columns, the six companies that touch the
# data and what each one holds, and what the three drafts are missing.
#
# Four things in it need a decision rather than drafting, and they are
# the ones worth reading:
#
#   Nationalities. The platform asks every applicant, and uses the
#   answer to keep a Village internationally mixed. That is sensitive
#   data in any reading. It is never shown to members and never given
#   as a reason, but somebody has to say whether it is defensible where
#   the entity sits.
#
#   Retention. Nothing has a period. Declined applications, members who
#   leave, guests who registered for one event and never came back.
#
#   The anonymous suggestion box, which stores no identifier at all, so
#   nobody including us can trace one.
#
#   Recordings, where everybody is told on screen when recording starts,
#   and whether being told is enough.
#
# Then the migration, which is a gap I found while writing it. Privacy
# and Terms can be rewritten in the Global workspace and published
# without a deploy. Cookies could not, because it never had a row, so
# the lawyer's wording would have had to come back through me. It has
# one now, holding what the page says today.
#
# Run the migration in Supabase:
#   supabase/migrations/0043_cookies_page.sql
#
#   powershell -ExecutionPolicy Bypass -File .\119-eight-of-ten-the-legal-drafts.ps1

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
# ExpatPreneurs Global: a brief for the lawyer

This is not a legal document and it is not legal advice. It is a
factual description of what the platform does with personal data,
written from the database and the code rather than from intention, so
that the person drafting the policies is working from what is true.

Three drafts sit in the repository and on the site: a privacy policy,
terms of service and a cookie policy. Each says on its own page that it
is a draft. They describe the platform accurately but they have not
been written or checked by a lawyer, and every placeholder in them is
marked like [this].

## What the business is

A private, invitation-only network of expatriate entrepreneurs. Members
belong to a Village, which is a city, and within it a Circle of up to
fifty people. Membership is free. A paid plan, not yet switched on,
gives access to other Villages. There is also a marketplace of courses
sold by members, and ticketed events.

The first Village is Dubai. The founder is based in France. Members are
expected across the Gulf, Europe and Africa, which is the first
question for you: which law governs this, and where is the entity.

## Where the data lives

- Supabase, a hosted Postgres database and file storage. Region as
  chosen in the Supabase project.
- Vercel, which serves the site and runs the code.
- Stripe, for payments, when switched on. Stripe holds the card
  details; the platform never sees them.
- Resend, for email, when switched on.
- LiveKit, for audio and video in live rooms, when switched on.
  Recordings are uploaded from LiveKit into our own Supabase storage.
- Cloudflare Turnstile, the captcha on public forms.

## Every table that holds something about a person

Taken from the schema, not from memory.

    applications          name, email, phone, city, country,
                          nationalities, languages, and the answers to
                          the invitation questions
    profiles              name, email, phone, photograph, biography,
                          nationalities, languages, countries lived in
    founding_invites      name, email, phone of people already in the
                          Dubai WhatsApp group
    enquiries             name, email from the contact page
    city_suggestions      email, city, country
    newsletter_signups    email
    event_registrations   guest name, email, company, city
    session_participants  guest name, email
    payments              guest email
    course_purchases      guest name, email
    form_hits             a hashed address, for rate limiting, deleted
                          after a day
    events                venue address
    market_posts,         city and country, about markets rather than
    market_pathways,      about people
    villages

## The four things that need a decision, not drafting

**Nationalities.** The platform asks every applicant for their
nationalities and uses them to keep a Village internationally mixed,
with a limit per nationality. This is special category data in some
readings and plainly sensitive in all of them. It is never shown to
members, only inside the admin workspaces, and it is never given as a
reason to anybody. We need to know whether this is defensible where the
entity sits, and what the policy must say about it.

**Retention.** Nothing has a retention period yet. Declined
applications, the details of members who leave, event registrations
from guests who never joined, recordings, which are deleted after 180
days. Every one of those needs a number from you.

**Anonymous suggestions.** The suggestion box can be used
anonymously, and when it is, no identifier is stored with the
suggestion. Nobody, including us, can trace it. We believe that is the
right design; you should know it exists.

**Recordings of live sessions.** Everybody in a room is told when
recording starts, on screen. Recordings are private to the people the
session was open to, unless a host publishes one. We need to know
whether being told is enough or whether consent must be recorded.

## What the drafts are missing

The three drafts describe what happens. They do not yet contain: the
entity and its registered address, the governing law and jurisdiction,
the retention periods, the fee terms, a lawful basis for each kind of
processing, the international transfer position, anything about
children, though membership is for business owners and there is no
reason a minor would apply, and how changes to the policies are
notified.

## What we will do with what you send back

The three pages read from the database, so the final text can be
pasted into the Global workspace under Content and published without a
deploy. Nothing about this needs a developer once you have written it.
'@
Write-File "legal\BRIEF-FOR-THE-LAWYER.md" $f0

$f1 = @'
-- The cookie policy, editable like the other two.
--
-- Privacy and Terms can be rewritten in the Global workspace and
-- published without a deploy. Cookies could not, because it was never
-- given a row, so a lawyer's wording would have had to come back to a
-- developer. It has one now, as a draft, holding what the page says
-- today.

insert into pages (slug, title, path, status, search_title, search_description, blocks)
values
('cookies', 'Cookie policy', '/legal/cookies', 'draft',
 'Cookie policy, ExpatPreneurs Global',
 'What ExpatPreneurs keeps on your device, and why.',
 '[
   {"type":"hero",
    "heading":"Cookie policy",
    "text":"What we keep on your device, and why."},
   {"type":"heading","heading":"Essential cookies"},
   {"type":"text","body":"One set by Supabase, which keeps you signed in and keeps the session secure. Without it you would have to sign in on every page. It cannot be switched off while you are using an account."},
   {"type":"heading","heading":"Analytics"},
   {"type":"text","body":"Vercel counts page views to tell us which pages are used and how quickly they load. It does not follow you to other sites and it does not build a profile of you."},
   {"type":"heading","heading":"Advertising"},
   {"type":"text","body":"None. We do not advertise to you and we do not let anyone else advertise to you here."},
   {"type":"heading","heading":"Your choice"},
   {"type":"text","body":"You can clear or block cookies in your browser. Blocking the essential one will sign you out and keep you out."}
 ]'::jsonb)
on conflict (slug) do nothing;
'@
Write-File "supabase\migrations\0043_cookies_page.sql" $f1

git add legal supabase/migrations/0043_cookies_page.sql
git commit -m "A brief for the lawyer from the schema, and a cookie policy that can be edited"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed. Run 0043_cookies_page.sql in Supabase."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
