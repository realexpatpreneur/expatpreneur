// Save what the browser actually built, for every page on the list.
//
// Waits for the document rather than for the network to fall silent,
// because a page carrying a captcha never falls silent. Checks the
// session first, so a dead auth.json costs one page rather than the
// whole run. Retries anything that fails, once, with more room.

import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const BASE = process.env.AUDIT_BASE || "https://expatpreneur.vercel.app";
const OUT = "live-pages";

const paths = JSON.parse(await readFile("tools/page-list.json", "utf8"));
console.log(`${paths.length} addresses on the list`);

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const viewport = { width: 1360, height: 900 };
const signedOut = await browser.newContext({ viewport });
const signedIn = existsSync("auth.json")
  ? await browser.newContext({ storageState: "auth.json", viewport })
  : null;

// Is the saved session still alive? One page tells us.
let sessionOK = false;
if (signedIn) {
  const probe = await signedIn.newPage();
  try {
    await probe.goto(BASE + "/home", { waitUntil: "domcontentloaded", timeout: 30000 });
    sessionOK = new URL(probe.url()).pathname === "/home";
  } catch {}
  await probe.close();
}

if (signedIn && !sessionOK) {
  await browser.close();
  console.log("");
  console.log("  The saved session has expired, so the signed in pass would");
  console.log("  record 135 login pages. Stopping before it wastes your time.");
  console.log("");
  console.log("  Run this, sign in, press Enter, then run the script again:");
  console.log("      node audit.mjs --login");
  console.log("");
  process.exit(1);
}

const name = (who, p) => `${who}${p === "/" ? "_root" : p.replace(/[/?=&]/g, "_")}.html`;

async function grab(page, who, p, timeout) {
  const res = await page.goto(BASE + p, { waitUntil: "domcontentloaded", timeout });
  // Let a client component or two finish, without waiting on a widget
  // that never stops talking.
  await page.waitForTimeout(1200);
  const html = await page.content();
  const landed = new URL(page.url()).pathname;
  const header = `<!-- asked for ${p} | landed on ${landed} | status ${res ? res.status() : "?"} | ${who} -->\n`;
  await writeFile(`${OUT}/${name(who, p)}`, header + html);
  return landed;
}

let saved = 0, failed = 0, bounced = 0;
const stillFailing = [];

for (const [who, context] of [["out", signedOut], ["in", signedIn]]) {
  if (!context) continue;
  const page = await context.newPage();
  for (const p of paths) {
    let landed = null;
    try {
      landed = await grab(page, who, p, 30000);
    } catch {
      try {
        landed = await grab(page, who, p, 60000);   // one retry, more room
      } catch (err) {
        failed++;
        stillFailing.push(`${who} ${p}: ${err.message.split("\n")[0]}`);
        await writeFile(`${OUT}/${name(who, p)}`, `<!-- FAILED ${p}: ${err.message} -->`);
        process.stdout.write("x");
        continue;
      }
    }
    if (who === "in" && landed && landed.startsWith("/login")) bounced++;
    saved++;
    process.stdout.write(".");
  }
  await page.close();
  console.log("");
}

await browser.close();
console.log(`\nSaved ${saved}, failed ${failed}.`);
if (bounced) console.log(`${bounced} signed in pages still landed on the login page.`);
if (stillFailing.length) {
  console.log("\nStill failing after a retry:");
  for (const line of stillFailing) console.log("  " + line);
}