const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const serverOnlyModules = [
  "node-pty",
  "simple-git",
  "express",
  "compression",
  "cookie-parser",
  "express-rate-limit",
  "helmet",
  "cloudflared",
  "@xterm/xterm",
  "@xterm/addon-fit",
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (serverOnlyModules.some((mod) => moduleName.startsWith(mod))) {
    return { type: "empty" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.assetExts = [
  ...config.resolver.assetExts,
  "ttf",
  "otf",
  "woff",
  "woff2",
];

module.exports = withNativeWind(config, { input: "./global.css" });
