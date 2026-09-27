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