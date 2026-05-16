// Per-paginated-page computed data for src/services.njk. See locations.11tydata.js.
module.exports = {
  eleventyComputed: {
    breadcrumbs: (data) => {
      const svc = data.service;
      if (!svc) return undefined;
      return [
        { label: "Home", url: "/" },
        { label: "Services", url: "/pages/services/" },
        { label: svc.title, url: `/services/${svc.slug}/` },
      ];
    },
  },
};
