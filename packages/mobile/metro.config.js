const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

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

const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (serverOnlyModules.some((mod) => moduleName.startsWith(mod))) {
    return { type: "empty" };
  }
  const resolver = originalResolveRequest ?? context.resolveRequest;
  return resolver(context, moduleName, platform);
};

config.resolver.assetExts = [
  ...config.resolver.assetExts,
  "ttf",
  "otf",
  "woff",
  "woff2",
];

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
