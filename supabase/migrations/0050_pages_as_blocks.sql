-- How it works, Membership and the three legal pages, as blocks.
--
-- Each one is the prototype's page, section by section and in its own
-- words: the nested layers and the six step path on How it works, the
-- two plans and the nine questions on Membership, and every heading
-- and paragraph of Privacy, Terms and Cookies.
--
-- All saved as drafts. The coded pages keep rendering until each is
-- published from Global team, Content, Pages.


update pages set blocks = '[
 {
  "type": "heading",
  "heading": "How ExpatPreneurs works",
  "text": "Local community gives you belonging. The global network gives you continuity, reach and access. You get both."
 },
 {
  "type": "layers",
  "items": "Global | The whole network. Reach members, events and markets wherever there is a Village.\nVillage | Your city. Local gatherings, local knowledge and the people building around you.\nCircle | Your home base of up to 50 members, where real relationships form."
 },
 {
  "type": "features",
  "columns": "2",
  "items": "Industry Groups | Stable groups by profession, such as Creative & Design or Hospitality. They connect you with people in your field across Circles and, over time, across Villages.\nPods | Small groups of about six members working toward a shared goal, such as accountability or entering a new market. Pods have a lead, a rhythm and an end date."
 },
 {
  "type": "features",
  "heading": "Where things happen",
  "columns": "3",
  "items": "Daily conversation on WhatsApp | Each Circle, Industry Group and Pod has its own private WhatsApp group.\nEverything else on the platform | Your profile, the Directory, Ask & Offer, events, businesses and learning.\nIn person every month | Each Village holds at least one meaningful gathering a month."
 },
 {
  "type": "steps",
  "heading": "From invitation to your Circle",
  "items": "Request an invitation | Tell us about you, your business and your expat journey.\nReview | Every request is read personally.\nWelcome | Once accepted, complete your profile and choose what the public can see.\nJoin your Circle | You are placed in a Circle and added to its WhatsApp group.\nTake part | Ask, offer, meet and explore other Villages.\nMove with you | If you change city, your profile and history come with you."
 },
 {
  "type": "band",
  "tone": "blue",
  "heading": "Ready to find your Village?",
  "button_label": "Request your invitation",
  "button_href": "/apply",
  "second_label": "See membership",
  "second_href": "/membership"
 }
]'::jsonb, updated_at = now()
where slug = 'how';

update pages set blocks = '[
 {
  "type": "heading",
  "heading": "Membership",
  "text": "ExpatPreneurs is for anyone building a business in a country that is not their country of origin, at any stage: an idea, a growing business or an expansion. Membership is by invitation, for people who want to contribute as well as receive."
 },
 {
  "type": "plans"
 },
 {
  "type": "text",
  "width": "narrow",
  "body": "Membership is by invitation. Once your request is accepted you can upgrade to the paid plan at any time."
 },
 {
  "type": "faq",
  "heading": "Questions",
  "items": "Why is membership by invitation? | So every Village stays trusted and useful. Every request is read personally.\nDoes membership cost anything? | Membership in your own Village comes with your invitation and costs nothing. One paid plan, Paid member, adds every Village at 50 EUR a month or 500 EUR a year.\nI am already in the Dubai WhatsApp group. Do I pay? | No. Re-enrol on the platform and your place stays, with a founding member badge. The paid plan is optional, for reaching every Village.\nWho can request an invitation? | Anyone building a business in a country that is not their country of origin, from the idea stage to expansion.\nWhy do you ask about my nationalities and the countries I have lived in? | They make up your expat journey on your profile, so members can find people who know a market or speak a language.\nIs ExpatPreneurs a place to sell? | Members share their work in the right places, but relationships come first. Mass pitching is not allowed.\nWhat if I move to another city? | Your profile and history stay with you. You can ask to transfer to the Village in your new city.\nIs this a dating space? | No. It is a professional community built on warm, respectful connection.\nCan I change membership later? | Yes. You can upgrade or cancel from your settings at any time."
 },
 {
  "type": "panel",
  "tone": "wash",
  "heading": "What we expect from members",
  "body": "- Human before transaction\n- Collaboration over competition\n- Contribute as well as receive\n- Respect professional boundaries\n- Help keep the Village international",
  "button_label": "Read our terms",
  "button_href": "/legal/terms"
 }
]'::jsonb, updated_at = now()
where slug = 'membership';

update pages set blocks = '[
 {
  "type": "heading",
  "heading": "Terms of membership",
  "text": "Draft structure. Final text to be written by legal counsel."
 },
 {
  "type": "text",
  "width": "narrow",
  "body": "## Membership\nMembership is by invitation and personal. It cannot be transferred.\n## Conduct\nMembers follow the community values. Harassment, discrimination and aggressive selling are not allowed.\n## Paid membership\nThe paid plan is 50 EUR a month or 500 EUR a year. It renews until you cancel, and you can cancel at any time from your settings.\n## Event tickets\nSome events have a small ticket to confirm your seat. The refund policy is shown when you book.\n## Marketplaces\nBusiness contact happens directly between members and customers."
 }
]'::jsonb, updated_at = now()
where slug = 'terms';

update pages set blocks = '[
 {
  "type": "heading",
  "heading": "Privacy policy",
  "text": "Draft structure. Final text to be written by legal counsel."
 },
 {
  "type": "text",
  "width": "narrow",
  "body": "## What we collect\nYour account, profile, invitation request and membership details, and how you use the platform.\n## Your public profile\nYour business, offers, expat journey, nationalities and languages are public if you agree when you join. What you are looking for stays visible to members only.\n## Contact details\nYour email and phone number are never public.\n## Your rights\nYou can export or delete your data from your settings."
 }
]'::jsonb, updated_at = now()
where slug = 'privacy';

update pages set blocks = '[
 {
  "type": "heading",
  "heading": "Cookie policy",
  "text": "Draft structure. Final text to be written by legal counsel."
 },
 {
  "type": "text",
  "width": "narrow",
  "body": "## Essential cookies\nKeep you logged in and the platform secure.\n## Analytics\nHelp us understand what is useful. You can switch these off."
 }
]'::jsonb, updated_at = now()
where slug = 'cookies';