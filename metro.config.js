// Metro config: treat the bundled SQLite database as an asset (not JS).
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("db");

module.exports = config;
