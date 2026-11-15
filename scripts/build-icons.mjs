// Builds every raster icon from the one drawing of the mark.
//
//   node scripts/build-icons.mjs
//
// Outputs: src/app/favicon.ico (16 + 32 + 48), src/app/apple-icon.png (180),
// public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png.
//
// The tab icon keeps the rounded tile. The Apple and maskable icons are
// full-bleed Meadow, because iOS and Android cut their own shape out of the
// square and a tile rounded twice shows a sliver of background in each corner.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const PEAK = `<path d="M9 49 26.5 17.5 37 36.5 43 27.5 55 49Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
<path d="M26.5 17.5 33.4 30 29.6 27.2 26.6 31.4 23.6 27.6 19.9 29.4Z" fill="#ff6a3d" stroke="#ff6a3d" stroke-width="2" stroke-linejoin="round"/>`;

const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#157a47"/>${PEAK}</svg>`;

/** Full-bleed square; `scale` shrinks the peak towards the centre. */
const bleed = (scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#157a47"/><g transform="translate(32 32) scale(${scale}) translate(-32 -33.5)">${PEAK}</g></svg>`;

const png = (svg, size) => sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png().toBuffer();

/** An .ico is a tiny directory in front of ordinary PNGs. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

const write = (file, data) => {
  fs.writeFileSync(path.join(root, file), data);
  console.log(`✓ ${file} (${data.length} bytes)`);
};

write(
  "src/app/favicon.ico",
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(tile, size) })))),
);
write("src/app/apple-icon.png", await png(bleed(0.92), 180));
write("public/icon-192.png", await png(tile, 192));
write("public/icon-512.png", await png(tile, 512));
// Android keeps only the middle ~80 %; the peak sits well inside it.
write("public/icon-maskable-512.png", await png(bleed(0.72), 512));
