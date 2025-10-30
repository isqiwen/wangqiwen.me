// this script is run by the npm postinstall hook to copy the font
// files from the node_modules directory to the public directory

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

// Define the source paths
const fontPaths = [
  "node_modules/@fontsource/inter/files/inter-latin-300-normal.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2",
  "node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2",
  "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff2",
  "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-300-normal.woff",
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff",
  "node_modules/@fontsource/inter/files/inter-latin-600-normal.woff",
  "node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff",
  "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff",
  "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff",
  "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  "node_modules/@fontsource-variable/roboto-mono/files/roboto-mono-latin-wght-normal.woff2",
  "node_modules/@fontsource-variable/noto-sans-sc/files/noto-sans-sc-latin-wght-normal.woff2",
];

const missingFonts = [];

const ensureDirectoryExistence = directoryPath => {
  if (fs.existsSync(directoryPath)) {
    return;
  }

  fs.mkdirSync(directoryPath, { recursive: true });
};

fontPaths.forEach(relativePath => {
  const src = path.join(projectRoot, relativePath);

  if (!fs.existsSync(src)) {
    missingFonts.push(relativePath);
    return;
  }

  const fileName = path.basename(src);
  const destDirectory = path.join(projectRoot, "public", "fonts");
  const dest = path.join(destDirectory, fileName);

  ensureDirectoryExistence(destDirectory);

  if (fs.existsSync(dest)) {
    return;
  }

  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} to ${dest}`);
});

if (missingFonts.length > 0) {
  console.warn(
    [
      "Some font files could not be found.",
      "If you recently upgraded @fontsource packages, update the",
      "paths in fonts/init.mjs accordingly.",
      "Missing files:",
      ...missingFonts.map(fontPath => ` - ${fontPath}`),
    ].join("\n")
  );
}
