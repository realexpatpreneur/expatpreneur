import { Ic } from "@/components/icon";

// whyJoin(), the panel the prototype puts above step one of the
// invitation request. The copy is the prototype's, word for word. The
// Villages are the only part that is not: those come from the database,
// so the page cannot promise a city that has closed or miss one that
// has opened.
const BENEFITS: [string, string, string[]][] = [
  ["users", "Real Connections", [
    "Monthly in-person meetups in your Village with entrepreneurs from other nationalities",
    "Daily WhatsApp community in your Circle for quick questions and support",
    "Structured networking that goes beyond business card exchanges",
    "Genuine friendships and long-term partnerships",
  ]],
  ["book", "Knowledge and Growth", [
    "Monthly workshops on legal setup, marketing, scaling, and more",
    "Learn from entrepreneurs who have actually done it, not just taught it",
    "Access to expert-curated resources and guides",
    "Member-to-member knowledge sharing and mentorship",
  ]],
  ["hand", "Collaboration Opportunities", [
    "Monthly collaboration circles for brainstorming and problem-solving",
    "Direct access to potential partners, collaborators, and co-founders",
    "Member-to-member skill swaps and service exchanges",
    "Early access to business opportunities shared within the community",
  ]],
  ["search", "Member Directory and Resources", [
    "Searchable directory across every Village to find exactly who you need",
    "City-specific guides for each Village, covering business setup, banking, visas and legal",
    "Templates, tools, and resources from the community",
    "Workshop recordings and an evergreen content library",
  ]],
  ["star", "Founding Member Perks", [
    "Founding members are the first members of each Village",
    "Membership in your Village at no cost",
    "Shape the community culture from day one",
    "Priority access to all events and opportunities",
    "Founding member recognition and badge",
  ]],
];

export function WhyJoin({
  villages,
}: {
  villages: { name: string; status: string }[];
}) {
  const said: Record<string, string> = {
    open: "open now",
    launching: "opening next month",
    exploring: "being explored",
  };
  const ours = villages.map((v) => `${v.name}: ${said[v.status] ?? v.status}`);
  ours.push(
    "Monthly meetups: decided together with each Village's founding members, so you help choose the day and time that works for most"
  );

  return (
    <div className="panel whyjoin">
      <h3 className="wj-title">
        <span className="wj-ic">
          <Ic name="globe" />
        </span>
        Why join ExpatPreneurs?
      </h3>
      <p className="muted" style={{ marginTop: 6 }}>
        ExpatPreneurs is where purpose-driven expat entrepreneurs find their
        people, build real partnerships, and grow their businesses through
        genuine collaboration, not surface networking. We are committed to
        building the most international entrepreneur community in every city
        where we have a Village, where your nationality matters less than your
        purpose. Your Village gives you a home in your city, and the network
        connects you to every other Village.
      </p>
      <p className="small" style={{ marginTop: 10, fontWeight: 600 }}>
        Becoming a member provides you with:
      </p>
      <div className="wj-grid">
        {[...BENEFITS, ["pin", "Our Villages", ours] as [string, string, string[]]].map(
          ([icon, heading, items]) => (
            <div key={heading}>
              <b className="wj-h">
                <span className="wj-ic sm">
                  <Ic name={icon} />
                </span>
                {heading}
              </b>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
      <p className="muted" style={{ marginTop: 12 }}>
        We are selective about who joins, to keep the quality and the culture.
        If you value collaboration over competition, are building with purpose,
        and are ready to contribute rather than only consume, we would love to
        have you.
      </p>
    </div>
  );
}

// applyAside(), the column beside the form.
export function WhatHappensNext() {
  const steps: [string, string][] = [
    ["Review", "Your request is read personally."],
    [
      "A conversation",
      "We may ask a few questions or invite you to an open evening.",
    ],
    [
      "Welcome",
      "Once accepted, you complete your profile and join a Circle and its WhatsApp group.",
    ],
  ];
  return (
    <aside className="panel">
      <h3 style={{ fontSize: 15 }}>What happens next</h3>
      <div className="divide" style={{ marginTop: 6 }}>
        {steps.map(([title, line], i) => (
          <div className="task" key={title}>
            <span
              className={`step ${i === 0 ? "on" : ""}`}
              style={{ padding: 0, background: "none" }}
            >
              <i>{i + 1}</i>
            </span>
            <div>
              <b>{title}</b>
              <p className="muted small">{line}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}