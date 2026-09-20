"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  formatChatMessageLinks,
} from "@livekit/components-react";
import "@livekit/components-styles";

type Ready = {
  token: string;
  url: string;
  role: string;
  canSpeak: boolean;
  recording: string;
  title: string;
  breakout: string | null;
};

// The room. Everything about who may be here was settled before this
// component ever runs.
export function RoomClient({ slug, onLeaveHref }: { slug: string; onLeaveHref: string }) {
  const [ready, setReady] = useState<Ready | null>(null);
  const [error, setError] = useState<string | null>(null);
  const joinedAt = useRef<number>(Date.now());
  const reported = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/live/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "That did not work.");
        if (!cancelled) {
          setReady(data as Ready);
          joinedAt.current = Date.now();
        }
      } catch (problem) {
        if (!cancelled) {
          setError(problem instanceof Error ? problem.message : "That did not work.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Tell the platform how long they were actually here, once. Closing the
  // tab and pressing leave both end up here, and only the first one counts.
  useEffect(() => {
    function report() {
      if (reported.current) return;
      reported.current = true;
      const seconds = Math.round((Date.now() - joinedAt.current) / 1000);
      const body = JSON.stringify({ slug, seconds });
      navigator.sendBeacon?.("/api/live/leave", new Blob([body], { type: "application/json" }));
    }
    window.addEventListener("pagehide", report);
    return () => window.removeEventListener("pagehide", report);
  }, [slug]);

  if (error) {
    return (
      <div className="panel">
        <h3>Not in the room</h3>
        <div className="flag hold">{error}</div>
        <a className="btn btn-ghost" href={onLeaveHref}>
          Back to the session
        </a>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="panel">
        <p className="muted" style={{ margin: 0 }}>
          Opening the room.
        </p>
      </div>
    );
  }

  return (
    <div className="roomwrap">
      {ready.breakout ? (
        <div className="flag ok">
          You are at {ready.breakout}. When the tables close you go back to
          the main room.
        </div>
      ) : null}

      {ready.recording !== "off" ? (
        <div className="flag hold">
          This session is recorded. Anything you say or show may be watched
          afterwards by the people it was open to.
        </div>
      ) : null}

      <LiveKitRoom
        token={ready.token}
        serverUrl={ready.url}
        connect
        audio={ready.canSpeak}
        video={ready.canSpeak}
        data-lk-theme="default"
        style={{ height: "72vh", borderRadius: 12, overflow: "hidden" }}
        onDisconnected={() => {
          if (reported.current) {
            window.location.href = onLeaveHref;
            return;
          }
          reported.current = true;
          const seconds = Math.round((Date.now() - joinedAt.current) / 1000);
          fetch("/api/live/leave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, seconds }),
            keepalive: true,
          }).finally(() => {
            window.location.href = onLeaveHref;
          });
        }}
      >
        <VideoConference chatMessageFormatter={formatChatMessageLinks} />
        <RoomAudioRenderer />
      </LiveKitRoom>

      {!ready.canSpeak ? (
        <p className="muted small" style={{ marginTop: 10 }}>
          You are watching this one. A host can give you the floor, and then
          your camera and microphone become available.
        </p>
      ) : null}
    </div>
  );
}