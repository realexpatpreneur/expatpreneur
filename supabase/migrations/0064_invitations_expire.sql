-- 0064_invitations_expire.sql
--
-- An acceptance now has a shelf life. Fourteen days from the day the
-- invitation goes out, and after that the applicant asks for a fresh
-- link rather than filling the form in again.
--
-- Two things to keep apart. This window is ours: how long the offer of a
-- place stands. The sign in link inside the email has its own, shorter
-- life set by Supabase, which is exactly why asking for another one has
-- to be possible without another expression of interest.
--
-- Safe to run more than once.

alter table applications add column if not exists invited_at        timestamptz;
alter table applications add column if not exists invite_expires_at timestamptz;
alter table applications add column if not exists invites_sent      int not null default 0;

comment on column applications.invite_expires_at is
  'When the offer of a place lapses. Fourteen days from the last invitation.';
comment on column applications.invites_sent is
  'How many links have gone out, so a resend loop is visible rather than silent.';

-- Where an approved request stands, for the person who made it. Both the
-- address and the reference, as everywhere else, so knowing an email
-- address tells nobody anything.
create or replace function invitation_state_for(the_email text, the_reference text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when a.status <> 'approved'            then 'not approved'
    when a.profile_id is not null
     and exists (select 1 from profiles p
                 where p.id = a.profile_id and p.status <> 'invited')
                                           then 'joined'
    when a.invite_expires_at is null       then 'live'
    when a.invite_expires_at > now()       then 'live'
    else 'expired'
  end
  from applications a
  where a.email = the_email::citext
    and a.reference = upper(the_reference)
  limit 1
$$;

grant execute on function invitation_state_for(text, text) to anon, authenticated;

-- Anything approved before today gets a window from now, so nobody is
-- expired by a migration they never saw.
update applications
set invited_at        = coalesce(invited_at, decided_at, now()),
    invite_expires_at = coalesce(invite_expires_at, now() + interval '14 days'),
    invites_sent      = greatest(invites_sent, 1)
where status = 'approved'
  and (invited_at is null or invite_expires_at is null);
