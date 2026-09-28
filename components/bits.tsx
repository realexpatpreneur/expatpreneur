import { Ic } from "@/components/icon";

// The avatar: initials on one of the prototype's seven tints, chosen
// from the name so a person always gets the same colour.
const AVC = ["#A8DCD1", "#FEEEEC", "#CFE0F2", "#FBDDB9", "#D9E9D2", "#E8DDF3", "#FFE3A8"];

export function Av({ name, className = "" }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span className={`av ${className}`} style={{ background: AVC[h % AVC.length] }} aria-hidden="true">
      {initials}
    </span>
  );
}

// Flags come from flagcdn, as in the prototype, because Windows has no
// flag emoji and falls back to a pair of letters.
const ISO: Record<string, string> = {
  "Algeria": "DZ",
  "Angola": "AO",
  "Argentina": "AR",
  "Australia": "AU",
  "Austria": "AT",
  "Bahrain": "BH",
  "Bangladesh": "BD",
  "Belgium": "BE",
  "Brazil": "BR",
  "Cameroon": "CM",
  "Canada": "CA",
  "Chile": "CL",
  "China": "CN",
  "Colombia": "CO",
  "Cyprus": "CY",
  "Czechia": "CZ",
  "Denmark": "DK",
  "Egypt": "EG",
  "Estonia": "EE",
  "Ethiopia": "ET",
  "Finland": "FI",
  "France": "FR",
  "Germany": "DE",
  "Ghana": "GH",
  "Greece": "GR",
  "Hong Kong": "HK",
  "Hungary": "HU",
  "India": "IN",
  "Indonesia": "ID",
  "Iran": "IR",
  "Iraq": "IQ",
  "Ireland": "IE",
  "Italy": "IT",
  "Japan": "JP",
  "Jordan": "JO",
  "Kenya": "KE",
  "Kuwait": "KW",
  "Lebanon": "LB",
  "Luxembourg": "LU",
  "Malaysia": "MY",
  "Malta": "MT",
  "Mauritius": "MU",
  "Mexico": "MX",
  "Morocco": "MA",
  "Nepal": "NP",
  "Netherlands": "NL",
  "New Zealand": "NZ",
  "Nigeria": "NG",
  "Norway": "NO",
  "Oman": "OM",
  "Pakistan": "PK",
  "Peru": "PE",
  "Philippines": "PH",
  "Poland": "PL",
  "Portugal": "PT",
  "Qatar": "QA",
  "Romania": "RO",
  "Russia": "RU",
  "Rwanda": "RW",
  "Saudi Arabia": "SA",
  "Senegal": "SN",
  "Singapore": "SG",
  "South Africa": "ZA",
  "South Korea": "KR",
  "Spain": "ES",
  "Sri Lanka": "LK",
  "Sweden": "SE",
  "Switzerland": "CH",
  "Syria": "SY",
  "Taiwan": "TW",
  "Tanzania": "TZ",
  "Thailand": "TH",
  "Tunisia": "TN",
  "T\u00fcrkiye": "TR",
  "Uganda": "UG",
  "Ukraine": "UA",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  "Venezuela": "VE",
  "Vietnam": "VN",
  "Zambia": "ZM",
  "Zimbabwe": "ZW",
};

// A nationality names a country, so a nationality chip carries its flag.
export const NAT_COUNTRY: Record<string, string> = {
  "American": "United States",
  "Brazilian": "Brazil",
  "British": "United Kingdom",
  "Cameroonian": "Cameroon",
  "Canadian": "Canada",
  "Egyptian": "Egypt",
  "Emirati": "United Arab Emirates",
  "Ethiopian": "Ethiopia",
  "French": "France",
  "German": "Germany",
  "Ghanaian": "Ghana",
  "Indian": "India",
  "Italian": "Italy",
  "Japanese": "Japan",
  "Lebanese": "Lebanon",
  "Moroccan": "Morocco",
  "Nigerian": "Nigeria",
  "Portuguese": "Portugal",
  "Spanish": "Spain",
  "Swedish": "Sweden",
};

export function NationalityFlag({ nationality }: { nationality: string }) {
  const country = NAT_COUNTRY[nationality];
  return country ? <Flag country={country} /> : null;
}

export function Flag({ country, className = "flg" }: { country: string; className?: string }) {
  const code = ISO[country];
  if (!code) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
      width={80}
      height={60}
      alt={country}
      loading="lazy"
    />
  );
}

// The hero's product preview: a profile, an event, a new connection and
// the cities, laid out as the prototype composes them.
export function HeroPreview() {
  return (
    <div
      className="preview"
      role="img"
      aria-label="Preview of a member profile, a Dubai event and a new connection"
    >
      <div className="pv pv-profile">
        <div className="row" style={{ gap: 12 }}>
          <span className="pv-portrait noimg">
            <i>TR</i>
          </span>
          <div>
            <b style={{ display: "block" }}>Tom&aacute;s Ribeiro</b>
            <span className="muted small">Brand designer, Norte Studio</span>
          </div>
        </div>
        <div className="path" style={{ marginTop: 12, padding: 6, gap: 4 }}>
          <span className="pnode" style={{ padding: "5px 8px", fontSize: 12 }}>
            <Ic name="globe" />
            Global
          </span>
          <Ic name="chev" />
          <span className="pnode" style={{ padding: "5px 8px", fontSize: 12 }}>
            <Ic name="pin" />
            Dubai
          </span>
          <Ic name="chev" />
          <span className="pnode on" style={{ padding: "5px 8px", fontSize: 12 }}>
            <Ic name="rings" />
            Circle 02
          </span>
        </div>
        <div className="tags" style={{ marginTop: 10 }}>
          <span className="chip">Creative &amp; Design</span>
          <span className="chip chip-mint">Open to collaborate</span>
        </div>
        <div className="pv-flags" aria-hidden="true">
          <Flag country="Brazil" />
          <Flag country="Portugal" />
          <Flag country="United Arab Emirates" />
          <b>Brazil, Portugal, now Dubai</b>
        </div>
      </div>

      <div className="pv pv-event">
        <div className="photo ph-dubai" role="img" aria-label="Dubai" />
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="date" style={{ width: 52, flex: "none" }}>
            <b>1</b>
            <span>Oct</span>
          </div>
          <div>
            <b style={{ display: "block" }}>Founders dinner</b>
            <span className="muted small">Dubai Village, 7:30 PM</span>
          </div>
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
          <div className="avstack">
            <Av name="Leila Haddad" className="av-sm" />
            <Av name="Julien Moreau" className="av-sm" />
            <Av name="Priya Menon" className="av-sm" />
          </div>
          <span className="chip chip-blue">Dubai Marina</span>
        </div>
      </div>

      <div className="pv pv-msg">
        <div className="row">
          <Av name="Nadia Mbarga" className="av-sm" />
          <div style={{ minWidth: 0 }}>
            <b style={{ display: "block", fontSize: 13 }}>Nadia accepted your request</b>
            <span className="muted small">Dubai Village, Hospitality</span>
          </div>
        </div>
      </div>

      <div className="pv pv-cities">
        <span className="city">
          <i />
          Dubai
        </span>
        <span className="city soon">
          <i />
          Lisbon
        </span>
        <span className="city soon">
          <i />
          Paris
        </span>
      </div>
    </div>
  );
}

// The three joined layer cards from the home page.
export function LayerCards() {
  return (
    <div className="layers layers-tint">
      <div className="layer">
        <span className="swatch" style={{ background: "var(--mint)" }} />
        <h3>Global</h3>
        <p>The whole network. Reach members, events and markets wherever there is a Village.</p>
      </div>
      <div className="layer">
        <span className="swatch" style={{ background: "var(--blue)" }} />
        <h3>Village</h3>
        <p>Your city. Local gatherings, local knowledge and the people building around you.</p>
      </div>
      <div className="layer">
        <span className="swatch" style={{ background: "var(--navy)" }} />
        <h3>Circle</h3>
        <p>Your home base of up to 50 members, where real relationships form.</p>
      </div>
    </div>
  );
}