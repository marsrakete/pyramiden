import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

for (const directory of [
  "shared",
  "pyramids",
  "ellipse",
  "word-network",
  "scripts",
  "tests",
]) {
  for (const file of readdirSync(directory)) {
    if (file.endsWith(".js")) {
      execFileSync(process.execPath, ["--check", `${directory}/${file}`], {
        stdio: "inherit",
      });
    }
  }
}
for (const file of [
  "index.html",
  "kegelschnitt_ellipse_begrenzt.html",
  "wortgeflecht.html",
]) {
  const html = readFileSync(file, "utf8");
  if (/<style>|<script type="module">|\sstyle=/.test(html)) {
    throw new Error(`Inline-Code in ${file}`);
  }
  if (!html.includes("three@0.180.0/")) {
    throw new Error(`Three.js-Version in ${file} prüfen`);
  }
}
console.log("Syntax, externe Assets und CDN-Version geprüft.");
