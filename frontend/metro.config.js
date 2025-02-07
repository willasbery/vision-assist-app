const {
  withNativeWind
} = require("nativewind/metro");

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for long file paths
config.maxPathLength = 4096;

module.exports = withNativeWind(config, {
  input: "./global.css"
});