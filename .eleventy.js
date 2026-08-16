const path = require("node:path");
const fs = require("node:fs");
const htmlmin = require("html-minifier-terser");
const Image = require("@11ty/eleventy-img");

// Resolve image source for a given key.
// Looks first under src/assets/images/real/<key>.{jpg,jpeg,png,webp,avif} (real photo)
// then falls back to src/assets/images/placeholders/<key>.svg (generated placeholder).
// Returns { absPath, urlPath } or null if nothing found.
function resolveImageByKey(key) {
  const realExts = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
  for (const ext of realExts) {
    const p = path.join(__dirname, "src/assets/images/real", `${key}${ext}`);
    if (fs.existsSync(p)) return { absPath: p, urlPath: `/assets/images/real/${key}${ext}`, isReal: true };
  }
  const svg = path.join(__dirname, "src/assets/images/placeholders", `${key}.svg`);
  if (fs.existsSync(svg)) return { absPath: svg, urlPath: `/assets/images/placeholders/${key}.svg`, isReal: false };
  return null;
}

function isSvg(p) {
  return /\.svg$/i.test(p);
}

// Build a <picture> tag (or <img> for SVG) with eleventy-img.
async function renderPicture({ key, alt, sizes, classes, placeholder, hero, width, height }) {
  if (!key) {
    return `<!-- picture: missing key -->`;
  }
  const resolved = resolveImageByKey(key);
  if (!resolved) {
    return `<div class="img-missing" role="img" aria-label="${alt || key}">No image source found for "${key}". Generate with: npm run placeholders</div>`;
  }
  const eager = hero || (classes && /\bhero\b/.test(classes));
  // Real photos disable the "placeholder" badge regardless of the JSON flag.
  const showBadge = placeholder && !resolved.isReal;

  // SVGs are inlined as-is (no eleventy-img processing).
  if (isSvg(resolved.absPath)) {
    const wrapperOpen = showBadge ? `<span class="img-wrap${classes ? " " + classes : ""}">` : "";
    const wrapperClose = showBadge ? `<span class="img-placeholder-badge" aria-hidden="true">STOCK · REPLACE</span></span>` : "";
    const w = width || 1200;
    const h = height || 630;
    const safeAlt = (alt || key).replace(/"/g, "&quot;");
    return `${wrapperOpen}<img src="${resolved.urlPath}" alt="${safeAlt}" width="${w}" height="${h}" loading="${eager ? "eager" : "lazy"}" decoding="async"${classes && !showBadge ? ` class="${classes}"` : ""}${eager ? ` fetchpriority="high"` : ""}>${wrapperClose}`;
  }

  const metadata = await Image(resolved.absPath, {
    widths: [400, 800, 1200, 1600],
    formats: ["avif", "webp", "jpeg"],
    urlPath: "/assets/images/_optimized/",
    outputDir: path.join(__dirname, "_site/assets/images/_optimized/"),
    sharpJpegOptions: { quality: 80, progressive: true },
    sharpWebpOptions: { quality: 78 },
    sharpAvifOptions: { quality: 60 },
  });

  const sizesAttr = sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px";
  const imageAttributes = {
    alt: alt || key,
    sizes: sizesAttr,
    loading: eager ? "eager" : "lazy",
    decoding: "async",
  };
  if (eager) imageAttributes.fetchpriority = "high";
  if (classes && !showBadge) imageAttributes.class = classes;

  const pictureHtml = Image.generateHTML(metadata, imageAttributes, {
    whitespaceMode: "inline",
  });

  if (showBadge) {
    return `<span class="img-wrap${classes ? " " + classes : ""}">${pictureHtml}<span class="img-placeholder-badge" aria-hidden="true">STOCK · REPLACE</span></span>`;
  }
  return pictureHtml;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets/images": "assets/images" });
  eleventyConfig.addPassthroughCopy({ "static/manifest.json": "manifest.json" });
  eleventyConfig.addPassthroughCopy({ "static/sw.js": "sw.js" });
  eleventyConfig.addPassthroughCopy({ "static/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "static/.well-known": ".well-known" });
  eleventyConfig.addPassthroughCopy({ "static/docs": "assets/docs" });
  eleventyConfig.addPassthroughCopy({ "static/llms.txt": "llms.txt" });

  eleventyConfig.addWatchTarget("./assets/css/");
  eleventyConfig.addWatchTarget("./assets/js/");
  eleventyConfig.addWatchTarget("./src/assets/images/");

  eleventyConfig.addCollection("services", (api) =>
    api.getFilteredByGlob("src/services/*.njk").sort((a, b) => (a.data.order || 99) - (b.data.order || 99))
  );
  eleventyConfig.addCollection("locations", (api) =>
    api.getFilteredByGlob("src/locations/*.njk").sort((a, b) => (a.data.order || 99) - (b.data.order || 99))
  );
  eleventyConfig.addCollection("blog", (api) =>
    api.getFilteredByGlob("src/blog/*.md").sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString());
  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
  );
  eleventyConfig.addFilter("year", () => new Date().getFullYear());
  eleventyConfig.addFilter("jsonify", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("slug", (s) =>
    String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );

  // {% picture "key" %}  resolves src/assets/images/real/<key>.{jpg,png,webp} if it
  // exists, otherwise src/assets/images/placeholders/<key>.svg. Alt text + placeholder
  // flag come from src/_data/images.json.
  // {% picture "hero-home", "(max-width: 640px) 100vw, 50vw", "extra-class" %}
  eleventyConfig.addAsyncShortcode("picture", async function (key, sizes, classes) {
    const data = this.ctx && this.ctx.images ? this.ctx.images : {};
    const meta = (data.catalog && data.catalog[key]) || {};
    return renderPicture({
      key,
      alt: meta.alt || key || "",
      sizes,
      classes,
      placeholder: !!meta.placeholder,
      hero: false,
      width: meta.width,
      height: meta.height,
    });
  });

  eleventyConfig.addAsyncShortcode("pictureHero", async function (key, sizes, classes) {
    const data = this.ctx && this.ctx.images ? this.ctx.images : {};
    const meta = (data.catalog && data.catalog[key]) || {};
    return renderPicture({
      key,
      alt: meta.alt || key || "",
      sizes: sizes || "100vw",
      classes: classes ? `${classes} hero-img` : "hero-img",
      placeholder: !!meta.placeholder,
      hero: true,
      width: meta.width,
      height: meta.height,
    });
  });

  if (process.env.ELEVENTY_RUN_MODE === "build") {
    eleventyConfig.addTransform("htmlmin", function (content) {
      if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
        return htmlmin.minify(content, {
          useShortDoctype: true,
          removeComments: true,
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        });
      }
      return content;
    });
  }

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html", "11ty.js"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
