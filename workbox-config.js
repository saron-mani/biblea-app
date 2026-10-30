module.exports = {
  globDirectory: "dist",
  maximumFileSizeToCacheInBytes: 30000000,
  globPatterns: ["**/*.{html,ico,css,js,png,svg}"],
  swDest: "dist/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
};
