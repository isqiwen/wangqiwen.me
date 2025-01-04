// this script is run by the npm postinstall hook to copy the font
// files from the node_modules directory to the public directory

import fs from "fs";
import path from "path";

// Define the source paths
const fontPaths = [
  "node_modules/@fontsource/inter/files/inter-latin-300-normal.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2",
  "node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2",
  "node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2",
  "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff2",
  "node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff2",
  "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  "node_modules/@fontsource-variable/roboto-mono/files/roboto-mono-latin-wght-normal.woff2",
  "node_modules/@fontsource-variable/noto-sans-sc/files/noto-sans-sc-latin-wght-normal.woff2",
];

// Ensure the destination directory exists
const ensureDirectoryExistence = filePath => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname, { recursive: true });
};

// Copy each font file
fontPaths.forEach(src => {
  const fileName = path.basename(src);
  const dest = path.join("public", "fonts", fileName);
  ensureDirectoryExistence(dest);
  const exists = fs.existsSync(dest);
  if (!exists) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
  }
});
