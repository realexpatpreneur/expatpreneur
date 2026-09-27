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