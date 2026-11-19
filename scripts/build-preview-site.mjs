// Builds the standalone static site served from https://bibleapreview.web.app/.
//
// Expo Router exports the whole app to dist/. This script keeps only the
// preview routes plus the assets they reference, and puts the main preview at
// the root of the hosted site:
//
//   dist/preview/index.html    -> preview-site/index.html
//   dist/preview/convert.html  -> preview-site/convert.html
//   dist/_expo/                -> preview-site/_expo/
//   dist/assets/               -> preview-site/assets/

import { execSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const distDir = path.join(projectRoot, "dist");
const outputDir = path.join(projectRoot, "preview-site");

console.log("Building Expo web export...");
execSync("npm exec -- expo export --platform web", {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await cp(path.join(distDir, "_expo"), path.join(outputDir, "_expo"), {
  recursive: true,
});
await cp(path.join(distDir, "assets"), path.join(outputDir, "assets"), {
  recursive: true,
});
await cp(path.join(distDir, "favicon.ico"), path.join(outputDir, "favicon.ico"));

await cp(
  path.join(distDir, "preview", "index.html"),
  path.join(outputDir, "index.html"),
);
await cp(
  path.join(distDir, "preview", "convert.html"),
  path.join(outputDir, "convert.html"),
);

console.log(`Preview site written to ${outputDir}`);
