// Browser-driven demo: log in as the super admin via real OTP, screenshot gated flows.
// Usage: node scripts/demo.mjs <serverLogPath> <baseUrl> <LIVE> <PENDING> <TICKET>
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "/private/tmp/claude-501/-Users-santosh-Development-aol-bhazenclubbing/698c863c-52a6-4605-a886-00897a63896f/scratchpad";
const [, , LOG, BASE, LIVE, PENDING, TICKET] = process.argv;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readOtp() {
  const txt = readFileSync(LOG, "utf8");
  const re = /\[DEV OTP\] \+919999999999\D+(\d{6})/g;
  let m, last = null;
  while ((m = re.exec(txt))) last = m[1];
  return last;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
  defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const shot = async (name, full = false) => { await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full }); console.log("shot", name); };

// --- Login as super admin (+91 99999 99999) via OTP ---
await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
await shot("demo-01-login");
await page.type('input[inputmode="tel"]', "9999999999");
await page.click('button[type="submit"]');
await page.waitForSelector('input[maxlength="6"]', { timeout: 10000 });
let code = null;
for (let i = 0; i < 25 && !code; i++) { await sleep(400); code = readOtp(); }
if (!code) throw new Error("OTP not found in server log");
await page.type('input[maxlength="6"]', code);
await page.click('button[type="submit"]');
await sleep(2500); // allow signIn + client redirect

const pages = [
  ["demo-02-admin-dashboard", "/admin", false],
  ["demo-03-analytics", "/admin/analytics", true],
  ["demo-04-events", "/admin/events", false],
  ["demo-05-event-editor", `/admin/events/${LIVE}`, true],
  ["demo-06-approval", `/admin/events/${PENDING}`, false],
  ["demo-07-orders", "/admin/orders", false],
  ["demo-08-audit", "/admin/audit", false],
  ["demo-09-account", "/account", false],
  ["demo-10-ticket", `/ticket/${TICKET}`, false],
];
for (const [name, url, full] of pages) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle2" });
  await sleep(700);
  await shot(name, full);
}

await browser.close();
console.log("DONE");
