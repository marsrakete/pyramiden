import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

for (const directory of [
  "shared",
  "pyramids",
  "ellipse",
  "Wortgeflecht/word-network",
  "Wortgeflecht/share",
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
  "Wortgeflecht/index.html",
]) {
  const html = readFileSync(file, "utf8");
  if (/<style>|<script type="module">|\sstyle=/.test(html)) {
    throw new Error(`Inline-Code in ${file}`);
  }
  if (!html.includes("three@0.180.0/")) {
    throw new Error(`Three.js-Version in ${file} prüfen`);
  }
}
const technical = readFileSync("TECHNICAL.html", "utf8");
if (
  !technical.includes("mathjax@3") ||
  !technical.includes('aria-label="Rechenablauf"')
) {
  throw new Error("TECHNICAL.html muss MathJax und den Rechenablauf enthalten");
}
console.log("Syntax, externe Assets und CDN-Version geprüft.");
