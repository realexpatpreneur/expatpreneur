-- ExpatPreneurs Global, Phase 1 row level security
-- Run after 0001_init.sql.
--
-- The rules in one paragraph: the public sees published public things only.
-- Active members see the network. Contacting or replying outside your own
-- Village needs the paid plan. Local Admins hold their own Village.
-- The Global team holds everything. Nobody sees who sent an anonymous
-- suggestion, because that column is null in the row itself.

-- ------------------------------------------------------------- helpers

create or replace function me() returns uuid
language sql stable as $$ select auth.uid() $$;

create or replace function is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status in ('onboarding','active','quiet'))
$$;

create or replace function is_paid() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and plan = 'paid' and status in ('onboarding','active','quiet'))
$$;

create or replace function my_village() returns uuid
language sql stable security definer set search_path = public as $$
  select village_id from profiles where id = auth.uid()
$$;

create or replace function my_circle() returns uuid
language sql stable security definer set search_path = public as $$
  select circle_id from profiles where id = auth.uid()
$$;

create or replace function is_global_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from member_roles
    where profile_id = auth.uid() and role = 'global_admin' and ended_at is null
  )
$$;

create or replace function is_local_admin(v uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from member_roles
    where profile_id = auth.uid()
      and role = 'local_admin'
      and ended_at is null
      and (v is null or (scope = 'village' and scope_id = v))
  )
$$;

create or replace function is_admin(v uuid default null) returns boolean
language sql stable security definer set search_path = public as $$
  select is_global_admin() or is_local_admin(v)
$$;

-- Can I take part in this event: audience, tier and Village visiting rules.
create or replace function can_attend(e events) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when e.visibility = 'public' then true
    when not is_member() then false
    when e.tier = 'paid' and not is_paid() then false
    when e.audience = 'global' then true
    when e.audience = 'village' and e.audience_id = my_village() then true
    when e.audience = 'village' then is_paid()          -- visiting another Village
    when e.audience = 'circle' then e.audience_id = my_circle()
    else is_member()
  end
$$;

-- ------------------------------------------------------------ enable RLS

alter table villages             enable row level security;
alter table circles              enable row level security;
alter table profiles             enable row level security;
alter table member_roles         enable row level security;
alter table applications         enable row level security;
alter table city_suggestions     enable row level security;
alter table asks                 enable row level security;
alter table ask_replies          enable row level security;
alter table market_posts         enable row level security;
alter table market_replies       enable row level security;
alter table suggestions          enable row level security;
alter table events               enable row level security;
alter table event_registrations  enable row level security;
alter table event_reminders_sent enable row level security;
alter table announcements        enable row level security;
alter table resources            enable row level security;
alter table media_items          enable row level security;
alter table messages             enable row level security;
alter table connection_requests  enable row level security;
alter table reports              enable row level security;
alter table whatsapp_tasks       enable row level security;
alter table notifications        enable row level security;
alter table subscriptions        enable row level security;
alter table payments             enable row level security;
alter table audit_log            enable row level security;

-- -------------------------------------------------------------- villages

create policy villages_public_read on villages
  for select using (status in ('exploring','launching','open','paused') or is_admin());
create policy villages_admin_write on villages
  for all using (is_global_admin()) with check (is_global_admin());

create policy circles_member_read on circles
  for select using (is_member() or is_admin());
create policy circles_admin_write on circles
  for all using (is_admin(village_id)) with check (is_admin(village_id));

-- -------------------------------------------------------------- profiles

-- The public directory shows only members who allow it, and only the
-- public fields. Keep that filtering in the view layer; the row is readable.
create policy profiles_public_read on profiles
  for select using (
    (public_profile and status = 'active')
    or id = auth.uid()
    or is_member()
    or is_admin(village_id)
  );
create policy profiles_self_write on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_write on profiles
  for all using (is_admin(village_id)) with check (is_admin(village_id));

create policy roles_read on member_roles
  for select using (profile_id = auth.uid() or is_admin());
create policy roles_global_write on member_roles
  for all using (is_global_admin()) with check (is_global_admin());

-- ---------------------------------------------------------- applications

-- Anyone can request an invitation. Only admins can read or decide.
create policy applications_insert_anon on applications
  for insert with check (true);
create policy applications_admin_read on applications
  for select using (is_admin(village_id));
create policy applications_admin_write on applications
  for update using (is_admin(village_id)) with check (is_admin(village_id));

create policy city_suggestions_insert_anon on city_suggestions
  for insert with check (true);
create policy city_suggestions_admin_read on city_suggestions
  for select using (is_global_admin());
create policy city_suggestions_admin_write on city_suggestions
  for update using (is_global_admin()) with check (is_global_admin());

-- ----------------------------------------------------------- ask & offer

create policy asks_read on asks
  for select using (
    is_admin(village_id) or (is_member() and (reach = 'all_villages' or village_id = my_village()))
  );
create policy asks_insert on asks
  for insert with check (is_member() and author_id = auth.uid());
create policy asks_update_own on asks
  for update using (author_id = auth.uid() or is_admin(village_id))
  with check (author_id = auth.uid() or is_admin(village_id));

create policy ask_replies_read on ask_replies
  for select using (
    exists (select 1 from asks a where a.id = ask_id
            and (is_admin(a.village_id) or (is_member() and (a.reach = 'all_villages' or a.village_id = my_village()))))
  );
-- Replying outside your own Village is part of the paid plan.
create policy ask_replies_insert on ask_replies
  for insert with check (
    author_id = auth.uid() and is_member() and exists (
      select 1 from asks a where a.id = ask_id
        and (a.village_id = my_village() or a.village_id is null or is_paid())
    )
  );

-- ---------------------------------------------------- market exploration

-- Every member sees every post. Only the reply is gated.
create policy market_posts_read on market_posts
  for select using (is_member() or is_admin());
create policy market_posts_insert on market_posts
  for insert with check (is_member() and author_id = auth.uid());
create policy market_posts_update_own on market_posts
  for update using (author_id = auth.uid() or is_global_admin())
  with check (author_id = auth.uid() or is_global_admin());

create policy market_replies_read on market_replies
  for select using (is_member() or is_admin());
create policy market_replies_insert on market_replies
  for insert with check (
    author_id = auth.uid() and is_member() and exists (
      select 1 from market_posts p
      join profiles a on a.id = p.author_id
      where p.id = post_id and (a.village_id = my_village() or is_paid())
    )
  );

-- --------------------------------------------------------- suggestion box

-- Any member, paid or not, can send one. Nobody reads their own back,
-- because an anonymous row would be indistinguishable and a named one
-- would tempt an inbox. Admins read, admins set status.
create policy suggestions_insert on suggestions
  for insert with check (
    is_member() and ((anonymous and author_id is null) or author_id = auth.uid())
  );
create policy suggestions_admin_read on suggestions
  for select using (
    is_global_admin() or (about = 'village' and is_local_admin(village_id)) or (about = 'community' and is_local_admin())
  );
create policy suggestions_admin_update on suggestions
  for update using (is_admin(village_id)) with check (is_admin(village_id));

-- ----------------------------------------------------------------- events

create policy events_read on events
  for select using (
    (visibility = 'public' and status = 'published')
    or is_admin(village_id)
    or (is_member() and status = 'published')
  );
create policy events_admin_write on events
  for all using (is_admin(village_id) or host_id = auth.uid())
  with check (is_admin(village_id) or host_id = auth.uid());

create policy registrations_read on event_registrations
  for select using (
    profile_id = auth.uid()
    or exists (select 1 from events e where e.id = event_id and (is_admin(e.village_id) or e.host_id = auth.uid()))
    or exists (select 1 from events e where e.id = event_id and e.show_guest_list and is_member())
  );
-- A member registers for themselves, and only where they are allowed to attend.
create policy registrations_insert_member on event_registrations
  for insert with check (
    profile_id = auth.uid() and exists (select 1 from events e where e.id = event_id and can_attend(e))
  );
-- Guests from outside the platform, on public events only. Write these
-- through an edge function so the email is validated first.
create policy registrations_insert_guest on event_registrations
  for insert with check (
    profile_id is null and exists (
      select 1 from events e where e.id = event_id and e.visibility = 'public' and e.status = 'published'
    )
  );
create policy registrations_update on event_registrations
  for update using (
    profile_id = auth.uid()
    or exists (select 1 from events e where e.id = event_id and (is_admin(e.village_id) or e.host_id = auth.uid()))
  ) with check (true);

create policy reminders_admin on event_reminders_sent
  for all using (is_admin()) with check (is_admin());

-- -------------------------------------------------------------- community

create policy announcements_read on announcements
  for select using (is_member() or is_admin(village_id));
create policy announcements_write on announcements
  for all using (is_admin(village_id)) with check (is_admin(village_id));

create policy resources_read on resources
  for select using (is_member() and (all_villages or village_id = my_village() or is_paid()) or is_admin(village_id));
create policy resources_write on resources
  for all using (is_admin(village_id)) with check (is_admin(village_id));

create policy media_read on media_items
  for select using ((published_at is not null and not member_only) or is_member() or is_admin());
create policy media_write on media_items
  for all using (is_global_admin()) with check (is_global_admin());

-- Messages: same Village freely, other Villages once connected and paid.
create policy messages_read on messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy messages_insert on messages
  for insert with check (
    sender_id = auth.uid() and is_member() and (
      exists (select 1 from profiles r where r.id = recipient_id and r.village_id = my_village())
      or (is_paid() and exists (
        select 1 from connection_requests c
        where c.status = 'accepted'
          and ((c.requester_id = auth.uid() and c.recipient_id = messages.recipient_id)
            or (c.recipient_id = auth.uid() and c.requester_id = messages.recipient_id))))
    )
  );

create policy connections_read on connection_requests
  for select using (requester_id = auth.uid() or recipient_id = auth.uid() or is_admin());
create policy connections_insert on connection_requests
  for insert with check (requester_id = auth.uid() and is_paid());
create policy connections_update on connection_requests
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy reports_insert on reports
  for insert with check (reporter_id = auth.uid() and is_member());
create policy reports_read on reports
  for select using (is_admin() or reporter_id = auth.uid());
create policy reports_update on reports
  for update using (is_admin()) with check (is_admin());

create policy whatsapp_admin on whatsapp_tasks
  for all using (is_admin(village_id)) with check (is_admin(village_id));

create policy notifications_own on notifications
  for select using (profile_id = auth.uid());
create policy notifications_own_update on notifications
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ------------------------------------------------------------------ money

-- Rows are written by the Stripe webhook with the service role, which
-- bypasses RLS. Members read their own; Global reads all.
create policy subscriptions_own on subscriptions
  for select using (profile_id = auth.uid() or is_global_admin());
create policy payments_own on payments
  for select using (profile_id = auth.uid() or is_global_admin());

create policy audit_read on audit_log
  for select using (is_global_admin());
