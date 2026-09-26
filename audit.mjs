// audit.mjs
// Opens the live site in a real browser and checks each page against
// what the prototype specifies: the parts that must be on it, the words
// that must be on it, whether the layout holds, whether the navigation
// goes where it says, and whether anything is broken underneath.
//
//   npm install -D playwright
//   npx playwright install chromium
//
//   node audit.mjs --login          sign in once, saved to auth.json
//   node audit.mjs                  run the audit
//   node audit.mjs --base https://expatpreneur.vercel.app
//
// It writes audit-report.md and a screenshot of every page into
// audit-shots. It changes nothing on the site.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const BASE = (flag("base", "https://expatpreneur.vercel.app")).replace(/\/$/, "");
const SHOTS = "audit-shots";

// --------------------------------------------------------------- the spec
//
// Taken from the prototype. "parts" are the pieces of the design that
// must be present, by the prototype's own class names. "says" are words
// that must appear. "does" are controls that must exist and be wired to
// something.

const PUBLIC = [
  {
    path: "/", name: "Home",
    parts: [".pubhead", ".hero", ".hero h1", ".preview", ".layers", ".across", ".vcard", ".story", ".band", ".pubfoot", ".ft-cols"],
    says: ["Your business needs a village too", "It takes a village", "Big enough to open doors", "What members do here", "Ready to find your Village"],
    does: [{ label: "Request your invitation", goes: "/apply" }, { label: "Find your Village", goes: "/villages" }],
  },
  {
    path: "/discover", name: "Discover",
    parts: [".dhero", ".dsearch", ".dpill", ".dsec", ".dgrid", ".dcard", ".dband"],
    says: ["there is a Village for you", "Featured", "Villages"],
    does: [{ label: "Villages", goes: "/discover" }],
  },
  {
    path: "/how-it-works", name: "How it works",
    parts: [".nest-1", ".nest-2", ".nest-3", ".jpath", ".jp-num", ".panel"],
    says: ["How ExpatPreneurs works", "Industry Groups", "Pods", "Where things happen", "From invitation to your Circle"],
    does: [{ label: "Request your invitation", goes: "/apply" }, { label: "See membership", goes: "/membership" }],
  },
  {
    path: "/membership", name: "Membership",
    parts: [".plans", ".plan2", ".p2-best", ".p2-ribbon", ".p2-list", ".faq", ".ticks"],
    says: ["Membership", "By application", "Paid member", "What we expect from members", "Questions"],
    does: [{ label: "Request your invitation", goes: "/apply" }],
  },
  {
    path: "/villages", name: "Villages",
    parts: [".fchip", ".vcard", ".vphoto", ".vbody", ".panel-wash"],
    says: ["Find your Village", "No Village in your city yet", "Suggest your city"],
    does: [{ label: "Suggest your city", goes: "/villages/suggest" }],
  },
  {
    path: "/villages/dubai", name: "A Village page",
    parts: [".sec", ".panel"],
    says: ["Village", "invitation"],
    does: [],
  },
  {
    path: "/villages/suggest", name: "Suggest a city",
    parts: ["form", "input[name=city]", "input[name=country]"],
    says: ["city", "Village"],
    does: [],
  },
  {
    path: "/events", name: "Events",
    parts: [".pubsec", ".divide, .panel-wash"],
    says: ["Events"],
    does: [],
  },
  {
    path: "/businesses", name: "Businesses",
    parts: [".fchip, .panel-wash"],
    says: ["Businesses"],
    does: [],
  },
  {
    path: "/learning", name: "Learning",
    parts: [".fchip, .panel-wash", ".panel-wash"],
    says: ["Learning", "Teach in the network"],
    does: [],
  },
  {
    path: "/media", name: "Media", parts: [".sec, .pubsec"], says: ["Media"], does: [],
  },
  {
    path: "/watch", name: "Watch and Listen", parts: [".sec, .pubsec"], says: ["Watch"], does: [],
  },
  {
    path: "/members", name: "Members", parts: [".sec, .pubsec"], says: ["Members"], does: [],
  },
  {
    path: "/contact", name: "Contact",
    parts: [".tabs", "form", "input[name=full_name]", "input[name=email]", "textarea[name=message]"],
    says: ["Contact us", "General", "Partnerships", "Press"],
    does: [],
  },
  {
    path: "/apply", name: "Request an invitation",
    parts: ["form", "input[name=full_name], input[name=first_name]", "input[name=email]", "select[name=industry]", "select[name=stage]", "textarea[name=why_join]", "input[name=conduct]"],
    says: ["Countries you have lived in", "biggest challenge", "resonate", "give back", "code of conduct"],
    does: [],
  },
  { path: "/apply/status", name: "Invitation status", parts: ["form, .panel"], says: ["invitation"], does: [] },
  { path: "/login", name: "Log in", parts: ["form", "input[name=email]"], says: ["Log in"], does: [] },
  { path: "/legal/privacy", name: "Privacy", parts: [".tabs"], says: ["Privacy", "Terms", "Cookies"], does: [] },
  { path: "/legal/cookies", name: "Cookies", parts: [".tabs"], says: ["Cookies"], does: [] },
  { path: "/menu", name: "Menu", parts: [".divide, .menu"], says: ["Membership"], does: [] },
  { path: "/nothing-is-here", name: "The 404", parts: [".pubhead", ".pubfoot"], says: ["not here"], does: [] },
];

// Signed in. These are only checked if auth.json exists.
const MEMBER = [
  { path: "/home", name: "Member home", parts: [".mapp", ".rail", ".mside", ".mtop", ".feedlayout", ".fcompose"], says: ["Good"], does: [] },
  { path: "/my-village", name: "Ask and Offer", parts: [".mapp", ".tabs", ".fchip", ".gside"], says: ["Ask & Offer", "How Ask & Offer works"], does: [] },
  { path: "/my-village/circles", name: "Circles", parts: [".mapp", ".tabs", ".circlecard, .panel-wash"], says: ["Circles"], does: [] },
  { path: "/my-village/members", name: "Village members", parts: [".mapp", ".tabs", ".mcard, .g3"], says: ["Members"], does: [] },
  { path: "/my-village/announcements", name: "Announcements", parts: [".mapp", ".tabs"], says: ["Announce"], does: [] },
  { path: "/directory", name: "Directory", parts: [".mapp", ".mside"], says: ["Directory"], does: [] },
  { path: "/me", name: "My profile", parts: [".sp-cover", ".sp-card", ".sp-name", ".sp-tabs", ".sp-viewas"], says: ["As members see it"], does: [] },
  { path: "/events", name: "Events, signed in", parts: [".mapp", ".filters", ".evt, .panel-wash"], says: ["Events"], does: [] },
  { path: "/messages", name: "Messages", parts: [".mapp"], says: ["Messages"], does: [] },
  { path: "/notifications", name: "Notifications", parts: [".mapp"], says: ["Notifications"], does: [] },
  { path: "/settings", name: "Settings", parts: [".mapp", ".tabs", "form"], says: ["Settings"], does: [] },
  { path: "/library", name: "Resources", parts: [".mapp"], says: ["Resources"], does: [] },
  { path: "/groups", name: "Groups", parts: [".mapp"], says: ["Group"], does: [] },
  { path: "/pods", name: "Pods", parts: [".mapp"], says: ["Pods"], does: [] },
  { path: "/jobs", name: "Jobs", parts: [".mapp"], says: ["Jobs"], does: [] },
  { path: "/markets", name: "Market pathways", parts: [".mapp"], says: ["Market"], does: [] },
  { path: "/admin", name: "Local Admin overview", parts: [".mapp", ".rail", ".stat", ".task, .divide"], says: ["Village"], does: [] },
  { path: "/admin/members", name: "Admin members", parts: [".mapp", ".table, .panel-wash"], says: ["Members"], does: [] },
  { path: "/admin/applications", name: "Invitation requests", parts: [".mapp", ".tabs"], says: ["Invitation requests"], does: [] },
  { path: "/admin/mix", name: "Village mix", parts: [".mapp", ".mixrow, .panel"], says: ["Village mix", "Internal only"], does: [] },
  { path: "/global", name: "Global overview", parts: [".mapp", ".stat"], says: ["Global"], does: [] },
  { path: "/global/requests", name: "Requests", parts: [".mapp"], says: ["Requests"], does: [] },
  { path: "/educator", name: "Educator", parts: [".mapp"], says: ["teaching"], does: [] },
  { path: "/lead", name: "Leader tools", parts: [".mapp"], says: ["run"], does: [] },
];

// ------------------------------------------------------------- the checks

async function layoutFaults(page) {
  return await page.evaluate(() => {
    const faults = [];
    const doc = document.documentElement;

    // The page should not scroll sideways.
    if (doc.scrollWidth > doc.clientWidth + 2) {
      faults.push(`the page scrolls sideways by ${doc.scrollWidth - doc.clientWidth}px`);
    }

    // The header sits at the top and nothing should be hidden under it.
    const header = document.querySelector(".pubhead");
    if (header) {
      const hb = header.getBoundingClientRect();
      const main = document.querySelector(".mtop, .pubsec, .sec, .mbody");
      if (main) {
        const mb = main.getBoundingClientRect();
        if (mb.top < hb.bottom - 2 && mb.height > 0) {
          faults.push("content starts underneath the header");
        }
      }
    }

    // A panel with no height is a section that rendered but shows nothing.
    let empty = 0;
    document.querySelectorAll(".panel, .vcard, .dcard, .plan2, .stat").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height < 8) empty++;
    });
    if (empty) faults.push(`${empty} panels have no height`);

    // Text spilling out of its box.
    let spill = 0;
    document.querySelectorAll(".panel, .vcard, .plan2, .li, .stat").forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 4) spill++;
    });
    if (spill) faults.push(`${spill} boxes have content wider than themselves`);

    // The stylesheet did not arrive.
    const body = getComputedStyle(document.body);
    if (!body.fontFamily.toLowerCase().includes("inter")) {
      faults.push("the Inter typeface is not applied, so the stylesheet may not have loaded");
    }

    // Something is invisible on its own background.
    let invisible = 0;
    document.querySelectorAll("h1, h2, h3, p, a, button").forEach((el) => {
      const s = getComputedStyle(el);
      if (s.color === s.backgroundColor && s.backgroundColor !== "rgba(0, 0, 0, 0)") invisible++;
    });
    if (invisible) faults.push(`${invisible} elements have text the same colour as their background`);

    return faults;
  });
}

async function checkOne(context, spec, signedIn) {
  const page = await context.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160)); });
  page.on("requestfailed", (r) => failed.push(`${r.method()} ${r.url().slice(0, 120)}`));
  page.on("response", (r) => { if (r.status() >= 500) failed.push(`${r.status()} ${r.url().slice(0, 120)}`); });

  const row = {
    name: spec.name, path: spec.path, signedIn,
    status: 0, landedOn: "", missingParts: [], missingWords: [],
    deadControls: [], layout: [], console: [], network: [],
    redirects: [], matched: "", cache: "",
  };

  let response;
  try {
    response = await page.goto(BASE + spec.path, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Give it a moment to settle, but carry on if it never goes quiet.
    try { await page.waitForLoadState("networkidle", { timeout: 6000 }); } catch { }
  } catch (e) {
    row.status = -1;
    row.layout.push("the page did not finish loading: " + String(e).slice(0, 120));
    await page.close();
    return row;
  }

  row.status = response ? response.status() : 0;
  row.landedOn = new URL(page.url()).pathname + new URL(page.url()).search;

  // Where it was sent, and by what. A redirect chain names the culprit.
  if (response) {
    const chain = [];
    let req = response.request().redirectedFrom();
    while (req) {
      const r = await req.response();
      chain.unshift(`${r ? r.status() : "?"} ${new URL(req.url()).pathname}`);
      req = req.redirectedFrom();
    }
    row.redirects = chain;
    try {
      const h = response.headers();
      row.matched = h["x-matched-path"] || "";
      row.cache = h["x-vercel-cache"] || "";
    } catch { }
  }

  const html = await page.content();
  const text = (await page.evaluate(() => document.body.innerText)) || "";

  for (const sel of spec.parts) {
    const n = await page.locator(sel).count();
    if (n === 0) row.missingParts.push(sel);
  }
  for (const word of spec.says) {
    if (!text.toLowerCase().includes(word.toLowerCase())) row.missingWords.push(word);
  }

  // Does the control exist, and does it lead where it should?
  for (const control of spec.does || []) {
    const link = page.getByRole("link", { name: control.label, exact: false }).first();
    if ((await link.count()) === 0) {
      row.deadControls.push(`${control.label}: not on the page`);
      continue;
    }
    const href = await link.getAttribute("href");
    if (control.goes && href && !href.startsWith(control.goes)) {
      row.deadControls.push(`${control.label}: goes to ${href}, expected ${control.goes}`);
    }
  }

  // Every form should have somewhere to send itself.
  const formCount = await page.locator("form").count();
  for (let i = 0; i < formCount; i++) {
    const f = page.locator("form").nth(i);
    const action = await f.getAttribute("action");
    const hasSubmit = (await f.locator('button[type=submit], button:not([type]), input[type=submit]').count()) > 0;
    if (!hasSubmit) row.deadControls.push(`a form on this page has no button to send it`);
    if (action === null && !hasSubmit) row.deadControls.push(`a form on this page does nothing`);
  }

  row.layout = await layoutFaults(page);
  row.console = consoleErrors.slice(0, 5);
  row.network = failed.slice(0, 5);

  const shot = path.join(SHOTS, (signedIn ? "in" : "out") + spec.path.replace(/\//g, "_") + ".png");
  await page.screenshot({ path: shot, fullPage: true });
  await page.close();
  return row;
}

// Every link in the header and footer, clicked.
async function checkNavigation(context) {
  const page = await context.newPage();
  try {
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch {
    await page.close();
    return [];
  }
  const links = await page.evaluate(() =>
    [...document.querySelectorAll(".pubhead a[href^='/'], .pubfoot a[href^='/']")]
      .map((a) => ({ href: a.getAttribute("href"), label: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 40) }))
  );
  const seen = new Set();
  const rows = [];
  for (const link of links) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    let status = 0, landed = "";
    try {
      const r = await page.goto(BASE + link.href, { waitUntil: "domcontentloaded", timeout: 25000 });
      status = r ? r.status() : 0;
      landed = new URL(page.url()).pathname;
    } catch { status = -1; }
    rows.push({ label: link.label, href: link.href, status, landed });
  }
  await page.close();
  return rows;
}

// A line you can read without opening the report.
function verdict(row) {
  const said = [];
  if (row.status === -1) said.push("did not load");
  else if (row.status !== 200) said.push(`${row.status} to ${row.landedOn}`);
  else if (!row.landedOn.startsWith(row.path)) said.push(`sent to ${row.landedOn}`);
  if (row.missingParts.length) said.push(`${row.missingParts.length} parts missing`);
  if (row.missingWords.length) said.push(`${row.missingWords.length} words missing`);
  if (row.deadControls.length) said.push(`${row.deadControls.length} controls`);
  if (row.layout.length) said.push(row.layout[0]);
  if (row.console.length) said.push(`${row.console.length} console errors`);
  return said.length ? said.join(", ") : "ok";
}

// ------------------------------------------------------------------- run

async function signIn() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(BASE + "/login");
  console.log("\nA browser has opened. Sign in there however you normally do.");
  console.log("When you can see your own home page, come back here and press Enter.\n");
  await new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("", () => { rl.close(); resolve(); });
  });
  await context.storageState({ path: "auth.json" });
  await browser.close();
  console.log("Saved to auth.json. Now run: node audit.mjs");
}

function write(rows, nav, version) {
  const out = [];
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  out.push("# What the live site is actually doing", "");
  out.push(`${BASE}, opened in a real browser on ${stamp}.`, "");
  out.push("Every line below is what the browser saw. Nothing is read from");
  out.push("the code.", "");

  out.push("## Which build is this");
  out.push("");
  if (version && version.commit) {
    out.push(`Commit \`${version.commit.slice(0, 8)}\` on \`${version.ref}\`, built ${version.builtAt}.`);
    if (version.message) out.push("", `Its message: ${version.message}`);
  } else {
    out.push("The site could not say. Either /api/version is not deployed yet,");
    out.push("which means this build predates it, or it failed.");
  }
  out.push("");

  const broke = rows.filter((r) => r.status !== 200 || r.landedOn !== r.path);
  out.push("## Pages that did not open where they should");
  out.push("");
  if (broke.length) {
    out.push("| Page | Asked for | Came back | Landed on |", "| --- | --- | --- | --- |");
    for (const r of broke) out.push(`| ${r.name}${r.signedIn ? " (signed in)" : ""} | \`${r.path}\` | ${r.status} | \`${r.landedOn}\` |`);
  } else out.push("None.");
  out.push("");

  out.push("## Where the redirects went");
  out.push("");
  const sent = rows.filter((r) => (r.redirects && r.redirects.length) || (r.status === 200 && !r.landedOn.startsWith(r.path)));
  if (sent.length) {
    out.push("| Asked for | Chain | Ended on | Next matched | Cache |", "| --- | --- | --- | --- | --- |");
    for (const r of sent) {
      out.push(`| \`${r.path}\` | ${(r.redirects || []).join(" -> ") || "none"} | \`${r.landedOn}\` | \`${r.matched}\` | ${r.cache} |`);
    }
    out.push("");
    out.push("The matched path is what Next decided the address was. If it is");
    out.push("not the address that was asked for, the routing is the problem");
    out.push("rather than the page.");
  } else out.push("Nothing redirected.");
  out.push("");

  out.push("## Parts of the design that are not on the page");
  out.push("");
  const missing = rows.filter((r) => r.missingParts.length);
  if (missing.length) {
    for (const r of missing) {
      out.push(`### ${r.name}${r.signedIn ? " (signed in)" : ""}`);
      out.push(`\`${r.path}\`. Not found: \`${r.missingParts.join("`, `")}\`.`, "");
    }
  } else out.push("None. Every page had every part the prototype specifies.");
  out.push("");

  out.push("## Wording the prototype has and the page does not");
  out.push("");
  const words = rows.filter((r) => r.missingWords.length);
  if (words.length) {
    for (const r of words) out.push(`- **${r.name}** \`${r.path}\`: ${r.missingWords.join("; ")}`);
  } else out.push("None.");
  out.push("");

  out.push("## Controls that do nothing, or go somewhere else");
  out.push("");
  const dead = rows.filter((r) => r.deadControls.length);
  if (dead.length) {
    for (const r of dead) out.push(`- **${r.name}** \`${r.path}\`: ${r.deadControls.join("; ")}`);
  } else out.push("None.");
  out.push("");

  out.push("## Layout faults");
  out.push("");
  const broken = rows.filter((r) => r.layout.length);
  if (broken.length) {
    for (const r of broken) out.push(`- **${r.name}** \`${r.path}\`: ${r.layout.join("; ")}`);
  } else out.push("None. No sideways scrolling, nothing under the header, nothing collapsed.");
  out.push("");

  out.push("## Errors underneath");
  out.push("");
  const errs = rows.filter((r) => r.console.length || r.network.length);
  if (errs.length) {
    for (const r of errs) {
      out.push(`### ${r.name} \`${r.path}\``);
      for (const c of r.console) out.push(`- console: ${c}`);
      for (const n of r.network) out.push(`- request: ${n}`);
      out.push("");
    }
  } else out.push("None.");
  out.push("");

  out.push("## The header and footer, link by link");
  out.push("");
  out.push("| Link | Address | Came back | Landed on |", "| --- | --- | --- | --- |");
  for (const n of nav) out.push(`| ${n.label} | \`${n.href}\` | ${n.status} | \`${n.landed}\` |`);
  out.push("");

  out.push("## Every page checked");
  out.push("");
  out.push("| Page | Address | Signed in | Status | Parts missing | Words missing | Layout |", "| --- | --- | --- | --- | --- | --- | --- |");
  for (const r of rows) {
    out.push(`| ${r.name} | \`${r.path}\` | ${r.signedIn ? "yes" : "no"} | ${r.status} | ${r.missingParts.length} | ${r.missingWords.length} | ${r.layout.length} |`);
  }
  out.push("");
  out.push(`Screenshots of all of them are in \`${SHOTS}\`.`, "");

  fs.writeFileSync("audit-report.md", out.join("\n"), "utf8");
}

async function main() {
  if (args.includes("--login")) return signIn();
  process.on("unhandledRejection", (e) => {
    console.log("\nSomething threw: " + String(e).slice(0, 160));
  });

  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();

  let version = null;
  try {
    const page = await (await browser.newContext()).newPage();
    const r = await page.goto(BASE + "/api/version", { timeout: 20000 });
    if (r && r.status() === 200) version = await r.json();
    await page.close();
  } catch { }

  const rows = [];

  console.log(`\nSigned out, at ${BASE}\n`);
  const out = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  for (const spec of PUBLIC) {
    const row = await checkOne(out, spec, false);
    rows.push(row);
    console.log(`  ${row.name.padEnd(26)} ${verdict(row)}`);
  }
  let nav = [];
  try { nav = await checkNavigation(out); }
  catch (e) { console.log("  navigation check stopped: " + String(e).slice(0, 80)); }
  await out.close();

  if (fs.existsSync("auth.json")) {
    console.log("\nSigned in\n");
    const inC = await browser.newContext({ storageState: "auth.json", viewport: { width: 1360, height: 900 } });
    for (const spec of MEMBER) {
      const row = await checkOne(inC, spec, true);
      rows.push(row);
      console.log(`  ${row.name.padEnd(26)} ${verdict(row)}`);
    }
    await inC.close();
  } else {
    console.log("\nNo auth.json, so the member side was skipped.");
    console.log("Run: node audit.mjs --login\n");
  }

  await browser.close();
  write(rows, nav, version);

  const bad = rows.filter((r) => r.status !== 200 || r.landedOn !== r.path).length;
  console.log(`\nWritten: audit-report.md, and screenshots in ${SHOTS}`);
  console.log(`Pages checked: ${rows.length}. Did not open properly: ${bad}.`);
}

main();