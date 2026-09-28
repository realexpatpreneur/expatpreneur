-- The photographs from the approved prototype.
--
-- The prototype is built on Unsplash photographs, referenced by id, and
-- they were never ported. Every one below is the same photograph the
-- design was signed off with.
--
-- They are placeholders, as the prototype's own first line says:
-- replace them with ExpatPreneurs photography before launch. Each is
-- stored in the database, so replacing one is an edit in the Global
-- workspace rather than a change to the code.


-- Villages
update villages set cover_url = 'https://images.unsplash.com/photo-1610809760161-efa84d5e3722?auto=format&fit=crop&w=1600&q=70' where slug = 'dubai' and cover_url is null;
update villages set cover_url = 'https://images.unsplash.com/photo-1569864971636-e9ea6f2ad857?auto=format&fit=crop&w=1600&q=70' where slug = 'lisbon' and cover_url is null;
update villages set cover_url = 'https://images.unsplash.com/photo-1499621574732-72324384dfbc?auto=format&fit=crop&w=1600&q=70' where slug = 'paris' and cover_url is null;

-- Events
update events set cover_url = 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=70' where slug = 'founders-dinner' and cover_url is null;
update events set cover_url = 'https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=900&q=70' where slug = 'circle-02-coffee-morning' and cover_url is null;
update events set cover_url = 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=70' where slug = 'pricing-across-markets' and cover_url is null;
update events set cover_url = 'https://images.unsplash.com/photo-1707084044220-e37d0daac497?auto=format&fit=crop&w=900&q=70' where slug = 'doing-business-in-portugal' and cover_url is null;
update events set cover_url = 'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=900&q=70' where slug = 'creative-design-roundtable' and cover_url is null;
update events set cover_url = 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=900&q=70' where slug = 'open-evening-for-prospective-members' and cover_url is null;
update events set cover_url = 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=70' where slug = 'accountability-pod-check-in' and cover_url is null;

-- Articles
update articles set cover_url = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=70' where slug = 'six-countries-one-lesson-local-belonging-needs-global-contin' and cover_url is null;
update articles set cover_url = 'https://images.unsplash.com/photo-1651060782121-ce629ec94201?auto=format&fit=crop&w=1400&q=70' where slug = 'opening-a-guesthouse-in-a-city-you-moved-to-for-love' and cover_url is null;
update articles set cover_url = 'https://images.unsplash.com/photo-1610809760161-efa84d5e3722?auto=format&fit=crop&w=1400&q=70' where slug = 'what-i-wish-i-knew-before-registering-a-company-in-dubai' and cover_url is null;

-- Videos and episodes
update media_items set cover_url = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=70' where slug = 'why-i-started-expatpreneurs-after-six-countries' and cover_url is null;
update media_items set cover_url = 'https://images.unsplash.com/photo-1610809760161-efa84d5e3722?auto=format&fit=crop&w=900&q=70' where slug = 'a-day-in-the-dubai-village' and cover_url is null;
update media_items set cover_url = 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=70' where slug = 'registering-a-company-in-dubai-what-to-ask-first' and cover_url is null;
update media_items set cover_url = 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=70' where slug = 'pricing-across-markets-full-session' and cover_url is null;
update media_items set cover_url = 'https://images.unsplash.com/photo-1651060782121-ce629ec94201?auto=format&fit=crop&w=900&q=70' where slug = 'in-s-on-opening-a-guesthouse-in-lisbon' and cover_url is null;
update media_items set cover_url = 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=70' where slug = 'founders-dinner-september-recap' and cover_url is null;
update media_items set cover_url = 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=70' where slug = 'hiring-your-first-person-in-another-country' and cover_url is null;
update media_items set cover_url = 'https://images.unsplash.com/photo-1707084044220-e37d0daac497?auto=format&fit=crop&w=900&q=70' where slug = 'lisbon-village-the-first-six-months' and cover_url is null;

-- Businesses
update businesses set logo_url = 'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=900&q=70' where slug = 'norte' and logo_url is null;
update businesses set logo_url = 'https://images.unsplash.com/photo-1651060782121-ce629ec94201?auto=format&fit=crop&w=900&q=70' where slug = 'casatinta' and logo_url is null;
update businesses set logo_url = 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=70' where slug = 'haddad' and logo_url is null;
update businesses set logo_url = 'https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=900&q=70' where slug = 'still' and logo_url is null;
update businesses set logo_url = 'https://images.unsplash.com/photo-1707084044220-e37d0daac497?auto=format&fit=crop&w=900&q=70' where slug = 'keystone' and logo_url is null;
update businesses set logo_url = 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=70' where slug = 'stackleaf' and logo_url is null;

-- The shows, so Watch and Listen has covers too.
update shows set cover_url = 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=70' where slug = 'expatpreneurs' and cover_url is null;
update shows set cover_url = 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=900&q=70' where cover_url is null;
