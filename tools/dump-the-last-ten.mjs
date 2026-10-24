import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const BASE = process.env.AUDIT_BASE || "https://expatpreneur.vercel.app";
const OUT = "live-pages";

const paths = [
  "/me/edit", "/media", "/media/subscribed", "/media/suggest", "/members",
  "/membership", "/menu", "/messages", "/more", "/my-circle",
];

if (!existsSync("auth.json")) {
  console.log("No auth.json. Run: node audit.mjs --login");
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: "auth.json",
  viewport: { width: 1360, height: 900 },
});

const name = (p) => `in${p.replace(/[/?=&]/g, "_")}.html`;

let saved = 0, failed = 0;
for (const p of paths) {
  // A fresh page each time, so one failure cannot poison the next.
  const page = await context.newPage();
  try {
    try {
      await page.goto(BASE + p, { waitUntil: "domcontentloaded", timeout: 45000 });
    } catch (err) {
      // A redirect arriving mid navigation is not a failure. Follow it.
      if (!/interrupted by another navigation/i.test(err.message)) throw err;
      await page.waitForLoadState("domcontentloaded", { timeout: 45000 });
    }
    await page.waitForTimeout(1500);
    const html = await page.content();
    const landed = new URL(page.url()).pathname;
    const header = `<!-- asked for ${p} | landed on ${landed} | status 200 | in -->\n`;
    await writeFile(`${OUT}/${name(p)}`, header + html);
    console.log(`  ${p}  ->  ${landed}`);
    saved++;
  } catch (err) {
    console.log(`  ${p}  FAILED  ${err.message.split("\n")[0]}`);
    failed++;
  }
  await page.close();
}

await browser.close();
console.log(`\nSaved ${saved}, failed ${failed}.`);