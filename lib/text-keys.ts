// Which pieces of wording each page has, and what the code says today.
//
// The editor reads this so it can list every editable line with its
// current wording, before anybody has changed anything. A page and this
// list have to agree: if you add a key to a page, add it here, or the
// Global team will never see it.

export type TextKey = { key: string; label: string; fallback: string; long?: boolean };
export type TextPage = { page: string; name: string; path: string; keys: TextKey[] };

export const TEXT_PAGES: TextPage[] = [
  {
    page: "villages",
    name: "Villages",
    path: "/villages",
    keys: [
      { key: "title", label: "Heading", fallback: "Find your Village" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Each Village is a local community of expat entrepreneurs in one city, connected to every other Village in the network.",
      },
      { key: "none.title", label: "No Village panel, heading", fallback: "No Village in your city yet?" },
      {
        key: "none.body",
        label: "No Village panel, text",
        long: true,
        fallback:
          "Tell us where you are. New Villages open when there are enough members and trusted people ready to host them.",
      },
      { key: "none.button", label: "No Village panel, button", fallback: "Suggest your city" },
    ],
  },
  {
    page: "events",
    name: "Events",
    path: "/events",
    keys: [
      { key: "title", label: "Heading", fallback: "Events" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Gatherings in every Village and online. Some are open to everyone; most are for members.",
      },
      { key: "empty", label: "When there are no events", fallback: "No events published yet." },
    ],
  },
  {
    page: "businesses",
    name: "Businesses",
    path: "/businesses",
    keys: [
      { key: "title", label: "Heading", fallback: "Businesses in the network" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Services and offers from members in every Village. Contact them directly.",
      },
      { key: "band.title", label: "Closing band, heading", fallback: "Run a business abroad?" },
      {
        key: "band.body",
        label: "Closing band, text",
        fallback: "Members can list their business here once approved.",
      },
    ],
  },
  {
    page: "learning",
    name: "Learning",
    path: "/learning",
    keys: [
      { key: "title", label: "Heading", fallback: "Learning" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback: "Short, practical and actionable workshops from founders in the network.",
      },
      { key: "teach.title", label: "Teaching panel, heading", fallback: "Teach in the network" },
      {
        key: "teach.body",
        label: "Teaching panel, text",
        long: true,
        fallback:
          "Paid members can apply to become educators and earn from their workshops.",
      },
    ],
  },
  {
    page: "media",
    name: "Media",
    path: "/media",
    keys: [
      { key: "title", label: "Heading", fallback: "Media" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback: "Stories and knowledge from the people building across the network.",
      },
      { key: "news.title", label: "Newsletter panel, heading", fallback: "The monthly newsletter" },
      {
        key: "news.body",
        label: "Newsletter panel, text",
        fallback: "New stories, guides and events from every Village.",
      },
    ],
  },
  {
    page: "watch",
    name: "Watch and Listen",
    path: "/watch",
    keys: [
      { key: "title", label: "Heading", fallback: "Watch and Listen" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Videos and podcast episodes chosen by the ExpatPreneurs Media team, from our own channel and from members building across the network.",
      },
    ],
  },
  {
    page: "members",
    name: "Members",
    path: "/members",
    keys: [
      { key: "title", label: "Heading", fallback: "Meet the members" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Founders who chose to be listed publicly. Members see more, and can connect.",
      },
      { key: "band.title", label: "Closing band, heading", fallback: "Want to connect?" },
      { key: "band.body", label: "Closing band, text", fallback: "Members can message and meet each other." },
    ],
  },
  {
    page: "contact",
    name: "Contact",
    path: "/contact",
    keys: [
      { key: "title", label: "Heading", fallback: "Contact us" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "Questions about membership or a Village? We usually reply within two working days.",
      },
      { key: "partnerships.title", label: "Partnerships tab, heading", fallback: "Partner with ExpatPreneurs" },
      {
        key: "partnerships.intro",
        label: "Partnerships tab, introduction",
        long: true,
        fallback:
          "Sponsors, venues and organisations who want to support expat founders. Partnerships are agreed with the Global team.",
      },
      { key: "press.title", label: "Press tab, heading", fallback: "Press and media" },
      {
        key: "press.intro",
        label: "Press tab, introduction",
        fallback: "Interviews, stories and speaking requests.",
      },
    ],
  },
  {
    page: "village",
    name: "A Village page",
    path: "/villages/dubai",
    keys: [
      {
        key: "lede",
        label: "Heading above the summary",
        fallback: "Build in {city} without starting from zero.",
      },
      { key: "events.title", label: "Events section heading", fallback: "Upcoming events" },
      { key: "admins.title", label: "Local Admins panel heading", fallback: "Your Local Admins" },
      { key: "joining.title", label: "Joining panel heading", fallback: "Joining {village}" },
      {
        key: "joining.body",
        label: "Joining panel text",
        long: true,
        fallback:
          "ExpatPreneurs is by invitation. Every request is read personally, and accepted members are welcomed into a Circle.",
      },
    ],
  },
  {
    page: "discover",
    name: "Discover",
    path: "/discover",
    keys: [
      { key: "title", label: "Heading", fallback: "Wherever you have landed, there is a Village for you" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback: "Find the Villages, Circles and people building a business away from home.",
      },
      {
        key: "search",
        label: "Search box wording",
        fallback: "Search Villages, Circles, members, events and businesses",
      },
    ],
  },
  {
    page: "apply",
    name: "Request an invitation",
    path: "/apply",
    keys: [
      { key: "title", label: "Heading", fallback: "Request your invitation" },
      {
        key: "intro",
        label: "Introduction",
        long: true,
        fallback:
          "ExpatPreneurs is by invitation only. Every person starting a business in a country that is not their original country is an ExpatPreneur, at any stage: idea, scaling or expansion. It takes about ten minutes.",
      },
    ],
  },
];

export const textPage = (page: string) => TEXT_PAGES.find((p) => p.page === page);