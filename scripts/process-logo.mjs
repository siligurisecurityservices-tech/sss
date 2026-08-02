/**
 * scripts/process-logo.mjs
 * Removes the white background from the SSS logo PNG using flood-fill from the
 * four corners, then outputs all required sizes for the website + PWA.
 *
 * Usage:  node scripts/process-logo.mjs
 * Reads:  C:/Users/punee/Downloads/sss logo.png   (or override via CLI arg)
 * Writes: src/assets/images/real/logo*.png  +  assets/images/*.png  (PWA icons)
 */

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SRC = process.argv[2] ?? "C:/Users/punee/Downloads/sss logo.png";
const REAL_DIR = path.join(ROOT, "src/assets/images/real");
const STATIC_DIR = path.join(ROOT, "assets/images");

fs.mkdirSync(REAL_DIR, { recursive: true });
fs.mkdirSync(STATIC_DIR, { recursive: true });

// ─── Flood-fill background removal ──────────────────────────────────────────
async function removeBg(inputPath, tolerance = 12) {
  const { data: raw, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const channels = 4; // RGBA after ensureAlpha
  const total = width * height;
  const rgba = Buffer.from(raw); // mutable copy

  function isWhitish(idx) {
    const i = idx * channels;
    return rgba[i] >= 255 - tolerance &&
           rgba[i + 1] >= 255 - tolerance &&
           rgba[i + 2] >= 255 - tolerance;
  }

  // BFS from all four corners
  const visited = new Uint8Array(total);
  const queue = [0, width - 1, (height - 1) * width, total - 1];

  let head = 0;
  const q = new Int32Array(total);
  let tail = 0;
  for (const seed of queue) {
    if (!visited[seed] && isWhitish(seed)) {
      q[tail++] = seed;
      visited[seed] = 1;
    }
  }

  while (head < tail) {
    const idx = q[head++];
    // Make pixel transparent
    rgba[idx * channels + 3] = 0;

    const x = idx % width;
    const y = (idx / width) | 0;
    const neighbors = [];
    if (x > 0) neighbors.push(idx - 1);
    if (x < width - 1) neighbors.push(idx + 1);
    if (y > 0) neighbors.push(idx - width);
    if (y < height - 1) neighbors.push(idx + width);

    for (const n of neighbors) {
      if (!visited[n] && isWhitish(n)) {
        visited[n] = 1;
        q[tail++] = n;
      }
    }
  }

  // Feather edges: pixels adjacent to a transparent pixel that are "near-white"
  // get partial transparency so the shield edge doesn't look aliased.
  for (let idx = 0; idx < total; idx++) {
    if (rgba[idx * channels + 3] === 0) continue; // already transparent
    const r = rgba[idx * channels];
    const g = rgba[idx * channels + 1];
    const b = rgba[idx * channels + 2];
    // Check if any neighbour is transparent
    const x = idx % width;
    const y = (idx / width) | 0;
    let hasTransparentNeighbour = false;
    if (x > 0 && rgba[(idx - 1) * channels + 3] === 0) hasTransparentNeighbour = true;
    if (x < width - 1 && rgba[(idx + 1) * channels + 3] === 0) hasTransparentNeighbour = true;
    if (y > 0 && rgba[(idx - width) * channels + 3] === 0) hasTransparentNeighbour = true;
    if (y < height - 1 && rgba[(idx + width) * channels + 3] === 0) hasTransparentNeighbour = true;

    if (hasTransparentNeighbour) {
      // Feather by whiteness: fully white → transparent; darker → opaque
      const whiteness = Math.min(r, g, b); // 0 = black (opaque), 255 = white (transparent)
      const alpha = Math.round(255 - (whiteness / 255) * 255);
      rgba[idx * channels + 3] = Math.min(rgba[idx * channels + 3], alpha);
    }
  }

  return sharp(rgba, { raw: { width, height, channels: 4 } }).png();
}

// ─── OG image: navy background + centred logo + tagline ─────────────────────
async function makeOgImage(logoPngBuffer, outPath) {
  const W = 1200, H = 630;
  // Dark navy background with subtle gradient-like effect using a flat colour
  const bg = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 10, g: 37, b: 64, alpha: 1 } },
  }).png().toBuffer();

  // Resize logo to fit left side
  const logoResized = await sharp(logoPngBuffer).resize(340, 340, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  // Compose: logo centred-left, text on right handled by SVG overlay
  const textSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800');
      </style>
    </defs>
    <!-- Accent red bar left of text -->
    <rect x="400" y="185" width="4" height="260" fill="#C0392B" rx="2"/>
    <!-- Tagline top -->
    <text x="425" y="240" font-family="Inter, Arial, sans-serif" font-size="22" fill="#C9A961" font-weight="600" letter-spacing="2">FULLY LICENSED · ISO 9001:2015</text>
    <!-- Company name -->
    <text x="425" y="305" font-family="Inter, Arial, sans-serif" font-size="42" fill="#FFFFFF" font-weight="800">Siliguri Security</text>
    <text x="425" y="358" font-family="Inter, Arial, sans-serif" font-size="42" fill="#FFFFFF" font-weight="800">Services Pvt. Ltd.</text>
    <!-- Sub-tagline -->
    <text x="425" y="410" font-family="Inter, Arial, sans-serif" font-size="22" fill="#A0B4C8">Security &amp; Housekeeping — Under One Roof</text>
    <!-- Bottom stats -->
    <text x="425" y="470" font-family="Inter, Arial, sans-serif" font-size="18" fill="#6B8AA0">450+ Personnel · 50+ Sites · North Bengal · Sikkim · Odisha</text>
    <!-- URL strip at bottom -->
    <rect x="0" y="590" width="${W}" height="40" fill="#0A1E33"/>
    <text x="${W / 2}" y="615" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" fill="#A0B4C8">www.siligurisisecurity.com · +91-95472-53232</text>
  </svg>`;

  await sharp(bg)
    .composite([
      { input: logoResized, left: 30, top: (H - 340) >> 1 },
      { input: Buffer.from(textSvg), blend: "over" },
    ])
    .jpeg({ quality: 92 })
    .toFile(outPath);

  console.log("✓ OG image →", outPath);
}

// ─── Main ────────────────────────────────────────────────────────────────────
console.log("→ Reading source:", SRC);

const transparent = await removeBg(SRC);
const transparentBuf = await transparent.toBuffer();

// 1. Full-size transparent PNG (used by eleventy-img shortcode)
const logoOut = path.join(REAL_DIR, "logo.png");
await sharp(transparentBuf).toFile(logoOut);
console.log("✓ Transparent logo →", logoOut);

// 2. Header/nav logo – 200px tall (wide enough for the shield)
const logoNavOut = path.join(REAL_DIR, "logo-nav.png");
await sharp(transparentBuf).resize({ height: 200, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(logoNavOut);
console.log("✓ Nav logo →", logoNavOut);

// 3. PWA icon 192×192
const logo192Out = path.join(STATIC_DIR, "logo-192.png");
await sharp(transparentBuf).resize(192, 192, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(logo192Out);
console.log("✓ PWA 192 →", logo192Out);

// 4. PWA icon 512×512
const logo512Out = path.join(STATIC_DIR, "logo-512.png");
await sharp(transparentBuf).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(logo512Out);
console.log("✓ PWA 512 →", logo512Out);

// 5. Maskable icon 192×192 (safe zone = inner 80% → 20% padding each side)
const logo192Maskable = path.join(STATIC_DIR, "logo-maskable.png");
const maskSize = 192;
const innerSize = Math.round(maskSize * 0.8);
const padding = Math.round((maskSize - innerSize) / 2);
const logoInner = await sharp(transparentBuf)
  .resize(innerSize, innerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({
  create: { width: maskSize, height: maskSize, channels: 4, background: { r: 10, g: 37, b: 64, alpha: 255 } },
})
  .composite([{ input: logoInner, left: padding, top: padding }])
  .png()
  .toFile(logo192Maskable);
console.log("✓ Maskable icon →", logo192Maskable);

// 6. Apple touch icon 180×180 (same approach as maskable but round-safe)
const appleTouchOut = path.join(STATIC_DIR, "apple-touch-icon.png");
const atInner = await sharp(transparentBuf).resize(148, 148, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: { r: 10, g: 37, b: 64, alpha: 255 } } })
  .composite([{ input: atInner, left: 16, top: 16 }])
  .png()
  .toFile(appleTouchOut);
console.log("✓ Apple touch icon →", appleTouchOut);

// 7. Favicon 32×32 (will need manual conversion to .ico but PNG works for modern browsers)
const favicon32Out = path.join(ROOT, "assets/images/favicon-32.png");
await sharp(transparentBuf)
  .resize(32, 32, { fit: "contain", background: { r: 10, g: 37, b: 64, alpha: 255 } })
  .png()
  .toFile(favicon32Out);
console.log("✓ Favicon 32 →", favicon32Out);

// 8. OG default image
const ogOut = path.join(STATIC_DIR, "og-default.jpg");
await makeOgImage(transparentBuf, ogOut);

console.log("\n✅ All logo assets generated.");
