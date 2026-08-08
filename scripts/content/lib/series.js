const SERIES = require("../../../content/series.json");

const seriesBySlug = new Map(SERIES.map(series => [series.slug, series]));

function getSeries(slug) {
  return typeof slug === "string"
    ? seriesBySlug.get(slug.trim()) ?? null
    : null;
}

function isKnownSeries(slug) {
  return Boolean(getSeries(slug));
}

module.exports = {
  SERIES,
  getSeries,
  isKnownSeries,
};
