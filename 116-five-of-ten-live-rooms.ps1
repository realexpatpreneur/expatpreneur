# 116-five-of-ten-live-rooms.ps1
# Five of ten. One document, no code changes, no migration.
#
# I went looking for something broken in the live rooms and did not find
# it, which is worth saying as plainly as I say the opposite.
#
# I thought the recordings had nowhere to go, because I could not
# remember making the bucket. It is there, made in migration 0009,
# private, with rules that let only the people a session was open to
# watch it back. The token route refuses anybody who is not allowed in,
# anybody who has not knocked, anybody a host removed and anybody still
# at the door, all of it decided by the database rather than by the
# page. The room only ever gets a token saying who you are and what you
# may do.
#
# So this one is genuinely just keys. supabase/setup/live-rooms-setup.md
# has the four settings for LiveKit, the four more for recording into
# our own storage, what streaming out needs, which is nothing beyond the
# first four, and what to test on the day.
#
# The useful part of that document is the last paragraph. Nothing new
# gets written when the keys arrive. The lobby, the door, the roles, the
# tables and the attendance have all been running without media since
# they were built, so the only thing being switched on is the picture
# and the sound.
#
#   powershell -ExecutionPolicy Bypass -File .\116-five-of-ten-live-rooms.ps1

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
# Switching the live rooms on

Everything around a room is built and working today: who may come in,
the lobby and the door, the roles, the tables, the questions, the
attendance record, and the page that says all of it. What is missing is
the audio and video themselves, which need an account with LiveKit.

The room page says so plainly rather than showing a broken player, so
this can wait as long as you like.

## What LiveKit is, and what it costs

It carries the audio and video. The platform never sees the media; it
issues a token saying who this person is and what they may do, and the
browser talks to LiveKit directly. There is a free tier that covers a
roundtable or two a month, and it is charged by the minute after that.

## The four settings

From LiveKit Cloud, a project, then Settings, Keys:

    LIVEKIT_URL              wss://something.livekit.cloud
    LIVEKIT_API_KEY          API...
    LIVEKIT_API_SECRET       the secret beside it
    NEXT_PUBLIC_LIVEKIT_URL  the same wss address again

The last one is the same address, readable by the browser. Both are
needed because the server mints the token and the browser makes the
connection.

## Recording, which needs four more

Recordings do not stay with LiveKit. They are uploaded straight into
our own Supabase storage, into a private bucket called recordings that
already exists, and only the people the session was open to can watch
them.

Supabase speaks the S3 protocol, which is how LiveKit writes there. In
Supabase, Settings, Storage, enable S3 access, then take the endpoint
and make an access key:

    S3_ENDPOINT     https://<project>.supabase.co/storage/v1/s3
    S3_REGION       whatever Supabase shows, often us-east-1
    S3_ACCESS_KEY   from Supabase
    S3_SECRET_KEY   from Supabase
    S3_BUCKET       recordings
    RECORDING_KEEP_DAYS   180 unless you want something else

Without these four, the recording controls say recording needs the
storage keys, and everything else in the room still works.

## Streaming out

Nothing to set up here. A host adds a destination on the session page:
YouTube, LinkedIn, Instagram, Facebook or any RTMP address, with the
stream key from that service. Only the hosts of that session can see
what was entered. It needs the LiveKit keys and nothing more.

## What to check first

Open a session, press Open the room, and go in. If you see yourself,
the four settings are right. Then try a second browser signed in as
another member: the lobby, the door and the roles are the parts worth
testing with two people, and none of that is new code on the day the
keys arrive, because all of it has been running without media since it
was built.
'@
Write-File "supabase\setup\live-rooms-setup.md" $f0

git add supabase/setup/live-rooms-setup.md
git commit -m "What the live rooms need, which is keys and nothing else"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed."
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
