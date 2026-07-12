// Measure the hero <section> height vs viewport. Usage: node scripts/measure.mjs <url> [w] [h]
import puppeteer from "puppeteer-core";
const [, , url, w = "1280", h = "800"] = process.argv;
const b = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--no-sandbox"],
  defaultViewport: { width: +w, height: +h },
});
const p = await b.newPage();
await p.goto(url, { waitUntil: "networkidle2" });
const r = await p.evaluate(() => {
  const s = document.querySelector("section");
  const hero = Math.round(s.getBoundingClientRect().height);
  return { hero, viewport: window.innerHeight, fitsOneScreen: hero <= window.innerHeight };
});
console.log(`${w}x${h} → ${JSON.stringify(r)}`);
await b.close();
