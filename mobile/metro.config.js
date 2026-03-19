const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Allow importing from ../shared (workspace sibling)
config.watchFolders = [path.resolve(__dirname, "../shared")];

// Make sure Metro can resolve the shared package
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
