// The rail of spaces and the sidebar inside each one, as the prototype
// arranges them. Each entry is [href, icon, label, count?].
export type NavItem = [string, string, string, number?];
export type Space = { id: string; label: string; icon: string; items: NavItem[] };

export const MEMBER_SPACES: Space[] = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    items: [
      ["/home", "home", "Feed"],
      ["/for-you", "sparkle", "For you"],
      ["/messages", "chat", "Messages"],
      ["/notifications", "bell", "Notifications"],
      ["/directory", "users", "Directory"],
      ["/search", "search", "Search"],
    ],
  },
  {
    id: "village",
    label: "Your Village",
    icon: "pin",
    items: [
      ["/my-village", "hand", "Ask & Offer"],
      ["/my-village/members", "users", "Members"],
      ["/my-village/circles", "rings", "Circles"],
      ["/my-village/announcements", "bell", "Announcements"],
      ["/events", "cal", "Events"],
      ["/library", "book", "Resources"],
    ],
  },
  {
    id: "circle",
    label: "Your groups",
    icon: "rings",
    items: [
      ["/groups", "users", "Industry Groups"],
      ["/pods", "check", "Pods"],
      ["/network", "globe", "The network"],
    ],
  },
  {
    id: "work",
    label: "Work",
    icon: "briefcase",
    items: [
      ["/businesses", "briefcase", "Businesses"],
      ["/jobs", "tag", "Jobs and freelance"],
      ["/learning", "book", "Learning"],
      ["/markets", "globe", "Explore markets"],
    ],
  },
  {
    id: "media",
    label: "Media",
    icon: "video",
    items: [
      ["/media", "book", "Stories"],
      ["/watch", "video", "Watch and Listen"],
    ],
  },
  {
    id: "you",
    label: "You",
    icon: "user",
    items: [
      ["/me", "user", "My profile"],
      ["/me/edit", "edit", "Edit profile"],
      ["/settings", "gear", "Settings"],
      ["/membership", "star", "Membership"],
    ],
  },
];

export const ADMIN_SPACES: Space[] = [
  {
    id: "people",
    label: "People",
    icon: "users",
    items: [
      ["/admin", "grid", "Overview"],
      ["/admin/applications", "inbox", "Invitation requests"],
      ["/admin/members", "users", "Members"],
      ["/admin/circles", "rings", "Circles"],
      ["/admin/care", "heart", "Member care"],
      ["/admin/whatsapp", "chat", "WhatsApp sync"],
      ["/admin/transfers", "move", "Moves"],
      ["/admin/mix", "globe", "Village mix"],
      ["/admin/leadership", "star", "Leadership"],
    ],
  },
  {
    id: "whatson",
    label: "What is on",
    icon: "cal",
    items: [
      ["/admin/events", "cal", "Events"],
      ["/admin/live", "video", "Live rooms"],
      ["/admin/announcements", "bell", "Announcements"],
      ["/admin/partners", "star", "Partnered events"],
    ],
  },
  {
    id: "read",
    label: "What there is to read",
    icon: "book",
    items: [
      ["/admin/resources", "book", "Resources"],
      ["/admin/media", "video", "Watch and Listen"],
    ],
  },
  {
    id: "listening",
    label: "Listening",
    icon: "heart",
    items: [
      ["/admin/reports", "flag", "Reports"],
      ["/admin/suggestions", "inbox", "Suggestion box"],
      ["/admin/insight", "sliders", "Insight"],
      ["/admin/settings", "gear", "Village settings"],
    ],
  },
];

export const GLOBAL_SPACES: Space[] = [
  {
    id: "net",
    label: "Network",
    icon: "globe",
    items: [
      ["/global", "grid", "Overview"],
      ["/admin/applications", "inbox", "Invitation requests"],
      ["/global/villages", "pin", "Villages"],
      ["/global/events", "cal", "Events"],
      ["/global/cities", "plus", "City suggestions"],
      ["/admin/members", "users", "Members and roles"],
      ["/global/roles", "shield", "Permissions"],
      ["/global/plans", "card", "Plans and benefits"],
      ["/global/mix", "globe", "Nationality limits"],
      ["/global/groups", "rings", "Groups and Pods"],
      ["/global/requests", "inbox", "Requests"],
      ["/global/moderation", "flag", "Moderation"],
      ["/global/suggestions", "sparkle", "Suggestions"],
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: "edit",
    items: [
      ["/global/content", "edit", "Pages"],
      ["/global/media", "book", "Articles"],
      ["/global/photos", "image", "Photos and consent"],
      ["/global/library", "list", "Resources library"],
      ["/admin/media", "video", "Watch and Listen"],
      ["/global/emails", "mail", "Emails"],
    ],
  },
  {
    id: "money",
    label: "Money and marketplaces",
    icon: "card",
    items: [
      ["/global/money", "card", "Payments and tickets"],
      ["/global/recognition", "heart", "Team recognition"],
      ["/global/learning", "star", "Educators and courses"],
      ["/global/businesses", "briefcase", "Business listings"],
      ["/global/partners", "star", "Partnered events"],
      ["/global/markets", "globe", "Market pathways"],
    ],
  },
  {
    id: "insight",
    label: "Insight",
    icon: "sliders",
    items: [
      ["/global/reporting", "sliders", "Analytics"],
      ["/global/network", "sparkle", "Network intelligence"],
      ["/global/audit", "list", "Audit log"],
      ["/global/settings", "gear", "System settings"],
    ],
  },
];

export const LEAD_SPACES: Space[] = [
  {
    id: "lead",
    label: "Leader tools",
    icon: "rings",
    items: [
      ["/lead", "rings", "Your Circle"],
                ],
  },
];

export const EDU_SPACES: Space[] = [
  {
    id: "teach",
    label: "Educator",
    icon: "star",
    items: [
      ["/educator", "grid", "Overview"],
            ["/educator/learners", "users", "Learners"],
      ["/educator/sales", "card", "Sales"],
      ["/educator/payouts", "download", "Payouts"],
      ["/educator/profile", "user", "Educator profile"],
    ],
  },
];

export const SPACES: Record<string, Space[]> = {
  member: MEMBER_SPACES,
  admin: ADMIN_SPACES,
  global: GLOBAL_SPACES,
  lead: LEAD_SPACES,
  edu: EDU_SPACES,
};

// The bottom tabs on a phone.
export const TABS: Record<string, NavItem[]> = {
  member: [
    ["/home", "home", "Home"],
    ["/my-village", "pin", "Village"],
    ["/events", "cal", "Events"],
    ["/messages", "chat", "Messages"],
    ["/more", "menu", "More"],
  ],
  admin: [
    ["/admin", "grid", "Overview"],
    ["/admin/applications", "inbox", "Review"],
    ["/admin/members", "users", "Members"],
    ["/admin/circles", "rings", "Circles"],
    ["/admin/more", "menu", "More"],
  ],
  global: [
    ["/global", "grid", "Overview"],
    ["/admin/applications", "inbox", "Decisions"],
    ["/global/villages", "pin", "Villages"],
    ["/admin/members", "users", "Members"],
    ["/global/more", "menu", "More"],
  ],
  lead: [
    ["/lead", "rings", "What you run"],
    ["/home", "home", "Member view"],
    ["/lead/more", "menu", "More"],
  ],
  edu: [
    ["/educator", "grid", "Overview"],
    ["/educator/learners", "users", "Learners"],
    ["/educator/sales", "card", "Sales"],
    ["/educator/more", "menu", "More"],
  ],
};

// The other workspaces, for the foot of the sidebar.
export const OTHER_WORKSPACES: [string, string, string][] = [
  ["member", "home", "Member space"],
  ["lead", "rings", "Leader tools"],
  ["edu", "star", "Educator"],
  ["admin", "pin", "Local Admin"],
  ["global", "globe", "Global team"],
];

export const WORKSPACE_START: Record<string, string> = {
  member: "/home",
  lead: "/lead",
  edu: "/educator",
  admin: "/admin",
  global: "/global",
};