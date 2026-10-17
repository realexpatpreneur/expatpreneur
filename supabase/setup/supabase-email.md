# Sign in emails: why they run out

Somebody asks for a sign in link, gets one, and the next person to try
is told there have been too many attempts. They had made one attempt.

## What is happening

Sign in links are sent by Supabase, not by our code. Until Supabase is
given a mail provider it uses its own, which is meant for testing: a
few messages an hour for the whole project. Not a few per person, a
few in total. One person signing in can use the allowance, and
everybody else is refused until the hour turns.

This is separate from the email the platform sends itself. That is
Resend, covered in email-setup.md, and it does not touch sign in links.
Two systems, two settings, and both need doing.

## The fix, which does not need the domain

Supabase takes any SMTP provider. Several will verify a single sender
address rather than a whole domain, which means this can be done today
with a Gmail or Outlook address.

In Supabase: Project settings, Authentication, SMTP settings, and turn
on custom SMTP. You need:

    host, port, username, password
    sender address, which must be the one you verified
    sender name, for example ExpatPreneurs Global

Then Authentication, Rate limits, and raise the email limit. The
default is low because the built-in sender is a test service; with
your own provider it can be what your plan allows.

## Which provider

**Brevo** verifies a single sender address by email, so no domain is
needed, and its free tier covers far more than this site will send.
**Mailjet** and **SMTP2GO** do the same.

**Resend**, which the platform itself uses, wants a verified domain
before it will send to anybody but you. When the domain exists, move
Supabase onto Resend as well so everything comes from one place and
one set of records.

## Checking it worked

Ask for two sign in links a minute apart, from two different
addresses. Both should arrive. If the second is refused, the rate
limit is still at its old value: raise it under Authentication, Rate
limits.

## Until then

The login page has a password tab, and it always works. Set a password
for any account in Supabase, Authentication, Users, or with
set-your-password.sql beside this file.