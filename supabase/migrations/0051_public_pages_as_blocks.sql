-- The last ten public pages, as blocks.
--
-- Discover, Villages, Events, Businesses, Learning, Media, Watch and
-- Listen, Members, Contact and the invitation form. Each is its own
-- page in the prototype, written out as the blocks that make it.
--
-- All drafts, so nothing on the site changes until each is published.
-- A page with filters, tabs or a form keeps the coded version until
-- then, and the form blocks point at the real form rather than
-- pretending to be one.


insert into pages (slug, title, path, status, blocks)
values ('discover', 'Discover', '/discover', 'draft', '[
 {
  "type": "hero",
  "layout": "center",
  "heading": "Wherever you have landed, there is a Village for you",
  "text": "Find the Villages, Circles and people building a business away from home.",
  "art": ""
 },
 {
  "type": "villages",
  "heading": "Villages",
  "more_href": "/villages"
 },
 {
  "type": "people",
  "heading": "Members you will meet",
  "limit": "6",
  "more_href": "/members"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "ExpatPreneurs grows through introductions.",
  "text": "Know someone who belongs here?",
  "button_label": "Request your invitation",
  "button_href": "/apply"
 },
 {
  "type": "events",
  "heading": "Events",
  "limit": "4",
  "more_href": "/events"
 },
 {
  "type": "courses",
  "heading": "Learning",
  "limit": "4",
  "more_href": "/learning"
 },
 {
  "type": "businesses",
  "heading": "Businesses in the network",
  "limit": "4",
  "more_href": "/businesses"
 },
 {
  "type": "videos",
  "heading": "Watch and listen",
  "limit": "4",
  "more_href": "/watch"
 },
 {
  "type": "band",
  "tone": "navy",
  "heading": "Lisbon and Paris open next month.",
  "text": "Madrid is being explored.",
  "button_label": "Request your invitation",
  "button_href": "/apply"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('villages', 'Villages', '/villages', 'draft', '[
 {
  "type": "heading",
  "heading": "Find your Village",
  "text": "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network."
 },
 {
  "type": "villages"
 },
 {
  "type": "panel",
  "tone": "wash",
  "heading": "No Village in your city yet?",
  "body": "Tell us where you are. New Villages open when there are enough members and trusted people ready to host them.",
  "button_label": "Suggest your city",
  "button_href": "/villages/suggest"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('events', 'Events', '/events', 'draft', '[
 {
  "type": "heading",
  "heading": "Events",
  "text": "Gatherings in every Village and online. Some are open to everyone; most are for members."
 },
 {
  "type": "events",
  "limit": "20"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('businesses', 'Businesses', '/businesses', 'draft', '[
 {
  "type": "heading",
  "heading": "Businesses in the network",
  "text": "Services and offers from members in every Village. Contact them directly."
 },
 {
  "type": "businesses",
  "limit": "24"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Run a business abroad?",
  "text": "Members can list their business here once approved.",
  "button_label": "Request your invitation",
  "button_href": "/apply"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('learning', 'Learning', '/learning', 'draft', '[
 {
  "type": "heading",
  "heading": "Learning",
  "text": "Short, practical and actionable workshops from founders in the network."
 },
 {
  "type": "courses",
  "limit": "24"
 },
 {
  "type": "panel",
  "tone": "wash",
  "heading": "Teach in the network",
  "body": "Paid members can apply to become educators and earn from their workshops.",
  "button_label": "See membership",
  "button_href": "/membership"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('media', 'Media', '/media', 'draft', '[
 {
  "type": "heading",
  "heading": "Media",
  "text": "Stories and knowledge from the people building across the network."
 },
 {
  "type": "articles",
  "limit": "12"
 },
 {
  "type": "panel",
  "tone": "wash",
  "heading": "The monthly newsletter",
  "body": "New stories, guides and events from every Village.",
  "button_label": "Watch and Listen",
  "button_href": "/watch"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('watch', 'Watch and Listen', '/watch', 'draft', '[
 {
  "type": "heading",
  "heading": "Watch and Listen",
  "text": "Videos and podcast episodes chosen by the ExpatPreneurs Media team, from our own channel and from members building across the network."
 },
 {
  "type": "videos",
  "heading": "Videos",
  "kind": "video",
  "limit": "8",
  "more_href": "/watch"
 },
 {
  "type": "shows",
  "heading": "The shows"
 },
 {
  "type": "videos",
  "heading": "Latest episodes",
  "kind": "episode",
  "limit": "6"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('members', 'Members', '/members', 'draft', '[
 {
  "type": "heading",
  "heading": "Meet the members",
  "text": "Founders who chose to be listed publicly. Members see more, and can connect."
 },
 {
  "type": "people",
  "limit": "24"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Want to connect?",
  "text": "Members can message and meet each other.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Log in",
  "second_href": "/login"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('contact', 'Contact', '/contact', 'draft', '[
 {
  "type": "heading",
  "heading": "Contact us",
  "text": "Questions about membership or a Village? We usually reply within two working days."
 },
 {
  "type": "form",
  "which": "contact",
  "heading": "Send us a message"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();

insert into pages (slug, title, path, status, blocks)
values ('apply', 'Request an invitation', '/apply', 'draft', '[
 {
  "type": "heading",
  "heading": "Request your invitation",
  "text": "ExpatPreneurs is by invitation only. Every person starting a business in a country that is not their original country is an ExpatPreneur, at any stage: idea, scaling or expansion. It takes about ten minutes."
 },
 {
  "type": "steps",
  "heading": "What happens next",
  "items": "Review | Your request is read personally.\\nA conversation | We may ask a few questions or invite you to an open evening.\\nWelcome | Once accepted, you complete your profile and join a Circle and its WhatsApp group."
 },
 {
  "type": "form",
  "which": "apply",
  "heading": "The form itself"
 }
]'::jsonb)
on conflict (slug) do update
  set title = excluded.title,
      path = excluded.path,
      blocks = excluded.blocks,
      updated_at = now();