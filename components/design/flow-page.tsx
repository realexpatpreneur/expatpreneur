import type { ReactNode } from "react";
import { Faces, PHOTO } from "@/components/design/parts";

// The shape Log in set for every screen you pass through on the way in
// or out: what you are doing on one side, the people it is for on the
// other. Password resets, re-enrolment and every "that worked" page use
// it, so none of them looks like a different site.
export function FlowPage({
  title,
  lead,
  children,
  photo = PHOTO.members,
  photoAlt = "Members of a Village working together",
  card,
  faces = [PHOTO.tomas, PHOTO.ines, PHOTO.julien],
}: {
  title?: string;
  lead?: ReactNode;
  children: ReactNode;
  photo?: string;
  photoAlt?: string;
  card?: { title: string; line: string };
  faces?: string[];
}) {
  return (
    <div className="d-page d-login d-flow">
      <div className="d-login-form">
        <div style={{ width: "100%", maxWidth: 480 }}>
          {title ? (
            <h1 className="d-h1" style={{ fontSize: "clamp(30px, 3.2vw, 42px)" }}>
              {title}
            </h1>
          ) : null}
          {lead ? (
            <p className="d-lead" style={{ marginTop: 12, fontSize: 17 }}>
              {lead}
            </p>
          ) : null}
          <div className="d-form" style={{ marginTop: title || lead ? 28 : 0 }}>
            {children}
          </div>
        </div>
      </div>

      <div className="d-login-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={photoAlt} />
        {card ? (
          <div
            className="d-card-paper d-float"
            style={{ position: "absolute", left: 40, bottom: 40, display: "flex", alignItems: "center", gap: 14, maxWidth: 340 }}
          >
            <Faces srcs={faces} size={36} />
            <span style={{ fontSize: 14, lineHeight: 1.4 }}>
              <b style={{ display: "block" }}>{card.title}</b>
              <span style={{ color: "#6B7683" }}>{card.line}</span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
