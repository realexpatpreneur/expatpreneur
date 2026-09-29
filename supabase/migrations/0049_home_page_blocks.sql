-- The home page, written out as blocks.
--
-- Every section below is the prototype's home page, in its order and
-- with its own words: the hero and the proverb, the three layers, the
-- Industry Groups and Pods strip, the four cards, the Villages, the
-- founder story, the businesses, and the closing band.
--
-- It is saved as a draft. The coded home page keeps rendering until
-- somebody presses Publish in Global team, Content, Pages, so you can
-- compare the two and only switch when they match.

update pages
set blocks = '[
 {
  "type": "hero",
  "heading": "Your business needs a village too.",
  "text": "A curated network of expat entrepreneurs. Belong to a small, trusted community in your city, and reach people you can trust in other markets.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Find your Village",
  "second_href": "/villages",
  "art": "preview",
  "quote": "\"It takes a village to raise a child.\" We believe the same is true of the businesses we build far from home."
 },
 {
  "type": "layers",
  "heading": "Big enough to open doors. Small enough to know each other.",
  "text": "Every member belongs to three places at once. As the network grows, your home base stays human sized.",
  "items": "Global | The whole network. Reach members, events and markets wherever there is a Village.\nVillage | Your city. Local gatherings, local knowledge and the people building around you.\nCircle | Your home base of up to 50 members, where real relationships form."
 },
 {
  "type": "panel",
  "tone": "mint",
  "body": "**Across all three:** Industry Groups connect you with people in your field, and Pods bring a few members together around a shared goal.",
  "button_label": "How it works",
  "button_href": "/how-it-works"
 },
 {
  "type": "features",
  "heading": "What members do here",
  "columns": "4",
  "items": "Ask and offer help | Post what you need or what you can give, and track it until it is resolved.\nFind the right people | Search by skill, language and the markets people know.\nMeet in person | Monthly gatherings in your Village, and events in other cities.\nExplore new markets | Talk to members who already build where you want to go."
 },
 {
  "type": "villages",
  "heading": "Villages",
  "more_href": "/villages"
 },
 {
  "type": "story",
  "heading": "Six countries, one lesson: local belonging needs global continuity.",
  "body": "Kristiane Charrier on rebuilding her network at every move, and why the first ExpatPreneurs community in Luanda shaped everything that followed.",
  "button_href": "/media/six-countries-one-lesson-local-belonging-needs-global-continuity"
 },
 {
  "type": "businesses",
  "heading": "Businesses in the network",
  "limit": "3",
  "more_href": "/businesses"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Ready to find your Village?",
  "text": "ExpatPreneurs is by invitation. Membership itself is free; the paid plan adds every Village, at 50 EUR a month or 500 EUR a year.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Come to an open evening",
  "second_href": "/events"
 }
]'::jsonb,
    title = 'Home',
    path = '/',
    updated_at = now()
where slug = 'home';

insert into pages (slug, title, path, status, blocks)
select 'home', 'Home', '/', 'draft', '[
 {
  "type": "hero",
  "heading": "Your business needs a village too.",
  "text": "A curated network of expat entrepreneurs. Belong to a small, trusted community in your city, and reach people you can trust in other markets.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Find your Village",
  "second_href": "/villages",
  "art": "preview",
  "quote": "\"It takes a village to raise a child.\" We believe the same is true of the businesses we build far from home."
 },
 {
  "type": "layers",
  "heading": "Big enough to open doors. Small enough to know each other.",
  "text": "Every member belongs to three places at once. As the network grows, your home base stays human sized.",
  "items": "Global | The whole network. Reach members, events and markets wherever there is a Village.\nVillage | Your city. Local gatherings, local knowledge and the people building around you.\nCircle | Your home base of up to 50 members, where real relationships form."
 },
 {
  "type": "panel",
  "tone": "mint",
  "body": "**Across all three:** Industry Groups connect you with people in your field, and Pods bring a few members together around a shared goal.",
  "button_label": "How it works",
  "button_href": "/how-it-works"
 },
 {
  "type": "features",
  "heading": "What members do here",
  "columns": "4",
  "items": "Ask and offer help | Post what you need or what you can give, and track it until it is resolved.\nFind the right people | Search by skill, language and the markets people know.\nMeet in person | Monthly gatherings in your Village, and events in other cities.\nExplore new markets | Talk to members who already build where you want to go."
 },
 {
  "type": "villages",
  "heading": "Villages",
  "more_href": "/villages"
 },
 {
  "type": "story",
  "heading": "Six countries, one lesson: local belonging needs global continuity.",
  "body": "Kristiane Charrier on rebuilding her network at every move, and why the first ExpatPreneurs community in Luanda shaped everything that followed.",
  "button_href": "/media/six-countries-one-lesson-local-belonging-needs-global-continuity"
 },
 {
  "type": "businesses",
  "heading": "Businesses in the network",
  "limit": "3",
  "more_href": "/businesses"
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Ready to find your Village?",
  "text": "ExpatPreneurs is by invitation. Membership itself is free; the paid plan adds every Village, at 50 EUR a month or 500 EUR a year.",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "Come to an open evening",
  "second_href": "/events"
 }
]'::jsonb
where not exists (select 1 from pages where slug = 'home');