// Per-paginated-page computed data for src/locations.njk.
// YAML eleventyComputed doesn't re-render Nunjucks inside arrays of objects per
// pagination iteration, so we compute breadcrumbs as a JS function here. The
// title and description in the .njk front matter work fine because they are
// top-level strings.
module.exports = {
  eleventyComputed: {
    breadcrumbs: (data) => {
      const loc = data.location;
      if (!loc) return undefined;
      return [
        { label: "Home", url: "/" },
        { label: "Locations", url: "/pages/locations/" },
        { label: `${loc.name}, ${loc.state}`, url: `/locations/${loc.slug}/` },
      ];
    },
  },
};
