import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { themePalettes } = require("../src/tokens/colors.js");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDir, "../src/tokens/generated-colors.css");

function cssVarName(group, key) {
  const token = key === "DEFAULT" ? "default" : key;
  return `--${group}-${token}`;
}

function declarations(palette, indent = "  ") {
  return Object.entries(palette)
    .flatMap(([group, tones]) =>
      Object.entries(tones).map(
        ([key, value]) => `${indent}${cssVarName(group, key)}: ${value};`,
      ),
    )
    .join("\n");
}

const css = `/* Generated from src/tokens/colors.js. Do not edit.
   Run: npm run tokens:css */

:root {
  color-scheme: light;
${declarations(themePalettes.light)}
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
${declarations(themePalettes.dark, "    ")}
  }
}
`;

fs.writeFileSync(outputPath, css, "utf8");
console.log(`Wrote ${path.relative(path.resolve(scriptDir, ".."), outputPath)}`);
