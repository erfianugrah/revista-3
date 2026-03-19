#!/usr/bin/env node

/**
 * Schema Inspector for Revista Content CLI
 *
 * Standalone utility — not imported by other scripts.
 * Run directly to verify which collections are defined in content.config.ts:
 *
 *   node scripts/parser.js
 *
 * The collection schemas are maintained inline in create-content.js and
 * update-post.js. If you add or rename a collection in content.config.ts,
 * update those scripts too. Run this tool to check for drift.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "..", "src", "content.config.ts");

// Collections that the CLI scripts know about
const KNOWN_COLLECTIONS = [
  "muses",
  "short_form",
  "long_form",
  "zeitweilig",
  "authors",
  "cv",
];

const content = fs.readFileSync(configPath, "utf8");

const found = [];
const missing = [];

for (const name of KNOWN_COLLECTIONS) {
  const pattern = new RegExp(`const\\s+${name}\\s*=\\s*defineCollection\\(`);
  if (pattern.test(content)) {
    found.push(name);
  } else {
    missing.push(name);
  }
}

// Also detect any defineCollection calls we don't know about
const allDefined = [
  ...content.matchAll(/const\s+(\w+)\s*=\s*defineCollection\(/g),
].map((m) => m[1]);
const unknown = allDefined.filter((n) => !KNOWN_COLLECTIONS.includes(n));

console.log(
  `content.config.ts defines ${allDefined.length} collection(s): ${allDefined.join(", ")}`,
);
console.log(
  `CLI scripts know about ${KNOWN_COLLECTIONS.length}: ${KNOWN_COLLECTIONS.join(", ")}`,
);

if (missing.length) {
  console.warn(`\n⚠  Missing from config: ${missing.join(", ")}`);
}
if (unknown.length) {
  console.warn(
    `\n⚠  New in config but not in CLI scripts: ${unknown.join(", ")}`,
  );
  console.warn(
    "   Update COLLECTIONS in scripts/create-content.js and scripts/update-post.js",
  );
}
if (!missing.length && !unknown.length) {
  console.log("\n✅ CLI scripts and content.config.ts are in sync.");
}
