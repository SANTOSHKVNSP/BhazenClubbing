// Build a multi-size favicon.ico from PNGs (zero deps).
// Usage: node scripts/make-favicon.mjs <out.ico> <png16> <png32> <png48> ...
// Embeds each PNG as an ICO entry (PNG-in-ICO is supported by all modern browsers).
import { readFileSync, writeFileSync } from "node:fs";

const [out, ...pngPaths] = process.argv.slice(2);
if (!out || pngPaths.length === 0) {
  console.error("usage: make-favicon.mjs <out.ico> <png...>");
  process.exit(1);
}
const pngs = pngPaths.map((p) => readFileSync(p));
const count = pngs.length;

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = icon
header.writeUInt16LE(count, 4);

let offset = 6 + count * 16;
const entries = pngs.map((png) => {
  const w = png.readUInt32BE(16); // PNG IHDR width
  const h = png.readUInt32BE(20); // PNG IHDR height
  const e = Buffer.alloc(16);
  e.writeUInt8(w >= 256 ? 0 : w, 0); // 0 means 256
  e.writeUInt8(h >= 256 ? 0 : h, 1);
  e.writeUInt8(0, 2); // color palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8); // size of PNG data
  e.writeUInt32LE(offset, 12); // offset of PNG data
  offset += png.length;
  return e;
});

writeFileSync(out, Buffer.concat([header, ...entries, ...pngs]));
console.log(`wrote ${out} (${count} sizes: ${pngs.map((p) => p.readUInt32BE(16)).join(", ")})`);
