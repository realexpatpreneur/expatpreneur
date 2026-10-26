import Link from "next/link";

// The public home page, transcribed from the design board rather than
// rewritten. Every inline style below is the board's own. The only things
// that differ are the links, which point at real routes, and the Villages
// rows, which are filled from the villages table.

export type HomeVillage = {
  slug: string;
  name: string;
  country: string | null;
  status: string;
  summary: string | null;
  members: number;
  circles: number;
};

const STATUS: Record<string, string> = {
  open: "Open",
  launching: "Launching",
  exploring: "Being explored",
};

const CHIP: Record<string, { background: string; color: string }> = {
  open: { background: "#E6F4F1", color: "#2F6A5E" },
  launching: { background: "#FDF0E3", color: "#8A5320" },
  exploring: { background: "#E7EEF7", color: "#2F5480" },
};

function villageLine(v: HomeVillage) {
  if (v.summary) return v.summary;
  if (v.status === "open")
    return `${v.members} members across ${v.circles} ${v.circles === 1 ? "Circle" : "Circles"}, meeting monthly.`;
  if (v.members) return `${v.members} members so far, the first Circle forming now.`;
  return "The first members are gathering ahead of the opening.";
}

export function HomeDesign({ villages }: { villages: HomeVillage[] }) {
  return (
    <div className="ep-home" style={{ background: "#FFFFFF" }}>
  <div id="top" style={{ "background": "linear-gradient(180deg, #F5F8FB 0%, #FFFFFF 100%)" }}>
    <div className="ep-gutter ep-hero-in" style={{ "maxWidth": "1200px", "margin": "0 auto", "padding": "72px 48px 80px", "display": "flex", "flexWrap": "wrap", "gap": "56px", "alignItems": "center", "position": "relative" }}>

      <div style={{ "flex": "999 1 460px", "minWidth": "0" }}>
        <p style={{ "margin": "0 0 22px", "display": "inline-flex", "alignItems": "center", "gap": "9px", "fontSize": "13px", "fontWeight": "600", "color": "#2F6A5E", "background": "#E6F4F1", "padding": "8px 15px", "borderRadius": "999px" }}>
          <span style={{ "width": "7px", "height": "7px", "borderRadius": "50%", "background": "#2F6A5E", "display": "inline-block" }}></span>
          Dubai is open. Lisbon and Paris are next.
        </p>
        <h1 className="ep-fs-61" style={{ "margin": "0 0 24px", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "61px", "lineHeight": "1.04", "fontWeight": "700", "letterSpacing": "-0.02em", "color": "#2C3E50" }}>Your business needs<br />a village too.</h1>
        <p className="ep-fs-18" style={{ "margin": "0 0 34px", "maxWidth": "480px", "fontSize": "18px", "lineHeight": "1.7", "color": "#5E6E7E" }}>A curated network of expat entrepreneurs. Belong to a small, trusted community in your city, and reach people you can trust in other markets.</p>
        <div className="ep-cta-row" style={{ "display": "flex", "flexWrap": "wrap", "gap": "14px", "marginBottom": "34px" }}>
          <Link className="ep-hero-btn" href="/apply" style={{ "textDecoration": "none", "background": "#2C3E50", "color": "#FFFFFF", "fontSize": "16px", "fontWeight": "600", "padding": "17px 32px", "borderRadius": "4px", "boxShadow": "0 10px 24px rgba(44, 62, 80, 0.16)" }}><span className="ep-long">Request your invitation</span><span className="ep-short">Request invitation</span></Link>
          <Link className="ep-hero-btn" href="/villages" style={{ "textDecoration": "none", "background": "#FFFFFF", "color": "#2C3E50", "fontSize": "16px", "fontWeight": "600", "padding": "16px 30px", "borderRadius": "4px", "border": "1px solid #E3E8EE" }}><span className="ep-long">Find your Village</span><span className="ep-short">Find Village</span></Link>
        </div>
        <div style={{ "display": "flex", "flexWrap": "wrap", "gap": "14px", "alignItems": "center" }}>
          <span style={{ "display": "flex" }}>
            <img src="/brand/face-a.jpg" alt="" style={{ "width": "40px", "height": "40px", "borderRadius": "50%", "objectFit": "cover", "border": "2px solid #FFFFFF" }} />
            <img src="/brand/face-b.jpg" alt="" style={{ "width": "40px", "height": "40px", "borderRadius": "50%", "objectFit": "cover", "border": "2px solid #FFFFFF", "marginLeft": "-12px" }} />
            <img src="/brand/face-c.jpg" alt="" style={{ "width": "40px", "height": "40px", "borderRadius": "50%", "objectFit": "cover", "border": "2px solid #FFFFFF", "marginLeft": "-12px" }} />
          </span>
          <span style={{ "fontSize": "14px", "lineHeight": "1.5", "color": "#5E6E7E" }}>Founders from more than twenty five countries,<br />meeting every month in their own city.</span>
        </div>
      </div>

      <div style={{ "flex": "1 1 380px", "minWidth": "0", "position": "relative", "paddingBottom": "36px" }}>
        <div style={{ "borderRadius": "20px", "overflow": "hidden", "boxShadow": "0 24px 60px rgba(44, 62, 80, 0.22)" }}>
          <img className="ep-hero-img" src="/brand/face-c.jpg" alt="A member of the Dubai Village" style={{ "display": "block", "width": "100%", "height": "420px", "objectFit": "cover" }} />
          <div style={{ "background": "#FFFFFF", "padding": "18px 20px", "display": "flex", "alignItems": "center", "gap": "12px" }}>
            <span>
              <b style={{ "display": "block", "fontSize": "16px", "color": "#2C3E50" }}>Tomás Ribeiro</b>
              <span style={{ "fontSize": "13px", "color": "#6B7C8C" }}>Brand designer, Norte Studio</span>
            </span>
            <span style={{ "marginLeft": "auto", "fontSize": "12px", "fontWeight": "600", "padding": "7px 13px", "borderRadius": "999px", "background": "#E7EEF7", "color": "#2F5480" }}>Dubai</span>
          </div>
        </div>

        

        <div style={{ "position": "absolute", "right": "-22px", "bottom": "-33px", "background": "#2C3E50", "color": "#FFFFFF", "borderRadius": "16px", "padding": "16px 18px", "boxShadow": "0 14px 34px rgba(44, 62, 80, 0.28)" }}>
          <p style={{ "margin": "0 0 3px", "fontSize": "11px", "fontWeight": "600", "letterSpacing": "0.1em", "textTransform": "uppercase", "color": "#F2A65A" }}>Thursday</p>
          <p style={{ "margin": "0 0 2px", "fontSize": "15px", "fontWeight": "600" }}>Founders dinner</p>
          <p style={{ "margin": "0", "fontSize": "12px", "color": "#A9B8C6" }}>Dubai Marina, 7:30 PM</p>
        </div>
    <div className="ep-float" style={{ "position": "absolute", "left": "-41px", "bottom": "137px", "background": "#FFFFFF", "borderRadius": "16px", "padding": "14px 16px", "display": "flex", "alignItems": "center", "gap": "11px", "boxShadow": "0 14px 34px rgba(44, 62, 80, 0.18)" }}>
          <img src="/brand/face-b.jpg" alt="" style={{ "width": "36px", "height": "36px", "borderRadius": "50%", "objectFit": "cover" }} />
          <span>
            <b style={{ "display": "block", "fontSize": "13px", "color": "#2C3E50" }}>Nadia accepted your request</b>
            <span style={{ "fontSize": "12px", "color": "#6B7C8C" }}>Dubai Village, Hospitality</span>
          </span>
        </div>
      </div>

</div>
  </div>
  <div className="ep-band" style={{ "background": "linear-gradient(180deg, rgba(64,116,174,0) 0, rgba(64,116,174,0.06) 190px, rgba(64,116,174,0.06) calc(100% - 150px), rgba(64,116,174,0) 100%)" }}>
  <div className="ep-gutter" style={{ "maxWidth": "1200px", "margin": "0 auto", "padding": "112px 48px 0" }}>
    <div style={{ "maxWidth": "720px", "marginBottom": "44px" }}>
      <p style={{ "margin": "0 0 16px", "fontSize": "13px", "fontWeight": "600", "letterSpacing": "0.14em", "textTransform": "uppercase", "color": "#5E6E7E" }}>How it is built</p>
      <h2 className="ep-fs-48" style={{ "margin": "0 0 20px", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "48px", "lineHeight": "1.1", "fontWeight": "700", "letterSpacing": "-0.015em", "color": "#2C3E50" }}>Big enough to open doors. Small enough to know each other.</h2>
      <p className="ep-fs-17" style={{ "margin": "0", "maxWidth": "540px", "fontSize": "17px", "lineHeight": "1.7", "color": "#5E6E7E" }}>Every member belongs to three places at once. As the network grows, your home base stays human sized.</p>
    </div>
    <div style={{ "position": "relative" }}>
      <div style={{ "borderRadius": "20px", "overflow": "hidden" }}>
        <img src="/brand/members.jpg" alt="Members of one Village working through something together" style={{ "display": "block", "width": "100%", "height": "430px", "objectFit": "cover", "filter": "blur(1px)", "transform": "scale(1.03)" }} />
      </div>
      <div className="ep-overlap" style={{ "position": "relative", "marginTop": "-158px", "display": "flex", "gap": "12px" }}>
      <div className="ep-card ep-zoom ep-rise" style={{ "flex": "1 1 0", "minWidth": "0", "background": "#FFFFFF", "border": "1px solid rgba(64,116,174,0.14)", "boxSizing": "border-box", "borderRadius": "20px", "padding": "48px 32px 40px", "textAlign": "center", "animationDelay": "0ms" }}>
        <span className="ep-icon" style={{ "display": "block", "width": "168px", "height": "168px", "margin": "0 auto 44px" }}><img src="/brand/globe.png" alt="A globe, Africa and Europe facing out" style={{ "display": "block", "width": "100%", "height": "100%", "objectFit": "contain" }} /></span>
        <p style={{ "margin": "0 0 10px", "fontSize": "12px", "fontWeight": "600", "letterSpacing": "0.16em", "textTransform": "uppercase", "color": "#4074AE" }}>Global</p>
        <p className="ep-fs-21" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "21px", "lineHeight": "1.35", "fontWeight": "600", "letterSpacing": "-0.01em", "color": "#2C3E50" }}>Reach members, events and markets wherever there is a Village.</p>
      </div>
      <div className="ep-card ep-zoom ep-rise" style={{ "flex": "1 1 0", "minWidth": "0", "background": "#FFFFFF", "border": "1px solid rgba(64,116,174,0.14)", "boxSizing": "border-box", "borderRadius": "20px", "padding": "48px 32px 40px", "textAlign": "center", "animationDelay": "110ms" }}>
        <span className="ep-icon" style={{ "display": "block", "width": "168px", "height": "168px", "margin": "0 auto 44px" }}><img src="/brand/village.png" alt="Members gathered round one place" style={{ "display": "block", "width": "100%", "height": "100%", "objectFit": "contain" }} /></span>
        <p style={{ "margin": "0 0 10px", "fontSize": "12px", "fontWeight": "600", "letterSpacing": "0.16em", "textTransform": "uppercase", "color": "#4074AE" }}>Village</p>
        <p className="ep-fs-21" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "21px", "lineHeight": "1.35", "fontWeight": "600", "letterSpacing": "-0.01em", "color": "#2C3E50" }}>Local gatherings, local knowledge and the people building around you.</p>
      </div>
      <div className="ep-card ep-zoom ep-rise" style={{ "flex": "1 1 0", "minWidth": "0", "background": "#FFFFFF", "border": "1px solid rgba(64,116,174,0.14)", "boxSizing": "border-box", "borderRadius": "20px", "padding": "48px 32px 40px", "textAlign": "center", "animationDelay": "220ms" }}>
        <span className="ep-icon" style={{ "display": "block", "width": "168px", "height": "168px", "margin": "0 auto 44px" }}><img src="/brand/circle.png" alt="Two lives linked" style={{ "display": "block", "width": "100%", "height": "100%", "objectFit": "contain" }} /></span>
        <p style={{ "margin": "0 0 10px", "fontSize": "12px", "fontWeight": "600", "letterSpacing": "0.16em", "textTransform": "uppercase", "color": "#4074AE" }}>Circle</p>
        <p className="ep-fs-21" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "21px", "lineHeight": "1.35", "fontWeight": "600", "letterSpacing": "-0.01em", "color": "#2C3E50" }}>Your home base of up to fifty members, where real relationships form.</p>
      </div>
    </div>
    </div><div className="ep-gutter-late" style={{ "maxWidth": "1200px", "margin": "0 auto", "paddingTop": "112px" }}>
    
    
    
    
  </div>
  </div>
  
  </div>
  <div className="ep-gutter-late" style={{ "maxWidth": "1200px", "margin": "0 auto", "paddingTop": "112px" }}>
    <div style={{ "display": "flex", "gap": "70px", "alignItems": "flex-start" }}>
      <div className="ep-side-col ep-zoom" style={{ "flex": "none", "width": "409px", "position": "relative" }}>
        <span className="ep-side-col" style={{ "display": "block", "width": "409px", "height": "519px", "borderRadius": "20px", "overflow": "hidden" }}><img src="/brand/founder.jpg" alt="Kristiane Charrier" style={{ "display": "block", "width": "100%", "height": "100%", "objectFit": "cover" }} /></span>
        <div style={{ "position": "absolute", "left": "0", "right": "0", "bottom": "18px", "textAlign": "center" }}><Link href="/media" className="ep-btn" style={{ "display": "inline-block", "background": "#FFFFFF", "color": "#2C3E50", "textDecoration": "none", "fontSize": "15px", "fontWeight": "600", "padding": "13px 28px", "borderRadius": "4px" }}>Read The Story</Link></div>
      </div>
      <div style={{ "flex": "1 1 0", "minWidth": "0" }}>
        <p style={{ "margin": "0 0 14px", "fontSize": "13px", "fontWeight": "500", "letterSpacing": "0.08em", "textTransform": "uppercase", "color": "#5E6E7E", "textAlign": "left" }}>Who are we?</p>
        <h2 className="ep-fs-42" style={{ "margin": "0 0 46px", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "42px", "lineHeight": "1.16", "fontWeight": "700", "letterSpacing": "-0.012em", "color": "#2C3E50", "textAlign": "left" }}>Six countries, one lesson: local belonging needs global continuity</h2>
        <div style={{ "display": "flex", "gap": "5px" }}>
          <div style={{ "flex": "1 1 0", "display": "flex", "flexDirection": "column", "gap": "5px" }}>
        <div className="ep-tile-num ep-rise" style={{ "background": "rgba(64,116,174,0.035)", "border": "1px solid rgba(64,116,174,0.17)", "boxSizing": "border-box", "borderRadius": "16px", "height": "88px", "padding": "0 24px", "display": "flex", "alignItems": "center", "justifyContent": "space-between" }}>
          <p className="ep-fs-30" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "30px", "fontWeight": "700", "color": "#2C3E50" }}>3</p>
          <span style={{ "width": "26px", "height": "26px", "border": "1.5px solid rgba(64,116,174,0.35)", "borderRadius": "8px" }}></span>
        </div>
        <div className="ep-tile-text ep-rise" style={{ "background": "#FFFFFF", "border": "1px solid rgba(64,116,174,0.10)", "boxShadow": "0 12px 30px rgba(44,62,80,0.11), 0 2px 6px rgba(44,62,80,0.05)", "boxSizing": "border-box", "borderRadius": "16px", "height": "217px", "padding": "24px", "display": "flex", "flexDirection": "column", "justifyContent": "space-between" }}>
          <p className="ep-fs-20" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "20px", "lineHeight": "1.3", "fontWeight": "600", "color": "#2C3E50", "textAlign": "right" }}>Villages, with more being explored</p>
          <p style={{ "margin": "0", "fontSize": "14px", "lineHeight": "1.5", "color": "#5E6E7E" }}>Dubai is open. Lisbon and Paris are next.</p>
        </div>
          </div>
          <div style={{ "flex": "1 1 0", "display": "flex", "flexDirection": "column", "gap": "5px" }}>
        <div className="ep-tile-text ep-rise" style={{ "background": "#FFFFFF", "border": "1px solid rgba(64,116,174,0.10)", "boxShadow": "0 12px 30px rgba(44,62,80,0.11), 0 2px 6px rgba(44,62,80,0.05)", "boxSizing": "border-box", "borderRadius": "16px", "height": "213px", "padding": "24px", "display": "flex", "flexDirection": "column", "justifyContent": "space-between" }}>
          <p className="ep-fs-20" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "20px", "lineHeight": "1.3", "fontWeight": "600", "color": "#2C3E50", "textAlign": "right" }}>Members to a Circle, never more</p>
          <p style={{ "margin": "0", "fontSize": "14px", "lineHeight": "1.5", "color": "#5E6E7E" }}>Your home base of up to fifty members, where real relationships form.</p>
        </div>
        <div className="ep-tile-num ep-rise" style={{ "background": "rgba(64,116,174,0.035)", "border": "1px solid rgba(64,116,174,0.17)", "boxSizing": "border-box", "borderRadius": "16px", "height": "92px", "padding": "0 24px", "display": "flex", "alignItems": "center", "justifyContent": "space-between" }}>
          <p className="ep-fs-30" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "30px", "fontWeight": "700", "color": "#2C3E50" }}>50</p>
          <span style={{ "width": "26px", "height": "26px", "border": "1.5px solid rgba(64,116,174,0.35)", "borderRadius": "8px" }}></span>
        </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div className="ep-gutter-late" style={{ "maxWidth": "1200px", "margin": "0 auto", "paddingTop": "112px" }}>
    <div className="ep-rise" style={{ "background": "#F5F8FB", "boxShadow": "-16px 0 22px -18px rgba(44,62,80,0.16), 16px 0 22px -18px rgba(44,62,80,0.16)", "borderRadius": "20px", "padding": "44px 58px", "display": "flex", "flexWrap": "wrap", "gap": "40px", "alignItems": "center" }}>
      <img className="ep-spin" src="/brand/mark.jpg" alt="" style={{ "flex": "none", "width": "120px", "height": "120px", "objectFit": "cover", "borderRadius": "999px" }} />
      <p className="ep-fs-30" style={{ "flex": "1 1 320px", "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "30px", "lineHeight": "1.25", "fontWeight": "700", "color": "#2C3E50" }}>ExpatPreneurs is by invitation.</p>
      <div style={{ "flex": "1 1 340px", "minWidth": "0" }}>
        <p style={{ "margin": "0 0 22px", "fontSize": "15px", "lineHeight": "1.6", "color": "#5E6E7E", "textAlign": "left" }}>Every request is read by a person in the Village you are asking to join.</p>
        <Link href="/apply" className="ep-btn" style={{ "display": "inline-block", "background": "#2C3E50", "color": "#FFFFFF", "textDecoration": "none", "fontSize": "15px", "fontWeight": "600", "padding": "14px 28px", "borderRadius": "4px" }}>Request Your Invitation</Link>
      </div>
    </div>
  </div>
      {/* The Villages, the board's own row, filled from the villages table */}
      <div className="ep-gutter" style={{ maxWidth: "1200px", margin: "0 auto", padding: "112px 48px 0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "30px" }}>
          <div>
            <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: "#5E6E7E" }}>The Villages</p>
            <h2 className="ep-fs-44" style={{ margin: "0", fontFamily: "Inter, system-ui, sans-serif", fontSize: "44px", lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.015em", color: "#2C3E50" }}>Find yours</h2>
          </div>
          <Link href="/villages/suggest" style={{ textDecoration: "none", fontSize: "15px", fontWeight: "600", color: "#2F5480", borderBottom: "2px solid #4074AE", paddingBottom: "3px" }}>Suggest a city</Link>
        </div>

        {villages.map((v, i) => (
          <div key={v.slug} className="ep-vrow ep-panel" style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center", padding: "26px", borderRadius: "20px", background: "#FFFFFF", boxShadow: "0 8px 26px rgba(44, 62, 80, 0.09)", marginBottom: i === villages.length - 1 ? "0" : "14px" }}>
            <span style={{ flex: "1 1 200px", minWidth: "0" }}>
              <b className="ep-fs-30" style={{ display: "block", fontFamily: "Inter, system-ui, sans-serif", fontSize: "30px", fontWeight: "500", color: "#2C3E50" }}>{v.name}</b>
              <span style={{ fontSize: "14px", color: "#6B7C8C" }}>{v.country}</span>
            </span>
            <span style={{ flex: "2 1 280px", minWidth: "0", fontSize: "15px", lineHeight: "1.6", color: "#5E6E7E" }}>{villageLine(v)}</span>
            {i === 0 ? (
              <span style={{ display: "flex", flex: "none" }}>
                <img src="/brand/face-c.jpg" alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #FFFFFF" }} />
                <img src="/brand/face-a.jpg" alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #FFFFFF", marginLeft: "-11px" }} />
              </span>
            ) : i === 1 ? (
              <span style={{ display: "flex", flex: "none" }}>
                <img src="/brand/face-b.jpg" alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #FFFFFF" }} />
              </span>
            ) : (
              <span style={{ flex: "none", width: "36px" }}></span>
            )}
            <span style={{ flex: "none", fontSize: "12px", fontWeight: "600", padding: "8px 15px", borderRadius: "999px", ...CHIP[v.status] }}>{STATUS[v.status] ?? v.status}</span>
            <Link href={`/villages/${v.slug}`} style={{ flex: "none", textDecoration: "none", fontSize: "14px", fontWeight: "600", color: "#2F5480" }}>{v.status === "open" ? "Explore" : "Join the waitlist"}</Link>
          </div>
        ))}
      </div>
    <div className="ep-gutter" style={{ "maxWidth": "1200px", "margin": "0 auto", "padding": "112px 48px 0" }}>
    <div style={{ "display": "flex", "flexWrap": "wrap", "gap": "60px", "alignItems": "flex-start" }}>

      <div style={{ "flex": "1.1 1 440px", "minWidth": "0" }}>
        <p style={{ "margin": "0 0 14px", "fontSize": "13px", "fontWeight": "600", "letterSpacing": "0.14em", "textTransform": "uppercase", "color": "#5E6E7E" }}>What it costs</p>
        <h2 className="ep-fs-44" style={{ "margin": "0 0 22px", "maxWidth": "20ch", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "44px", "lineHeight": "1.1", "fontWeight": "700", "letterSpacing": "-0.015em", "color": "#2C3E50" }}>One membership.<br />Your Village sets the rate.</h2>
        <p className="ep-fs-17" style={{ "margin": "0 0 34px", "maxWidth": "480px", "fontSize": "17px", "lineHeight": "1.7", "color": "#5E6E7E" }}>There are no tiers to choose between. One membership, set by the city you join, and you are asked to pay nothing until a Village has accepted you.</p>

        <div style={{ "display": "grid", "gridTemplateColumns": "repeat(2, minmax(0, 1fr))", "gap": "26px 32px" }}>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "16px" }}>
            <b style={{ "display": "block", "fontSize": "15px", "marginBottom": "6px", "color": "#2C3E50" }}>Your Circle</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.65", "color": "#5E6E7E" }}>A home base of up to fifty members, and its group.</span>
          </div>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "16px" }}>
            <b style={{ "display": "block", "fontSize": "15px", "marginBottom": "6px", "color": "#2C3E50" }}>Every Village</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.65", "color": "#5E6E7E" }}>The Directory, and the boards of every other Village.</span>
          </div>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "16px" }}>
            <b style={{ "display": "block", "fontSize": "15px", "marginBottom": "6px", "color": "#2C3E50" }}>Events anywhere</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.65", "color": "#5E6E7E" }}>Your own city, and any other Village you visit.</span>
          </div>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "16px" }}>
            <b style={{ "display": "block", "fontSize": "15px", "marginBottom": "6px", "color": "#2C3E50" }}>Hubs and Pods</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.65", "color": "#5E6E7E" }}>Your industry, and a small group working to the same end.</span>
          </div>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "16px" }}>
            <b style={{ "display": "block", "fontSize": "15px", "marginBottom": "6px", "color": "#2C3E50" }}>New markets</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.65", "color": "#5E6E7E" }}>Market Exploration posts from members already there.</span>
          </div>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "16px" }}>
            <b style={{ "display": "block", "fontSize": "15px", "marginBottom": "6px", "color": "#2C3E50" }}>The library</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.65", "color": "#5E6E7E" }}>Resources, learning pathways and the courses on them.</span>
          </div>
        </div>
      </div>

      <div style={{ "flex": "1 1 380px", "minWidth": "0" }}>
        <div className="ep-panel" style={{ "background": "#FFFFFF", "borderRadius": "20px", "boxShadow": "0 8px 26px rgba(44, 62, 80, 0.09)", "padding": "32px 30px" }}>
          <p style={{ "margin": "0 0 4px", "display": "inline-flex", "alignItems": "center", "gap": "9px", "fontSize": "12px", "fontWeight": "600", "letterSpacing": "0.08em", "textTransform": "uppercase", "color": "#2F6A5E", "background": "#E6F4F1", "padding": "7px 14px", "borderRadius": "999px" }}>
            <span style={{ "width": "6px", "height": "6px", "borderRadius": "50%", "background": "#2F6A5E", "display": "inline-block" }}></span>
            Billed in your Village's currency
          </p>

          <div style={{ "display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "gap": "14px", "marginTop": "26px", "paddingBottom": "18px", "borderBottom": "1px solid #E3E8EE" }}>
            <span>
              <b className="ep-fs-19" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "19px", "fontWeight": "600", "color": "#2C3E50" }}>Dubai</b>
            </span>
            <span style={{ "textAlign": "right", "flex": "none" }}>
              <b className="ep-fs-27" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "27px", "fontWeight": "700", "letterSpacing": "-0.02em", "color": "#2C3E50" }}>AED 59</b>
              <span style={{ "fontSize": "12px", "color": "#6B7C8C" }}>a month, or 599 a year</span>
            </span>
          </div>

          <div style={{ "display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "gap": "14px", "marginTop": "18px", "paddingBottom": "18px", "borderBottom": "1px solid #E3E8EE" }}>
            <span>
              <b className="ep-fs-19" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "19px", "fontWeight": "600", "color": "#2C3E50" }}>Lisbon</b>
            </span>
            <span style={{ "textAlign": "right", "flex": "none" }}>
              <b className="ep-fs-27" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "27px", "fontWeight": "700", "letterSpacing": "-0.02em", "color": "#2C3E50" }}>EUR 15</b>
              <span style={{ "fontSize": "12px", "color": "#6B7C8C" }}>a month, or 159 a year</span>
            </span>
          </div>

          <div style={{ "display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "gap": "14px", "marginTop": "18px" }}>
            <span>
              <b className="ep-fs-19" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "19px", "fontWeight": "600", "color": "#2C3E50" }}>Paris</b>
            </span>
            <span style={{ "textAlign": "right", "flex": "none" }}>
              <b className="ep-fs-27" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "27px", "fontWeight": "700", "letterSpacing": "-0.02em", "color": "#2C3E50" }}>EUR 15</b>
              <span style={{ "fontSize": "12px", "color": "#6B7C8C" }}>a month, or 159 a year</span>
            </span>
          </div>

          <div style={{ "marginTop": "26px", "paddingTop": "22px", "borderTop": "1px solid #E3E8EE" }}>
            <Link className="ep-btn" href="/apply" style={{ "display": "block", "textAlign": "center", "textDecoration": "none", "background": "#2C3E50", "color": "#FFFFFF", "fontSize": "15px", "fontWeight": "600", "padding": "15px 28px", "borderRadius": "4px" }}>Request your invitation</Link>
            <p style={{ "margin": "14px 0 0", "textAlign": "center", "fontSize": "13px", "lineHeight": "1.6", "color": "#6B7C8C" }}>Nothing is taken until a Village accepts you.</p>
          </div>
        </div>

        <p style={{ "margin": "18px 0 0", "fontSize": "13px", "lineHeight": "1.7", "color": "#6B7C8C" }}>Without an invitation you can still read the Villages, the public events and the stories.</p>
      </div>

    </div>
  </div>

<div style={{ "marginTop": "112px", "background": "#F5F8FB" }}>
    <div className="ep-gutter" style={{ "maxWidth": "1200px", "margin": "0 auto", "padding": "96px 48px" }}>
      <p style={{ "margin": "0 0 18px", "fontSize": "11px", "fontWeight": "600", "letterSpacing": "0.24em", "textTransform": "uppercase", "color": "#4074AE" }}>What members do here</p>
      <h2 className="ep-fs-42" style={{ "margin": "0 0 44px", "maxWidth": "20ch", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "42px", "lineHeight": "1.14", "fontWeight": "700", "letterSpacing": "-0.015em", "color": "#2C3E50" }}>Ask, offer, and meet the person who has done it before.</h2>
      <div style={{ "display": "grid", "gridTemplateColumns": "repeat(4, minmax(0, 1fr))", "gap": "32px" }}>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "18px" }}>
            <b className="ep-fs-17" style={{ "display": "block", "fontSize": "17px", "marginBottom": "8px", "color": "#2C3E50" }}>Ask and offer</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.7", "color": "#5E6E7E" }}>Post what you need or what you can give, and track it until it is resolved.</span>
          </div>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "18px" }}>
            <b className="ep-fs-17" style={{ "display": "block", "fontSize": "17px", "marginBottom": "8px", "color": "#2C3E50" }}>Find the right people</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.7", "color": "#5E6E7E" }}>Search by skill, language and the markets people actually know.</span>
          </div>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "18px" }}>
            <b className="ep-fs-17" style={{ "display": "block", "fontSize": "17px", "marginBottom": "8px", "color": "#2C3E50" }}>Meet in person</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.7", "color": "#5E6E7E" }}>Monthly gatherings in your Village, and events in other cities.</span>
          </div>
          <div style={{ "borderTop": "1px solid #E3E8EE", "paddingTop": "18px" }}>
            <b className="ep-fs-17" style={{ "display": "block", "fontSize": "17px", "marginBottom": "8px", "color": "#2C3E50" }}>Explore new markets</b>
            <span style={{ "fontSize": "14px", "lineHeight": "1.7", "color": "#5E6E7E" }}>Talk to members who already build where you want to go.</span>
          </div>
      </div>
    </div>
  </div>
<div style={{ "marginTop": "112px", "background": "#FFFFFF" }}>
    <div className="ep-gutter" style={{ "maxWidth": "1200px", "margin": "0 auto", "padding": "112px 48px 0", "display": "flex", "gap": "60px", "alignItems": "flex-start" }}>
      <div style={{ "flex": "1 1 0", "minWidth": "0", "position": "sticky", "top": "130px", "paddingBottom": "110px" }}>
        <p style={{ "margin": "0 0 22px", "fontSize": "15px", "fontWeight": "700", "color": "#4074AE" }}>[ The network so far ]</p>
        <h2 className="ep-fs-46" style={{ "margin": "0 0 28px", "maxWidth": "420px", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "46px", "lineHeight": "1.14", "fontWeight": "700", "letterSpacing": "-0.015em", "color": "#2C3E50" }}>Small by design, and growing city by city</h2>
        <p className="ep-fs-17" style={{ "margin": "0", "maxWidth": "340px", "fontSize": "17px", "lineHeight": "1.55", "color": "#5E6E7E" }}>Every member belongs to three places at once. As the network grows, your home base stays human sized.</p>
      </div>
      <div className="ep-wide-col" style={{ "flex": "none", "width": "671px", "paddingBottom": "300px", "height": "1017px" }}>
        <div style={{ "position": "sticky", "top": "110px", "marginBottom": "30px", "height": "298px", "boxSizing": "border-box", "background": "rgba(64,116,174,0.25)", "WebkitBackdropFilter": "blur(14px) saturate(140%)", "backdropFilter": "blur(14px) saturate(140%)", "border": "1px solid rgba(255,255,255,0.65)", "boxShadow": "0 14px 34px rgba(44,62,80,0.10), inset 0 1px 0 rgba(255,255,255,0.75)", "borderRadius": "20px", "padding": "45px 40px 0", "WebkitMaskImage": "radial-gradient(circle 34px at 64% 0, transparent 34px, #000 34.5px), radial-gradient(circle 30px at 25% 100%, transparent 30px, #000 30.5px)", "WebkitMaskComposite": "source-in", "maskImage": "radial-gradient(circle 34px at 64% 0, transparent 34px, #000 34.5px), radial-gradient(circle 30px at 25% 100%, transparent 30px, #000 30.5px)", "maskComposite": "intersect" }}>
          <p className="ep-fs-52" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "52px", "lineHeight": "1.0", "fontWeight": "700", "letterSpacing": "-0.02em", "color": "#2C3E50" }}>3</p>
          <p className="ep-fs-24" style={{ "margin": "24px 0 0", "fontSize": "24px", "fontWeight": "700", "color": "#2C3E50" }}>Villages, with more being explored</p>
          <p className="ep-fs-17" style={{ "margin": "16px 0 0", "maxWidth": "430px", "fontSize": "17px", "lineHeight": "1.6", "color": "rgba(44,62,80,0.78)" }}>Dubai is open. Lisbon and Paris are next, with more cities being explored.</p>
        </div>
        <div style={{ "position": "sticky", "top": "152px", "marginBottom": "30px", "height": "298px", "boxSizing": "border-box", "background": "rgba(168,220,209,0.61)", "WebkitBackdropFilter": "blur(14px) saturate(140%)", "backdropFilter": "blur(14px) saturate(140%)", "border": "1px solid rgba(255,255,255,0.65)", "boxShadow": "0 14px 34px rgba(44,62,80,0.10), inset 0 1px 0 rgba(255,255,255,0.75)", "borderRadius": "20px", "padding": "45px 40px 0", "WebkitMaskImage": "radial-gradient(circle 34px at 64% 0, transparent 34px, #000 34.5px), radial-gradient(circle 30px at 25% 100%, transparent 30px, #000 30.5px)", "WebkitMaskComposite": "source-in", "maskImage": "radial-gradient(circle 34px at 64% 0, transparent 34px, #000 34.5px), radial-gradient(circle 30px at 25% 100%, transparent 30px, #000 30.5px)", "maskComposite": "intersect" }}>
          <p className="ep-fs-52" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "52px", "lineHeight": "1.0", "fontWeight": "700", "letterSpacing": "-0.02em", "color": "#2C3E50" }}>50</p>
          <p className="ep-fs-24" style={{ "margin": "24px 0 0", "fontSize": "24px", "fontWeight": "700", "color": "#2C3E50" }}>Members to a Circle, never more</p>
          <p className="ep-fs-17" style={{ "margin": "16px 0 0", "maxWidth": "430px", "fontSize": "17px", "lineHeight": "1.6", "color": "rgba(44,62,80,0.78)" }}>Your home base of up to fifty members, where real relationships form.</p>
        </div>
        <div style={{ "position": "sticky", "top": "194px", "marginBottom": "30px", "height": "298px", "boxSizing": "border-box", "background": "rgba(124,92,148,0.25)", "WebkitBackdropFilter": "blur(14px) saturate(140%)", "backdropFilter": "blur(14px) saturate(140%)", "border": "1px solid rgba(255,255,255,0.65)", "boxShadow": "0 14px 34px rgba(44,62,80,0.10), inset 0 1px 0 rgba(255,255,255,0.75)", "borderRadius": "20px", "padding": "45px 40px 0", "WebkitMaskImage": "radial-gradient(circle 34px at 64% 0, transparent 34px, #000 34.5px), radial-gradient(circle 30px at 25% 100%, transparent 30px, #000 30.5px)", "WebkitMaskComposite": "source-in", "maskImage": "radial-gradient(circle 34px at 64% 0, transparent 34px, #000 34.5px), radial-gradient(circle 30px at 25% 100%, transparent 30px, #000 30.5px)", "maskComposite": "intersect" }}>
          <p className="ep-fs-52" style={{ "margin": "0", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "52px", "lineHeight": "1.0", "fontWeight": "700", "letterSpacing": "-0.02em", "color": "#2C3E50" }}>25+</p>
          <p className="ep-fs-24" style={{ "margin": "24px 0 0", "fontSize": "24px", "fontWeight": "700", "color": "#2C3E50" }}>Countries of origin in Dubai alone</p>
          <p className="ep-fs-17" style={{ "margin": "16px 0 0", "maxWidth": "430px", "fontSize": "17px", "lineHeight": "1.6", "color": "rgba(44,62,80,0.78)" }}>Founders from more than twenty five countries, meeting every month in their own city.</p>
        </div>
      </div>
    </div>
  </div>
  
  <div className="ep-band" style={{ "background": "linear-gradient(180deg, rgba(64,116,174,0) 0, rgba(64,116,174,0.06) 190px, rgba(64,116,174,0.06) calc(100% - 150px), rgba(64,116,174,0) 100%)" }}>
  <div className="ep-gutter" style={{ "maxWidth": "1200px", "margin": "0 auto", "padding": "112px 48px 96px" }}>
    <div style={{ "display": "flex", "flexWrap": "wrap", "gap": "60px", "alignItems": "flex-start" }}>

      <div style={{ "flex": "1 1 300px", "minWidth": "0" }}>
        <p style={{ "margin": "0 0 14px", "fontSize": "13px", "fontWeight": "600", "letterSpacing": "0.14em", "textTransform": "uppercase", "color": "#5E6E7E" }}>Before you ask</p>
        <h2 className="ep-fs-44" style={{ "margin": "0 0 20px", "maxWidth": "14ch", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "44px", "lineHeight": "1.1", "fontWeight": "700", "letterSpacing": "-0.015em", "color": "#2C3E50" }}>Questions people ask us</h2>
        <p style={{ "margin": "0", "maxWidth": "340px", "fontSize": "16px", "lineHeight": "1.7", "color": "#5E6E7E" }}>If yours is not here, write to us and a person will answer it.</p>
      </div>

      <div style={{ "flex": "1.5 1 560px", "minWidth": "0" }}>

        <div style={{ "borderTop": "1px solid #E3E8EE", "padding": "26px 0" }}>
          <b className="ep-fs-19" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "19px", "fontWeight": "600", "letterSpacing": "-0.01em", "color": "#2C3E50", "marginBottom": "10px" }}>What happens after I request an invitation?</b>
          <span style={{ "display": "block", "maxWidth": "620px", "fontSize": "15px", "lineHeight": "1.7", "color": "#5E6E7E" }}>Someone in the Village you asked to join reads your request. If it is right for that Village, they send you an invitation. Nothing is taken from you before that point.</span>
        </div>

        <div style={{ "borderTop": "1px solid #E3E8EE", "padding": "26px 0" }}>
          <b className="ep-fs-19" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "19px", "fontWeight": "600", "letterSpacing": "-0.01em", "color": "#2C3E50", "marginBottom": "10px" }}>What if there is no Village in my city?</b>
          <span style={{ "display": "block", "maxWidth": "620px", "fontSize": "15px", "lineHeight": "1.7", "color": "#5E6E7E" }}>Suggest the city. Where a Village is already being explored you can put your name down, and you will hear from us when it opens.</span>
        </div>

        <div style={{ "borderTop": "1px solid #E3E8EE", "padding": "26px 0" }}>
          <b className="ep-fs-19" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "19px", "fontWeight": "600", "letterSpacing": "-0.01em", "color": "#2C3E50", "marginBottom": "10px" }}>Can I belong to more than one Village?</b>
          <span style={{ "display": "block", "maxWidth": "620px", "fontSize": "15px", "lineHeight": "1.7", "color": "#5E6E7E" }}>You have one Home Village, and your Circle sits inside it. Everything else is open to you everywhere: the Directory, the boards of other Villages, their events, the Hubs and the Pods.</span>
        </div>

        <div style={{ "borderTop": "1px solid #E3E8EE", "borderBottom": "1px solid #E3E8EE", "padding": "26px 0" }}>
          <b className="ep-fs-19" style={{ "display": "block", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "19px", "fontWeight": "600", "letterSpacing": "-0.01em", "color": "#2C3E50", "marginBottom": "10px" }}>Who can see my profile?</b>
          <span style={{ "display": "block", "maxWidth": "620px", "fontSize": "15px", "lineHeight": "1.7", "color": "#5E6E7E" }}>Members do. On the public page of a Village, only the members who have chosen to appear are shown, beside the count of members, nationalities and industries.</span>
        </div>

      </div>
    </div>
  </div>
  </div>
  <div style={{ "position": "relative" }}>
    <img src="/brand/invite.jpg" alt="A member among the people who read invitation requests" style={{ "display": "block", "width": "100%", "height": "420px", "objectFit": "cover" }} />
    <div style={{ "position": "absolute", "inset": "0", "background": "linear-gradient(90deg, rgba(44,62,80,0.92) 0%, rgba(44,62,80,0.72) 55%, rgba(44,62,80,0.5) 100%)" }}></div>
    <div style={{ "position": "absolute", "inset": "0", "display": "flex", "alignItems": "center" }}>
      <div className="ep-gutter" style={{ "maxWidth": "1200px", "margin": "0 auto", "padding": "0 48px", "width": "100%", "boxSizing": "border-box" }}>
        <h2 className="ep-fs-44" style={{ "margin": "0 0 18px", "maxWidth": "540px", "fontFamily": "Inter, system-ui, sans-serif", "fontSize": "44px", "lineHeight": "1.12", "fontWeight": "700", "color": "#FFFFFF" }}>Ready to find your Village?</h2>
        <p className="ep-fs-17" style={{ "margin": "0 0 30px", "maxWidth": "470px", "fontSize": "17px", "lineHeight": "1.7", "color": "#E3E8EE" }}>ExpatPreneurs is by invitation. Every request is read by a person in the Village you are asking to join.</p>
        <div style={{ "display": "flex", "flexWrap": "wrap", "gap": "14px" }}><Link href="/apply" style={{ "textDecoration": "none", "background": "rgb(255, 255, 255)", "color": "rgb(44, 62, 80)", "fontSize": "16px", "fontWeight": "600", "padding": "17px 32px", "borderRadius": "4px" }}>Request your invitation</Link>
          <Link href="/discover" style={{ "textDecoration": "none", "background": "rgba(255, 255, 255, 0.14)", "color": "rgb(255, 255, 255)", "fontSize": "16px", "fontWeight": "600", "padding": "17px 32px", "borderRadius": "4px", "border": "1px solid rgba(255, 255, 255, 0.3)" }}>Discover the community</Link>
        </div>
      </div>
    </div>
  </div>
    </div>
  );
}
