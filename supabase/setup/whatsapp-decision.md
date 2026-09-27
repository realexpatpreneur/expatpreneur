# WhatsApp: the decision to make

WhatsApp does not let any platform add somebody to a group. Not ours,
not anybody's. That is a rule of WhatsApp, not a gap in the build, and
anything claiming otherwise is either an unofficial tool that gets phone
numbers banned or the Business API, which is a different thing.

So there are two honest options.

## What is built today: by hand, with the list kept for you

A Local Admin opens WhatsApp sync and sees every person waiting to be
added, moved or removed, with the number, a button that opens a chat
with them, and a button that opens the group. They add the person, come
back and tick it off.

The member is not left in silence while this happens. They are told by
email which Circle they are in and that the group takes a day or so, so
the delay is expected rather than alarming.

The page now also says what is going wrong when something is: anybody
waiting more than three days, and anybody with no phone number on file,
who cannot be added at all until they give one.

What this costs: a few minutes per new member, done by whoever runs the
Village. At 73 members joining over a few weeks, that is an evening's
work spread thin. At 500 members across five Villages it is a real job.

## The other option: the WhatsApp Business API

This is a Meta product. It would let the platform send messages to
people directly, and it is how a business sends you a delivery update.

What it would actually give you:

- Sending the re-enrolment links, the Circle placement and the event
  reminders as WhatsApp messages rather than emails. This is the real
  prize, because your members live in WhatsApp and many will never open
  an email.
- Nothing for groups. Even with the Business API, adding somebody to an
  ordinary group is not possible. Meta's answer is Communities and
  Channels, which are broadcast, not the conversation your Circles have.

What it costs: a Meta Business account with a verified business, a
provider such as Twilio or 360dialog, a phone number that becomes the
community's number, message templates approved by Meta before you may
send them, and a per-message fee. Weeks of setup, not hours, and most
of it is paperwork rather than code.

## What I would suggest

Stay by hand for launch. The manual path works, it is built, and with
73 people it is manageable. Revisit the Business API when the second
Village opens, and when you do, do it for messages rather than for
groups, because groups will still be by hand either way.

If you decide you want it, tell me and I will scope it properly. It is
a few days of work on our side once the Meta side exists, and almost
none of it can start before then.