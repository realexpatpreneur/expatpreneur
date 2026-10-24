-- 0059_her_membership_tiles.sql
--
-- The membership tiles carried the original build's copy. Only the two
-- names were hers. This puts her Membership Offer and Access Framework
-- of October 2026 on them: the badge, the tagline, the description and
-- the list of what each tier includes.
--
-- Her section 2 lists everything a tier includes. The card used to list
-- the free tier and then what paying adds on top, which is why her lists
-- could not simply be dropped in. The card now counts the way she does,
-- and these columns are what it reads.
--
-- Where her wording describes something the build does not do yet, the
-- line is left out rather than printed. Those are listed in the commit
-- message and none of them are silent.
--
-- Safe to run more than once.

alter table plans add column if not exists badge        text;
alter table plans add column if not exists tagline      text;
alter table plans add column if not exists not_included text[] not null default '{}';

update plans set
  badge   = 'Free',
  tagline = 'Discover your village.',
  blurb   = 'For entrepreneurs who want to discover the ExpatPreneurs ecosystem before committing to full membership.',
  features = array[
    'Personal and business profile',
    'Your Village, your Circle and its WhatsApp group',
    'Discover local villages and public community information',
    'Community news and announcements',
    'Can see the member directory, without contacting members',
    'Ask and Offer in your own Village',
    'Messaging members in your own Village',
    'Invitations to open events and experiences',
    'Access to selected public resources'
  ],
  not_included = array[
    'Contacting members in other Villages',
    'Events in other Villages',
    'Industry Hubs and Growth Pods',
    'Resources from every Village'
  ]
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
    'Member-only Industry Hubs and Growth Pods, subject to group rules',
    'Opportunities to exchange referrals and collaborate',
    'Eligibility to host workshops, training and showcases',
    'Access to selected member resources',
    'Invitations to member activities and events',
    'Global membership access when traveling or relocating'
  ],
  not_included = '{}'
where slug = 'paid';

grant select on plans to anon;
