#!/usr/bin/env node

/**
 * sync-readme-versions.js
 *
 * Reads resolved dependency versions from package.json and updates
 * badge URLs and version strings across all documentation .md files.
 *
 * Runs as a prebuild step — no arguments needed.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

// --------------- Version extraction ---------------

/** Strip semver range prefixes (^, ~, >=) to get the base version */
function clean(raw) {
  return raw?.replace(/^[\^~>=<]+/, "") ?? "unknown";
}

const v = {
  astro: clean(pkg.dependencies["astro"]),
  tailwind: clean(pkg.dependencies["tailwindcss"]),
  react: clean(pkg.dependencies["react"]),
  ts: clean(pkg.dependencies["typescript"]),
  mdx: clean(pkg.dependencies["@astrojs/mdx"]),
};

// --------------- Replacement pairs [pattern, replacement string] ---------------

const rules = [
  // Shield.io badge version slugs
  [/Astro-[\d.]+(?:-[a-z.]+)?-FF5D01/g, `Astro-${v.astro}-FF5D01`],
  [
    /Tailwind_CSS-[\d.]+(?:-[a-z.]+)?-38B2AC/g,
    `Tailwind_CSS-${v.tailwind}-38B2AC`,
  ],
  [/React-[\d.]+(?:-[a-z.]+)?-61DAFB/g, `React-${v.react}-61DAFB`],
  [/TypeScript-[\d.]+(?:-[a-z.]+)?-3178C6/g, `TypeScript-${v.ts}-3178C6`],
  [/MDX-[\d.]+(?:-[a-z.]+)?-1B1F24/g, `MDX-${v.mdx}-1B1F24`],

  // Prose: "Astro v5.X.Y", "Tailwind CSS v4.X.Y"
  [/Astro v\d+\.\d+\.\d+/g, `Astro v${v.astro}`],
  [/Tailwind CSS v\d+\.\d+\.\d+/g, `Tailwind CSS v${v.tailwind}`],
];

// --------------- File discovery ---------------

const SKIP = new Set(["node_modules", ".git", "dist", ".astro"]);

function findMarkdownFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findMarkdownFiles(full));
    } else if (entry.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

// --------------- Main ---------------

let updated = 0;

for (const file of findMarkdownFiles(ROOT)) {
  const original = readFileSync(file, "utf-8");
  let content = original;

  for (const [pattern, replacement] of rules) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    writeFileSync(file, content, "utf-8");
    console.log(`  updated: ${file.replace(ROOT + "/", "")}`);
    updated++;
  }
}

if (updated > 0) {
  console.log(
    `\n✓ Synced versions across ${updated} file(s): Astro ${v.astro}, Tailwind ${v.tailwind}, React ${v.react}, TS ${v.ts}, MDX ${v.mdx}`,
  );
} else {
  console.log(`✓ All docs already up to date (Astro ${v.astro})`);
}
