// This script runs on postinstall and copies the required font files from
// node_modules into the public directory used by the app.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const fontPaths = [
  "node_modules/@fontsource/inter/files/inter-latin-300-normal.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2",
  "node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-300-normal.woff",
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff",
  "node_modules/@fontsource/inter/files/inter-latin-600-normal.woff",
  "node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff",
  "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  "node_modules/@fontsource-variable/roboto-mono/files/roboto-mono-latin-wght-normal.woff2",
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
    ].join("\n"),
  );
}
