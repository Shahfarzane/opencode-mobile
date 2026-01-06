#!/usr/bin/env node
/**
 * Generate app icons and splash screen from the OpenChamber logo SVG
 * Run with: node scripts/generate-icons.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, "..", "assets");

// Design constants from SplashScreen.tsx
const TOP = { x: 50, y: 2 };
const LEFT = { x: 8.432, y: 26 };
const RIGHT = { x: 91.568, y: 26 };
const CENTER = { x: 50, y: 50 };
const BOTTOM_LEFT = { x: 8.432, y: 74 };
const BOTTOM_RIGHT = { x: 91.568, y: 74 };
const BOTTOM = { x: 50, y: 98 };

const ISO_MATRIX = "matrix(0.866, 0.5, -0.866, 0.5, 50, 26)";

// Left face grid cells
const LEFT_FACE_CELLS = [
  { path: "M50 50 L39.608 44 L39.608 56 L50 62 Z", opacity: 0.2 },
  { path: "M39.608 44 L29.216 38 L29.216 50 L39.608 56 Z", opacity: 0.45 },
  { path: "M29.216 38 L18.824 32 L18.824 44 L29.216 50 Z", opacity: 0.15 },
  { path: "M18.824 32 L8.432 26 L8.432 38 L18.824 44 Z", opacity: 0.55 },
  { path: "M50 62 L39.608 56 L39.608 68 L50 74 Z", opacity: 0.35 },
  { path: "M39.608 56 L29.216 50 L29.216 62 L39.608 68 Z", opacity: 0.1 },
  { path: "M29.216 50 L18.824 44 L18.824 56 L29.216 62 Z", opacity: 0.5 },
  { path: "M18.824 44 L8.432 38 L8.432 50 L18.824 56 Z", opacity: 0.25 },
  { path: "M50 74 L39.608 68 L39.608 80 L50 86 Z", opacity: 0.4 },
  { path: "M39.608 68 L29.216 62 L29.216 74 L39.608 80 Z", opacity: 0.3 },
  { path: "M29.216 62 L18.824 56 L18.824 68 L29.216 74 Z", opacity: 0.45 },
  { path: "M18.824 56 L8.432 50 L8.432 62 L18.824 68 Z", opacity: 0.15 },
  { path: "M50 86 L39.608 80 L39.608 92 L50 98 Z", opacity: 0.55 },
  { path: "M39.608 80 L29.216 74 L29.216 86 L39.608 92 Z", opacity: 0.2 },
  { path: "M29.216 74 L18.824 68 L18.824 80 L29.216 86 Z", opacity: 0.35 },
  { path: "M18.824 68 L8.432 62 L8.432 74 L18.824 80 Z", opacity: 0.1 },
];

// Right face grid cells
const RIGHT_FACE_CELLS = [
  { path: "M50 50 L60.392 44 L60.392 56 L50 62 Z", opacity: 0.3 },
  { path: "M60.392 44 L70.784 38 L70.784 50 L60.392 56 Z", opacity: 0.15 },
  { path: "M70.784 38 L81.176 32 L81.176 44 L70.784 50 Z", opacity: 0.45 },
  { path: "M81.176 32 L91.568 26 L91.568 38 L81.176 44 Z", opacity: 0.25 },
  { path: "M50 62 L60.392 56 L60.392 68 L50 74 Z", opacity: 0.5 },
  { path: "M60.392 56 L70.784 50 L70.784 62 L60.392 68 Z", opacity: 0.35 },
  { path: "M70.784 50 L81.176 44 L81.176 56 L70.784 62 Z", opacity: 0.1 },
  { path: "M81.176 44 L91.568 38 L91.568 50 L81.176 56 Z", opacity: 0.4 },
  { path: "M50 74 L60.392 68 L60.392 80 L50 86 Z", opacity: 0.2 },
  { path: "M60.392 68 L70.784 62 L70.784 74 L60.392 80 Z", opacity: 0.55 },
  { path: "M70.784 62 L81.176 56 L81.176 68 L70.784 74 Z", opacity: 0.3 },
  { path: "M81.176 56 L91.568 50 L91.568 62 L81.176 68 Z", opacity: 0.15 },
  { path: "M50 86 L60.392 80 L60.392 92 L50 98 Z", opacity: 0.45 },
  { path: "M60.392 80 L70.784 74 L70.784 86 L60.392 92 Z", opacity: 0.25 },
  { path: "M70.784 74 L81.176 68 L81.176 80 L70.784 86 Z", opacity: 0.4 },
  { path: "M81.176 68 L91.568 62 L91.568 74 L81.176 80 Z", opacity: 0.2 },
];

function generateSplashSVG(size = 1024, backgroundColor = "#100F0F") {
  const strokeColor = "white";
  const fillColor = "rgba(255,255,255,0.15)";
  const logoFillColor = "white";
  const cellHighlightColor = "rgba(255,255,255,0.35)";

  // Scale factor to center the 100x100 viewBox content in the larger canvas
  const logoSize = size * 0.35; // Logo takes up 35% of the canvas
  const offset = (size - logoSize) / 2;
  const scale = logoSize / 100;

  const leftFaceCells = LEFT_FACE_CELLS.map(
    (cell) =>
      `<path d="${cell.path}" fill="${cellHighlightColor}" opacity="${cell.opacity}"/>`
  ).join("\n      ");

  const rightFaceCells = RIGHT_FACE_CELLS.map(
    (cell) =>
      `<path d="${cell.path}" fill="${cellHighlightColor}" opacity="${cell.opacity}"/>`
  ).join("\n      ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>

  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <!-- Left face -->
    <path
      d="M${CENTER.x} ${CENTER.y} L${LEFT.x} ${LEFT.y} L${BOTTOM_LEFT.x} ${BOTTOM_LEFT.y} L${BOTTOM.x} ${BOTTOM.y} Z"
      fill="${fillColor}"
      stroke="${strokeColor}"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Left face grid cells -->
    <g>
      ${leftFaceCells}
    </g>

    <!-- Right face -->
    <path
      d="M${CENTER.x} ${CENTER.y} L${RIGHT.x} ${RIGHT.y} L${BOTTOM_RIGHT.x} ${BOTTOM_RIGHT.y} L${BOTTOM.x} ${BOTTOM.y} Z"
      fill="${fillColor}"
      stroke="${strokeColor}"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Right face grid cells -->
    <g>
      ${rightFaceCells}
    </g>

    <!-- Top face outline -->
    <path
      d="M${TOP.x} ${TOP.y} L${LEFT.x} ${LEFT.y} L${CENTER.x} ${CENTER.y} L${RIGHT.x} ${RIGHT.y} Z"
      fill="none"
      stroke="${strokeColor}"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Logo on top face (hollow square "O") -->
    <g transform="${ISO_MATRIX} scale(0.75)">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M-16 -20 L16 -20 L16 20 L-16 20 Z M-8 -12 L-8 12 L8 12 L8 -12 Z"
        fill="${logoFillColor}"
      />
      <path
        d="M-8 -4 L8 -4 L8 12 L-8 12 Z"
        fill="${logoFillColor}"
        fill-opacity="0.4"
      />
    </g>
  </g>
</svg>`;
}

function generateIconSVG(size = 1024, backgroundColor = "#100F0F") {
  const strokeColor = "white";
  const fillColor = "rgba(255,255,255,0.15)";
  const logoFillColor = "white";
  const cellHighlightColor = "rgba(255,255,255,0.35)";

  // For app icon, make the logo larger (50% of canvas)
  const logoSize = size * 0.55;
  const offset = (size - logoSize) / 2;
  const scale = logoSize / 100;

  const leftFaceCells = LEFT_FACE_CELLS.map(
    (cell) =>
      `<path d="${cell.path}" fill="${cellHighlightColor}" opacity="${cell.opacity}"/>`
  ).join("\n      ");

  const rightFaceCells = RIGHT_FACE_CELLS.map(
    (cell) =>
      `<path d="${cell.path}" fill="${cellHighlightColor}" opacity="${cell.opacity}"/>`
  ).join("\n      ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>

  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <!-- Left face -->
    <path
      d="M${CENTER.x} ${CENTER.y} L${LEFT.x} ${LEFT.y} L${BOTTOM_LEFT.x} ${BOTTOM_LEFT.y} L${BOTTOM.x} ${BOTTOM.y} Z"
      fill="${fillColor}"
      stroke="${strokeColor}"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Left face grid cells -->
    <g>
      ${leftFaceCells}
    </g>

    <!-- Right face -->
    <path
      d="M${CENTER.x} ${CENTER.y} L${RIGHT.x} ${RIGHT.y} L${BOTTOM_RIGHT.x} ${BOTTOM_RIGHT.y} L${BOTTOM.x} ${BOTTOM.y} Z"
      fill="${fillColor}"
      stroke="${strokeColor}"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Right face grid cells -->
    <g>
      ${rightFaceCells}
    </g>

    <!-- Top face outline -->
    <path
      d="M${TOP.x} ${TOP.y} L${LEFT.x} ${LEFT.y} L${CENTER.x} ${CENTER.y} L${RIGHT.x} ${RIGHT.y} Z"
      fill="none"
      stroke="${strokeColor}"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <!-- Logo on top face (hollow square "O") -->
    <g transform="${ISO_MATRIX} scale(0.75)">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M-16 -20 L16 -20 L16 20 L-16 20 Z M-8 -12 L-8 12 L8 12 L8 -12 Z"
        fill="${logoFillColor}"
      />
      <path
        d="M-8 -4 L8 -4 L8 12 L-8 12 Z"
        fill="${logoFillColor}"
        fill-opacity="0.4"
      />
    </g>
  </g>
</svg>`;
}

async function main() {
  console.log("Generating OpenChamber icons...\n");

  // Generate SVG files first
  const splashSvg = generateSplashSVG(1024);
  const iconSvg = generateIconSVG(1024);

  // Save SVG files
  writeFileSync(join(assetsDir, "splash-icon.svg"), splashSvg);
  writeFileSync(join(assetsDir, "icon.svg"), iconSvg);
  console.log("Created SVG files in assets/");

  // Try to convert to PNG using sharp
  try {
    const sharp = await import("sharp");

    // Generate splash icon PNG
    await sharp
      .default(Buffer.from(splashSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(assetsDir, "splash-icon.png"));
    console.log("Created splash-icon.png (1024x1024)");

    // Generate app icon PNG
    await sharp
      .default(Buffer.from(iconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(assetsDir, "icon.png"));
    console.log("Created icon.png (1024x1024)");

    // Generate adaptive icon (same as icon for now)
    await sharp
      .default(Buffer.from(iconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(assetsDir, "adaptive-icon.png"));
    console.log("Created adaptive-icon.png (1024x1024)");

    // Generate notification icon (smaller, simpler)
    await sharp
      .default(Buffer.from(iconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(join(assetsDir, "notification-icon.png"));
    console.log("Created notification-icon.png (1024x1024)");

    console.log("\nAll PNG icons generated successfully!");
  } catch (err) {
    console.log("\nSharp not available. SVG files created.");
    console.log("To generate PNGs, install sharp and run again:");
    console.log("  bun add -D sharp");
    console.log("  node scripts/generate-icons.mjs");
    console.log("\nOr use an online SVG to PNG converter with the SVG files.");
  }
}

main().catch(console.error);
