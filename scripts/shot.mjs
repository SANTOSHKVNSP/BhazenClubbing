// Screenshot helper. Usage: node scripts/shot.mjs <url> <outPath> [scrollSelector]
import puppeteer from "puppeteer-core";
const [, , url, out, sel] = process.argv;
const b = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
  defaultViewport: { width: 1100, height: 840 },
});
const p = await b.newPage();
await p.goto(url, { waitUntil: "networkidle2" });
if (sel) await p.evaluate((s) => document.querySelector(s)?.scrollIntoView(), sel);
await new Promise((r) => setTimeout(r, 1300));
await p.screenshot({ path: out });
await b.close();
console.log("shot", out);
