#!/usr/bin/env node
// Generate themed SVG placeholders for every key in src/_data/images.json.
// Each SVG is brand-coloured, carries a clear label of what the photo should be,
// and is sized to the dimensions declared in images.json.
//
// Usage:
//   node scripts/make-placeholders.mjs
// Re-runs are safe — existing SVGs are overwritten. If a real raster photo
// (.jpg/.png/.webp) exists at the destination path, that key is skipped so we
// don't clobber a real photo.

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { constants as fsConstants } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const ICONS = {
  hero: "🛡️",
  service: "👮",
  location: "📍",
  about: "🏢",
  director: "👔",
  collage: "📸",
  gallery: "📷",
  cert: "📜",
  default: "📸",
};

function iconFor(key) {
  if (key.startsWith("hero")) return ICONS.hero;
  if (key.startsWith("service-")) return ICONS.service;
  if (key.startsWith("location-")) return ICONS.location;
  if (key === "about-director") return ICONS.director;
  if (key.startsWith("about-")) return ICONS.about;
  if (key.startsWith("join-us")) return ICONS.collage;
  if (key.startsWith("gallery-")) return ICONS.gallery;
  if (key.endsWith("-cert")) return ICONS.cert;
  return ICONS.default;
}

function colourFor(key) {
  // Brand navy gradient by default; vary slightly per category for visual rhythm.
  if (key.endsWith("-cert")) return ["#f5f5f5", "#dadfe6", "#003366"];
  if (key.startsWith("location-")) return ["#1a5490", "#003366", "#ffffff"];
  if (key.startsWith("service-")) return ["#0052a3", "#003366", "#ffffff"];
  if (key.startsWith("hero")) return ["#003366", "#0052a3", "#ffffff"];
  if (key.startsWith("gallery-")) return ["#003366", "#1a5490", "#ffffff"];
  if (key.startsWith("join-us")) return ["#0052a3", "#003366", "#ffffff"];
  return ["#003366", "#0052a3", "#ffffff"];
}

function makeSvg(key, alt, width, height) {
  const [c1, c2] = colourFor(key);
  const icon = iconFor(key);
  const isCert = key.endsWith("-cert");
  const iconSize = Math.round(Math.min(width, height) * 0.22);
  const labelFontSize = Math.max(14, Math.min(22, Math.round(width / 50)));
  const centerX = width / 2;
  const centerY = height / 2;

  // Cert placeholders look paper-like with a discreet stamp; everything else is
  // a gradient with a single icon. The "REPLACE" badge is added in CSS, not SVG,
  // so the placeholder works as a background image without text bleed.
  if (isCert) {
    const labelLines = wrap(alt, 30).slice(0, 2);
    const textTspans = labelLines
      .map((line, i) => `<tspan x="${centerX}" dy="${i === 0 ? 0 : labelFontSize * 1.3}">${escape(line)}</tspan>`)
      .join("");
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escape(alt)}">
  <rect width="${width}" height="${height}" fill="${c1}"/>
  <rect x="${width * 0.06}" y="${height * 0.06}" width="${width * 0.88}" height="${height * 0.88}" rx="6" fill="#ffffff" stroke="${c2}" stroke-width="2"/>
  <text x="${centerX}" y="${centerY - 30}" font-size="${iconSize}" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <text x="${centerX}" y="${centerY + iconSize / 2 + 30}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${labelFontSize}" font-weight="700" fill="#003366" text-anchor="middle">
    ${textTspans}
  </text>
</svg>
`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escape(alt)}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g-${slugify(key)}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g-${slugify(key)})"/>
  <circle cx="${centerX}" cy="${centerY}" r="${iconSize * 1.1}" fill="rgba(255,255,255,0.08)"/>
  <text x="${centerX}" y="${centerY}" font-size="${iconSize}" text-anchor="middle" dominant-baseline="central">${icon}</text>
</svg>
`;
}

function wrap(s, max) {
  const words = String(s).split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > max) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

function escape(s) {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function exists(p) {
  try { await access(p, fsConstants.F_OK); return true; } catch { return false; }
}

async function main() {
  const data = JSON.parse(await readFile(path.join(root, "src/_data/images.json"), "utf8"));
  const outDir = path.join(root, "src/assets/images/placeholders");
  await mkdir(outDir, { recursive: true });

  let written = 0, skipped = 0;
  for (const [key, meta] of Object.entries(data.catalog || {})) {
    const w = meta.width || 1200;
    const h = meta.height || 630;
    const svgPath = path.join(outDir, `${key}.svg`);
    // If a real raster image with the same key already exists, do not overwrite.
    const realCandidates = [".jpg", ".jpeg", ".png", ".webp", ".avif"].map(e =>
      path.join(root, "src/assets/images/real", `${key}${e}`)
    );
    let hasReal = false;
    for (const c of realCandidates) {
      if (await exists(c)) { hasReal = true; break; }
    }
    if (hasReal) {
      skipped++;
      continue;
    }
    const svg = makeSvg(key, meta.alt || key, w, h);
    await writeFile(svgPath, svg, "utf8");
    written++;
  }
  console.log(`Placeholders: ${written} written, ${skipped} skipped (real photo exists).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
