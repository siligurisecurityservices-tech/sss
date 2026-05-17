/**
 * scripts/process-photos.mjs
 * Crops the security/housekeeping collage into individual site images,
 * processes the hero image, and saves all to src/assets/images/real/.
 *
 * Collage layout (1536 × 1024):
 *   Top-left  (large)   : guard at corporate building entrance
 *   Top-right top       : guard at vehicle gate/barrier
 *   Top-right bottom    : housekeeping staff cleaning glass door
 *   Bottom-left         : security badge close-up
 *   Bottom-middle       : radio/walkie-talkie close-up
 *   Bottom-right        : CCTV camera
 *
 * Usage: node scripts/process-photos.mjs
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src/assets/images/real");
fs.mkdirSync(OUT, { recursive: true });

const COLLAGE = "C:/Users/punee/Downloads/join team images.png";
const HERO_SRC = "C:/Users/punee/Downloads/hero image.png";

// ─── Collage crop regions (1536 × 1024) ─────────────────────────────────────
// The collage has a ~4px gap between panels.
// Top row height ≈ 614px (60%), bottom row ≈ 410px (40%).
// Left column width ≈ 1000px (65%), right column ≈ 536px (35%).
const GAP = 4;
const TOP_H  = 614;
const BOT_H  = 1024 - TOP_H - GAP;      // 406
const L_W    = 1000;
const R_W    = 1536 - L_W - GAP;        // 532
const BOT_W  = Math.floor(1536 / 3);    // 512 per panel

const crops = [
  // ── Join-us collage images (3) ────────────────────────────────────────────
  {
    key: "join-us-collage-1",
    alt: "Uniformed security guard on post at a corporate building entrance, night shift",
    region: { left: 0,          top: 0,             width: L_W,  height: TOP_H },
    outW: 800, outH: 600,
  },
  {
    key: "join-us-collage-2",
    alt: "Security guard at vehicle gate/barrier controlling site access",
    region: { left: L_W + GAP,  top: 0,             width: R_W,  height: Math.floor(TOP_H / 2) - GAP },
    outW: 800, outH: 600,
  },
  {
    key: "join-us-collage-3",
    alt: "Professional housekeeping attendant cleaning glass door at a corporate lobby",
    region: { left: L_W + GAP,  top: Math.floor(TOP_H / 2), width: R_W, height: Math.ceil(TOP_H / 2) },
    outW: 800, outH: 600,
  },

  // ── Homepage gallery images (6) ───────────────────────────────────────────
  {
    key: "gallery-1",
    alt: "Security guard on duty at a corporate office entrance, nighttime",
    region: { left: 0,          top: 0,             width: L_W,  height: TOP_H },
    outW: 1200, outH: 800,
  },
  {
    key: "gallery-2",
    alt: "Guard controlling vehicle access at a boom barrier gate",
    region: { left: L_W + GAP,  top: 0,             width: R_W,  height: Math.floor(TOP_H / 2) - GAP },
    outW: 1200, outH: 800,
  },
  {
    key: "gallery-3",
    alt: "Housekeeping staff professionally cleaning a glass entrance door",
    region: { left: L_W + GAP,  top: Math.floor(TOP_H / 2), width: R_W, height: Math.ceil(TOP_H / 2) },
    outW: 1200, outH: 800,
  },
  {
    key: "gallery-4",
    alt: "Close-up of SECURITY badge on a guard's uniform — star insignia",
    region: { left: 0,          top: TOP_H + GAP,   width: BOT_W, height: BOT_H },
    outW: 1200, outH: 800,
  },
  {
    key: "gallery-5",
    alt: "Radio handset / walkie-talkie clipped to a security officer's uniform",
    region: { left: BOT_W,      top: TOP_H + GAP,   width: BOT_W, height: BOT_H },
    outW: 1200, outH: 800,
  },
  {
    key: "gallery-6",
    alt: "CCTV surveillance camera monitoring a well-lit corporate campus at night",
    region: { left: BOT_W * 2,  top: TOP_H + GAP,   width: BOT_W, height: BOT_H },
    outW: 1200, outH: 800,
  },
];

// ─── Process each crop ───────────────────────────────────────────────────────
for (const { key, alt, region, outW, outH } of crops) {
  const outPath = path.join(OUT, `${key}.jpg`);
  await sharp(COLLAGE)
    .extract(region)
    .resize(outW, outH, { fit: "cover", position: "attention" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(outPath);
  console.log(`✓ ${key}.jpg  (${outW}×${outH})  alt: "${alt}"`);
}

// ─── Hero image ─────────────────────────────────────────────────────────────
const heroOut = path.join(OUT, "hero-home.jpg");
await sharp(HERO_SRC)
  .resize(1600, 720, { fit: "cover", position: "attention" })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(heroOut);
console.log(`✓ hero-home.jpg  (1600×720)`);

// ─── Full collage as-is (optional use for og-default or careers hero) ────────
const collageOut = path.join(OUT, "careers-hero.jpg");
await sharp(COLLAGE)
  .resize(1600, 900, { fit: "cover", position: "attention" })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(collageOut);
console.log(`✓ careers-hero.jpg  (1600×900)`);

console.log("\n✅ All photos processed.");
