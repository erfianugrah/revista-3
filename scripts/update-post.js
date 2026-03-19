#!/usr/bin/env node

/**
 * Update Post Tool for Revista
 *
 * A command-line tool for updating frontmatter in existing content files.
 * Uses targeted line-level replacements to preserve the original formatting
 * of unchanged fields (flow-style image blocks, tag quoting, etc.).
 */

import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { fileURLToPath } from "url";

// Get the directory of the current script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const contentDir = path.join(rootDir, "src", "content");

// Set up Commander
const program = new Command();

program
  .name("update-post")
  .description(chalk.blue("Update frontmatter in existing content files"))
  .version("1.0.0")
  .requiredOption(
    "--file <path>",
    "path to the content file (relative to src/content)",
  )
  .option("--title <title>", "update the title")
  .option("--description <description>", "update the description")
  .option("--tags <tags>", "update tags (comma-separated)")
  .option("--author <author>", "update the author name")
  .option("--pub-date <date>", "update publication date (ISO format)")
  .option("--updated-date <date>", "update or add updated date (ISO format)")
  .option("--touch", "set updated date to current timestamp (now)")
  .option("--remove-updated-date", "remove the updated date field")
  .option("--image-src <src>", "update image source URL")
  .option("--image-alt <alt>", "update image alt text")
  .option("--image-positionx <position>", "update image X position")
  .option("--image-positiony <position>", "update image Y position")
  .option("--dry-run", "preview changes without modifying the file")
  .parse(process.argv);

const options = program.opts();

/**
 * Replace or insert a simple scalar field in the frontmatter lines.
 * Returns the (possibly modified) lines array.
 */
function setField(lines, key, value) {
  const pattern = new RegExp(`^${key}:\\s`);
  const idx = lines.findIndex((l) => pattern.test(l));
  const newLine = `${key}: ${value}`;
  if (idx !== -1) {
    lines[idx] = newLine;
  } else {
    // Insert before description (last field) or at end
    const descIdx = lines.findIndex((l) => /^description:\s/.test(l));
    if (descIdx !== -1) {
      lines.splice(descIdx, 0, newLine);
    } else {
      lines.push(newLine);
    }
  }
  return lines;
}

/**
 * Remove a simple scalar field from the frontmatter lines.
 */
function removeField(lines, key) {
  const pattern = new RegExp(`^${key}:\\s`);
  const idx = lines.findIndex((l) => pattern.test(l));
  if (idx !== -1) {
    lines.splice(idx, 1);
  }
  return lines;
}

/**
 * Update a property inside the image block, handling both flow-style
 * (single-line `image: { ... }`) and block-style (multi-line) formats.
 */
function setImageProp(lines, prop, value) {
  // Find the image field
  const imageIdx = lines.findIndex((l) => /^image:/.test(l));
  if (imageIdx === -1) return lines;

  const imageLine = lines[imageIdx];

  // Check if it's flow style (everything on one line)
  if (imageLine.match(/^image:\s*\{.*\}\s*$/)) {
    // Flow style — replace or add the property inline
    const propPattern = new RegExp(`${prop}:\\s*[^,}]+`);
    if (propPattern.test(imageLine)) {
      lines[imageIdx] = imageLine.replace(propPattern, `${prop}: ${value}`);
    } else {
      // Add before closing brace
      lines[imageIdx] = imageLine.replace(/\s*\}\s*$/, `, ${prop}: ${value} }`);
    }
  } else {
    // Block style (multi-line) — find the line with this prop, or the closing brace
    // Block image looks like:
    //   image:
    //     {
    //       src: ...,
    //       alt: ...,
    //     }
    // or:
    //   image:
    //     src: ...
    //     alt: ...
    let found = false;
    for (let i = imageIdx + 1; i < lines.length; i++) {
      // Stop if we hit a non-indented line (next top-level field)
      if (/^\S/.test(lines[i])) break;

      const propPattern = new RegExp(`^(\\s+)${prop}:\\s*`);
      const match = lines[i].match(propPattern);
      if (match) {
        // Preserve trailing comma if present
        const hasTrailingComma = lines[i].trimEnd().endsWith(",");
        lines[i] = `${match[1]}${prop}: ${value}${hasTrailingComma ? "," : ""}`;
        found = true;
        break;
      }
    }
    if (!found) {
      // Try to insert before the closing brace or after the last image sub-field
      for (let i = imageIdx + 1; i < lines.length; i++) {
        if (/^\S/.test(lines[i])) {
          // Insert before this line
          const indent = lines[imageIdx + 1]?.match(/^(\s+)/)?.[1] || "    ";
          lines.splice(i, 0, `${indent}${prop}: ${value},`);
          break;
        }
      }
    }
  }
  return lines;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(chalk.blue.bold("🔄 Revista Post Updater 🔄"));

    // Resolve the full file path
    const filePath = path.join(contentDir, options.file);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      console.log(
        chalk.yellow("Make sure the path is relative to src/content"),
      );
      process.exit(1);
    }

    console.log(chalk.green(`\nUpdating: ${chalk.cyan(options.file)}\n`));

    // Read the file
    const fileContent = fs.readFileSync(filePath, "utf8");

    // Split into frontmatter and body, preserving the raw frontmatter string
    const fmMatch = fileContent.match(/^---\n([\s\S]*?\n)---\n/);
    if (!fmMatch) {
      console.error(
        chalk.red(
          "Error: Invalid content file format. Expected frontmatter between --- delimiters.",
        ),
      );
      process.exit(1);
    }

    const originalFmStr = fmMatch[1];
    const body = fileContent.slice(fmMatch[0].length);

    // Parse frontmatter to detect values for change comparison
    let originalData;
    try {
      originalData = yaml.parse(originalFmStr);
    } catch (error) {
      console.error(chalk.red("Error parsing frontmatter:"), error);
      process.exit(1);
    }

    // Work on the raw frontmatter lines to preserve formatting
    let fmLines = originalFmStr.trimEnd().split("\n");
    let changesMade = false;

    // Simple scalar fields
    const scalarUpdates = [
      { flag: options.title, key: "title", value: options.title },
      {
        flag: options.description,
        key: "description",
        value: options.description,
      },
      { flag: options.author, key: "author", value: `"${options.author}"` },
      { flag: options.pubDate, key: "pubDate", value: options.pubDate },
    ];

    for (const { flag, key, value } of scalarUpdates) {
      if (flag) {
        setField(fmLines, key, value);
        changesMade = true;
      }
    }

    // Handle tags — preserve the inline array format
    if (options.tags) {
      const tagArray = options.tags
        .split(",")
        .map((t) => `"${t.trim()}"`)
        .join(", ");
      setField(fmLines, "tags", `[${tagArray}]`);
      changesMade = true;
    }

    // Handle updated date
    if (options.removeUpdatedDate) {
      removeField(fmLines, "updatedDate");
      changesMade = true;
    } else if (options.touch) {
      setField(fmLines, "updatedDate", new Date().toISOString());
      changesMade = true;
    } else if (options.updatedDate) {
      setField(fmLines, "updatedDate", options.updatedDate);
      changesMade = true;
    }

    // Handle image properties
    const imageUpdates = [
      { flag: options.imageSrc, prop: "src", value: options.imageSrc },
      { flag: options.imageAlt, prop: "alt", value: options.imageAlt },
      {
        flag: options.imagePositionx,
        prop: "positionx",
        value: options.imagePositionx,
      },
      {
        flag: options.imagePositiony,
        prop: "positiony",
        value: options.imagePositiony,
      },
    ];

    for (const { flag, prop, value } of imageUpdates) {
      if (flag) {
        setImageProp(fmLines, prop, value);
        changesMade = true;
      }
    }

    // Build the updated file
    const newFmStr = fmLines.join("\n") + "\n";
    const updatedContent = `---\n${newFmStr}---\n${body}`;

    // Show changes
    console.log(chalk.yellow("Original Frontmatter:"));
    console.log(chalk.gray("---"));
    console.log(chalk.cyan(originalFmStr.trimEnd()));
    console.log(chalk.gray("---\n"));

    console.log(chalk.yellow("Updated Frontmatter:"));
    console.log(chalk.gray("---"));
    console.log(chalk.cyan(newFmStr.trimEnd()));
    console.log(chalk.gray("---"));

    if (!changesMade) {
      console.log(
        chalk.yellow("\nNo changes detected. Frontmatter is unchanged."),
      );
      return;
    }

    if (options.dryRun) {
      console.log(chalk.yellow("\nDry run - no changes written to file."));
      return;
    }

    // Write the updated content back to file
    fs.writeFileSync(filePath, updatedContent);
    console.log(chalk.green(`\n✅ File updated: ${chalk.cyan(options.file)}`));
  } catch (error) {
    console.error(chalk.red("\nError:"), error);
    process.exit(1);
  }
}

// Run the main function
main();
