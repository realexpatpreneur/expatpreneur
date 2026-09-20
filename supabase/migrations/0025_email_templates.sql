-- ExpatPreneurs Global: the transactional emails, edited in the platform
-- The prototype lists eight templates, each with a subject, a body and a
-- button, written with placeholders filled in at sending time. Until now
-- every one of these was written in code, so rewording one meant a deploy.
-- Run after 0024_settings_to_prototype.sql.

create table email_templates (
  key          text primary key,
  name         text not null,
  sent_when    text not null,
  subject      text not null,
  body         text not null,
  button_label text,
  button_path  text,
  active       boolean not null default true,
  position     int not null default 1,
  updated_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger email_templates_updated before update on email_templates
  for each row execute function set_updated_at();

alter table email_templates enable row level security;

create policy email_templates_read on email_templates
  for select using (is_global_admin());
create policy email_templates_write on email_templates
  for all using (is_global_admin()) with check (is_global_admin());

-- The eight the prototype names, with the wording the platform sends
-- today, so nothing changes until somebody edits one.
insert into email_templates (key, name, sent_when, subject, body, button_label, button_path, position) values
('received', 'Application received', 'Someone applies',
 'We have your request',
 'Your request to join ExpatPreneurs is with us, {first_name}.

Someone reads every one, so it takes a few days rather than a few minutes. You will hear either way.

Your reference is {reference}. Keep it: with your email address it shows you where your request stands.

If your city does not have a Village yet, we will tell you when it opens.',
 'Check where it stands', '/apply/status', 1),

('approved', 'Application approved', 'Global approves',
 'Welcome to the {village} Village',
 'Welcome, {first_name}. Your request to join the {village} Village has been approved.

{local_admins} are looking forward to meeting you. Use the link below to sign in and finish your profile.',
 'Activate your membership', '/welcome', 2),

('declined', 'Application not approved', 'Global declines',
 'About your request to join',
 '{first_name}, thank you for asking to join ExpatPreneurs.

We are not able to offer you a place at the moment. This is not a judgement of you or your business; a Village is small on purpose and the balance of it matters.

You are welcome to ask again later.',
 null, null, 3),

('waitlisted', 'Application waitlisted', 'Global waitlists',
 'You are on the waiting list',
 '{first_name}, your request is on the waiting list for the {village} Village.

That is not a no. The Village is full or still forming, and you will hear as soon as a place comes up.',
 'Check where it stands', '/apply/status', 4),

('circle', 'Welcome to your Circle', 'A member is placed',
 'You are in {circle}',
 '{first_name}, you have been placed in {circle}, in the {village} Village.

Your Circle is the people you will actually get to know. {local_admins} will add you to the WhatsApp group.',
 'Open your Village', '/my-village', 5),

('event_registration', 'Event registration', 'A member registers',
 'You are registered: {event}',
 '{first_name}, your place at {event} is confirmed.

The full address and anything else you need appear on the event page nearer the time.',
 'Open the event', '/events', 6),

('event_reminder', 'Event reminder', 'The day before',
 'Tomorrow: {event}',
 '{first_name}, a reminder about {event}.

If you can no longer make it, cancel your place so somebody else can take it.',
 'Open the event', '/events', 7),

('receipt', 'Receipt', 'A payment succeeds',
 'Your receipt from ExpatPreneurs',
 '{first_name}, thank you. This confirms your payment.

Every receipt is kept in your settings, and invoices with your business details come from Stripe.',
 'See your receipts', '/settings/receipts', 8)
on conflict (key) do nothing;