const path = require("path");
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

// Add workspace packages to watch folders
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
config.watchFolders = [workspaceRoot];

// Configure resolver to handle workspace packages
const sharedPackagePath = path.resolve(workspaceRoot, "packages/shared/src");
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    "@openchamber/shared": sharedPackagePath,
  },
  sourceExts: [...(config.resolver?.sourceExts || []), "ts", "tsx"],
};

const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (serverOnlyModules.some((mod) => moduleName.startsWith(mod))) {
    return { type: "empty" };
  }

  // Handle @openchamber/shared workspace package
  if (moduleName === "@openchamber/shared") {
    return {
      type: "sourceFile",
      filePath: path.resolve(sharedPackagePath, "index.ts"),
    };
  }
  if (moduleName === "@openchamber/shared/themes") {
    return {
      type: "sourceFile",
      filePath: path.resolve(sharedPackagePath, "themes/index.ts"),
    };
  }
  if (moduleName === "@openchamber/shared/typography") {
    return {
      type: "sourceFile",
      filePath: path.resolve(sharedPackagePath, "typography/index.ts"),
    };
  }
  if (moduleName === "@openchamber/shared/spacing") {
    return {
      type: "sourceFile",
      filePath: path.resolve(sharedPackagePath, "spacing/index.ts"),
    };
  }
  if (moduleName === "@openchamber/shared/constants") {
    return {
      type: "sourceFile",
      filePath: path.resolve(sharedPackagePath, "constants/index.ts"),
    };
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
  cssEntryFile: "./src/styles/index.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
