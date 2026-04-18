#!/usr/bin/env node

/**
 * Revista Content Creator CLI
 *
 * Creates new MDX content files with proper frontmatter matching the
 * schema defined in content.config.ts.
 *
 * Supports both interactive (inquirer prompts) and non-interactive
 * (all values via CLI flags) modes.
 */

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --------------- Paths ---------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const contentDir = path.join(rootDir, "src", "content");

// --------------- Collection schemas ---------------
// Mirrors content.config.ts — update here when the schema changes.

const COLLECTIONS = {
  muses: { complex: [] },
  short_form: { complex: [] },
  long_form: { complex: [] },
  zeitweilig: { complex: [] },
  authors: { complex: [] },
  cv: {
    complex: [
      "sections",
      "contacts",
      "skills",
      "languages",
      "education",
      "companies",
    ],
  },
};

const BASE_REQUIRED = ["title", "tags", "author", "description", "pubDate"];
const BASE_OPTIONAL = ["updatedDate", "image"];
const IMAGE_PROPS = [
  { name: "src", isOptional: false },
  { name: "alt", isOptional: false },
  { name: "positionx", isOptional: true },
  { name: "positiony", isOptional: true },
];

// --------------- Helpers ---------------

/** Convert a title into a URL-friendly slug. */
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build the frontmatter string for a new content file.
 *
 * This is the single source of truth for frontmatter formatting so that
 * interactive and non-interactive modes produce identical output.
 */
function buildFrontmatter({
  title,
  slug,
  pubDate,
  tags,
  author,
  description,
  image,
}) {
  const lines = [];

  lines.push(`title: "${title}"`);
  lines.push(`slug: "${slug}"`);
  lines.push(`pubDate: "${pubDate}"`);

  // tags — double-quoted, inline array: ["tag1", "tag2"]
  const tagsStr = tags.map((t) => `"${t}"`).join(", ");
  lines.push(`tags: [${tagsStr}]`);

  lines.push(`author: "${author}"`);

  // image (optional) — flow style on one line
  if (image) {
    const props = Object.entries(image)
      .filter(([, v]) => v) // skip empty optional props
      .map(([k, v]) => `${k}: "${v}"`)
      .join(", ");
    lines.push(`image: { ${props} }`);
  }

  lines.push(`description: "${description}"`);

  return lines.join("\n");
}

/**
 * Write the content file to disk (shared by both modes).
 * Returns the absolute file path written to (or that would be written to).
 */
function writeContentFile({
  collectionType,
  slug,
  pubDate,
  frontmatter,
  dryRun,
}) {
  const filenameDate = pubDate.split("T")[0]; // YYYY-MM-DD
  const filename = `${filenameDate}-${slug}.mdx`;
  const filePath = path.join(contentDir, collectionType, filename);

  // Preview
  console.log(chalk.yellow("\nContent Preview:"));
  console.log(chalk.gray("---"));
  console.log(chalk.cyan(frontmatter));
  console.log(chalk.gray("---"));
  console.log(chalk.gray("Enter your content here.\n"));

  if (dryRun) {
    console.log(chalk.yellow("Dry run - no file created."));
    console.log(chalk.gray(`Would create file: ${chalk.cyan(filePath)}`));
    return filePath;
  }

  return { filePath, filename };
}

function showNextSteps(filename) {
  console.log(chalk.blue("\nNext steps:"));
  console.log(`  1. ${chalk.cyan(`Edit ${filename}`)} to add your content`);
  console.log(`  2. Run ${chalk.cyan("bun run dev")} to preview your changes`);
  console.log(`  3. Run ${chalk.cyan("bun run build")} when ready to publish`);
}

// --------------- CLI setup ---------------

const program = new Command();

program
  .name("create-content")
  .description(
    chalk.blue(
      "CLI to create content files for Revista with proper frontmatter",
    ),
  )
  .version("1.0.0")
  .option(
    "-t, --type <type>",
    `content type (${Object.keys(COLLECTIONS).join(", ")})`,
  )
  .option("-d, --dry-run", "preview frontmatter without creating the file")
  .option(
    "--non-interactive",
    "run in non-interactive mode with provided options",
  )
  .option("--title <title>", "title for the content")
  .option("--slug <slug>", "custom slug (defaults to slugified title)")
  .option("--tags <tags>", "comma-separated tags")
  .option("--author <author>", "author name")
  .option("--description <description>", "content description")
  .option("--image-src <src>", "image source URL")
  .option("--image-alt <alt>", "image alt text")
  .option("--image-positionx <pos>", "image X position (e.g. 50%)")
  .option("--image-positiony <pos>", "image Y position (e.g. 40%)")
  .option("--pub-date <date>", "publication date in ISO format")
  .parse(process.argv);

const options = program.opts();

// --------------- Non-interactive mode ---------------

function handleNonInteractive() {
  if (!options.type || !options.title || !options.description) {
    console.error(
      chalk.red(
        "Error: In non-interactive mode, --type, --title, and --description are required",
      ),
    );
    process.exit(1);
  }

  const collectionType = options.type;
  if (!COLLECTIONS[collectionType]) {
    console.error(
      chalk.red(`Error: Unknown collection type '${collectionType}'.`),
    );
    console.log(
      chalk.yellow(`Available types: ${Object.keys(COLLECTIONS).join(", ")}`),
    );
    process.exit(1);
  }

  console.log(
    chalk.green(
      `\nCreating new ${chalk.bold(collectionType)} content (non-interactive)\n`,
    ),
  );

  const slug = options.slug || slugify(options.title);
  const pubDate = options.pubDate || new Date().toISOString();
  const tags = options.tags
    ? options.tags.split(",").map((t) => t.trim())
    : [collectionType];
  const author = options.author || "Erfi Anugrah";

  let image;
  if (options.imageSrc && options.imageAlt) {
    image = { src: options.imageSrc, alt: options.imageAlt };
    if (options.imagePositionx) image.positionx = options.imagePositionx;
    if (options.imagePositiony) image.positiony = options.imagePositiony;
  }

  const frontmatter = buildFrontmatter({
    title: options.title,
    slug,
    pubDate,
    tags,
    author,
    description: options.description,
    image,
  });

  const result = writeContentFile({
    collectionType,
    slug,
    pubDate,
    frontmatter,
    dryRun: options.dryRun,
  });

  if (options.dryRun) return;

  const { filePath, filename } = result;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileContent = `---\n${frontmatter}\n---\n\nEnter your content here.\n`;
  fs.writeFileSync(filePath, fileContent);
  console.log(chalk.green(`\n✅ File created: ${chalk.cyan(filePath)}`));
  showNextSteps(filename);
}

// --------------- Interactive mode ---------------

async function handleInteractive() {
  // Pick collection type
  let collectionType = options.type;
  if (!collectionType) {
    const resp = await inquirer.prompt([
      {
        type: "list",
        name: "collectionType",
        message: "Select content type:",
        choices: Object.keys(COLLECTIONS),
      },
    ]);
    collectionType = resp.collectionType;
  }

  if (!COLLECTIONS[collectionType]) {
    console.error(
      chalk.red(`Error: Unknown collection type '${collectionType}'.`),
    );
    console.log(
      chalk.yellow(`Available types: ${Object.keys(COLLECTIONS).join(", ")}`),
    );
    process.exit(1);
  }

  console.log(
    chalk.green(`\nCreating new ${chalk.bold(collectionType)} content\n`),
  );

  // Build the prompt questions
  const questions = [
    {
      type: "input",
      name: "title",
      message: `${chalk.cyan("Title:")}`,
      validate: (v) => (v ? true : "Title is required"),
    },
    {
      type: "input",
      name: "slug",
      message: `${chalk.cyan("Slug")} ${chalk.gray("(leave blank to auto-generate from title)")}:`,
      default: "",
    },
    {
      type: "input",
      name: "tags",
      message: `${chalk.cyan("Tags")} ${chalk.gray("(comma-separated)")}:`,
      default: collectionType,
      filter: (v) => v.split(",").map((t) => t.trim()),
    },
    {
      type: "input",
      name: "author",
      message: `${chalk.cyan("Author:")}`,
      default: "Erfi Anugrah",
    },
    {
      type: "input",
      name: "description",
      message: `${chalk.cyan("Description:")}`,
      validate: (v) => (v ? true : "Description is required"),
    },
    {
      type: "confirm",
      name: "includeImage",
      message: "Include image?",
      default: false,
    },
  ];

  // Image sub-questions
  for (const prop of IMAGE_PROPS) {
    questions.push({
      type: "input",
      name: `image.${prop.name}`,
      message: `${chalk.cyan(`Image ${prop.name}:`)}${prop.isOptional ? chalk.gray(" (optional)") : ""}`,
      when: (answers) => answers.includeImage,
      validate: (v) => {
        if (!prop.isOptional && !v) return `Image ${prop.name} is required`;
        return true;
      },
    });
  }

  const answers = await inquirer.prompt(questions);

  const slug = answers.slug || slugify(answers.title);
  const pubDate = new Date().toISOString();

  // Collect image props
  let image;
  if (answers.includeImage) {
    image = {};
    for (const [key, value] of Object.entries(answers)) {
      if (key.startsWith("image.") && value) {
        image[key.split(".")[1]] = value;
      }
    }
  }

  const frontmatter = buildFrontmatter({
    title: answers.title,
    slug,
    pubDate,
    tags: answers.tags,
    author: answers.author,
    description: answers.description,
    image,
  });

  const result = writeContentFile({
    collectionType,
    slug,
    pubDate,
    frontmatter,
    dryRun: options.dryRun,
  });

  if (options.dryRun) return;

  const { filePath, filename } = result;

  // Confirm before writing
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Create file at ${chalk.cyan(filePath)}?`,
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow("File creation cancelled."));
    return;
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileContent = `---\n${frontmatter}\n---\n\nEnter your content here.\n`;
  fs.writeFileSync(filePath, fileContent);
  console.log(chalk.green(`\n✅ File created: ${chalk.cyan(filePath)}`));
  showNextSteps(filename);
}

// --------------- Main ---------------

async function main() {
  try {
    console.log(chalk.blue.bold("🌟 Revista Content Creator 🌟"));
    console.log(chalk.gray("Creates content files with proper frontmatter\n"));

    if (options.nonInteractive) {
      handleNonInteractive();
    } else {
      await handleInteractive();
    }
  } catch (error) {
    console.error(chalk.red("\nError:"), error);
    process.exit(1);
  }
}

main();
