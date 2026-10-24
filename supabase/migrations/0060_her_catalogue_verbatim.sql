-- 0060_her_catalogue_verbatim.sql
--
-- This corrects 0059, which went out with lists I had written myself:
-- nine items for Explorer and ten for Village Member, with three lines
-- of my own added to hers and two of hers taken out.
--
-- 0059 is left where it is rather than rewritten, so a database that has
-- already run it ends up in the same place as a fresh one. This sets the
-- lists to her catalogue, exactly as her Membership Offer and Access
-- Framework of October 2026 writes them: seven items for Explorer with
-- her not included sentence, eleven for Village Member. Nothing added,
-- nothing taken out, nothing reworded.
--
-- Four of these lines describe things the build does not do yet. They
-- are on the tiles because they are her offer, and they are written down
-- as work rather than quietly dropped: Circles as a paid benefit,
-- preferential pricing on paid events, and two of her exclusions,
-- private member messaging and private village discussions, which a free
-- member here does inside their own Village every day.
--
-- Safe to run more than once.

update plans set
  badge   = 'Free',
  tagline = 'Discover your village.',
  blurb   = 'For entrepreneurs who want to discover the ExpatPreneurs ecosystem before committing to full membership.',
  features = array[
    'Basic personal profile',
    'Discover local villages and public community information',
    'Access to selected public resources',
    'Community news and announcements',
    'Can see members directory (but can’t contact them)',
    'Invitations to open events and experiences',
    'Opportunity to apply for Village Membership'
  ],
  not_included = array['Private member messaging, private village discussions, member-only opportunities, and full member resources.']
where slug = 'member';

update plans set
  badge   = 'Core paid membership',
  tagline = 'Your people. Your opportunities. Your village.',
  blurb   = 'For entrepreneurs who want to actively participate in a trusted local and international community.',
  features = array[
    'Full personal and business profiles',
    'Access to the global member directory',
    'Member discovery and connection requests',
    'Access to home-village and global community spaces',
    'Access to member-only Circles, Industry Hubs, and Growth Pods from launch, subject to relevant group participation rules',
    'Opportunities to exchange referrals and collaborate',
    'Eligibility to host workshops, training and showcases',
    'Access to selected member resources',
    'Invitations to member activities and events',
    'Preferential pricing for eligible paid events',
    'Global membership access when traveling or relocating'
  ],
  not_included = '{}'
where slug = 'paid';
