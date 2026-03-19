# Revista Content Management Tools

This directory contains CLI tools for creating, updating, and managing content in the Revista project. These tools ensure consistent frontmatter formatting and simplify content workflows.

## Content Creation CLI (`create-content.js`)

### Overview

The Content Creation CLI tool generates content files with the proper frontmatter schema for all content collections in Revista. Collection definitions are maintained inline in the script, mirroring `content.config.ts`.

**Key Features:**

- Provides a user-friendly color-coded interface with interactive prompts
- Validates user input according to schema requirements
- Creates files with consistent naming patterns (YYYY-MM-DD-slug.mdx)
- Uses the publication date for the filename when provided (or today's date if not)
- Ensures required fields are properly formatted
- Formats tags as `["tag1", "tag2"]` to match existing content conventions
- Supports both interactive and non-interactive modes for different workflows
- Supports custom slug overrides (defaults to slugified title)

## Installation

The tool requires the following dependencies which are already included in the project:

```bash
# Install dependencies (if not already installed)
bun install
```

## Usage

### Basic Usage

```bash
# Run the content creator in interactive mode
bun run create

# Or run directly
node scripts/create-content.js
```

The interactive mode will guide you through the process of creating a new content file with a series of prompts:

1. Select content type (muses, short_form, long_form, zeitweilig, authors, cv)
2. Enter title (required)
3. Enter slug (optional — auto-generated from title if left blank)
4. Enter tags (comma-separated, defaults to the collection type)
5. Enter author name (defaults to "Erfi Anugrah")
6. Enter description (required)
7. Choose whether to include an image
8. If including an image, enter image source URL, alt text, and optional positioning

The tool will then:

1. Generate a slug from the title (or use the custom slug provided)
2. Create a file with the pattern `YYYY-MM-DD-slug.mdx`
3. Write properly formatted frontmatter
4. Show next steps for editing and previewing the content

## Command Line Options

The CLI supports the following options:

### Basic Commands

```bash
# Run in interactive mode (default)
bun run create

# Show help with all available options
bun run create --help

# Show version
bun run create --version
```

### Content Type Selection

```bash
# Specify content type directly
bun run create -t muses
bun run create --type short_form
```

### Preview Mode

```bash
# Preview frontmatter without creating a file (dry run)
bun run create --dry-run
# or shorter version
bun run create -d
```

### Non-Interactive Mode

The non-interactive mode is useful for scripts, CI/CD pipelines, or environments where interactive prompts don't work well:

```bash
# Minimal required options for non-interactive mode
bun run create --non-interactive --type muses --title "My Post" --description "Description"

# With all available options
bun run create --non-interactive \
  --type muses \
  --title "My Post" \
  --slug "custom-slug" \
  --description "Description" \
  --tags "tag1,tag2,tag3" \
  --author "Author Name" \
  --image-src "https://example.com/image.jpg" \
  --image-alt "Image description" \
  --image-positionx "50%" \
  --image-positiony "40%" \
  --pub-date "2024-05-19T12:00:00.000Z"

# Combined with dry-run
bun run create --non-interactive --type muses --title "Test" --description "Test" --dry-run
```

### Option Reference

| Option                        | Shorthand | Description                               | Required for Non-Interactive |
| ----------------------------- | --------- | ----------------------------------------- | ---------------------------- |
| `--type <type>`               | `-t`      | Content type (muses, short_form, etc.)    | Yes                          |
| `--dry-run`                   | `-d`      | Preview without creating file             | No                           |
| `--non-interactive`           |           | Run without prompts                       | N/A                          |
| `--title <title>`             |           | Content title                             | Yes                          |
| `--slug <slug>`               |           | Custom slug (defaults to slugified title) | No                           |
| `--tags <tags>`               |           | Comma-separated tags                      | No                           |
| `--author <author>`           |           | Author name                               | No                           |
| `--description <description>` |           | Content description                       | Yes                          |
| `--image-src <src>`           |           | Image source URL                          | No                           |
| `--image-alt <alt>`           |           | Image alt text                            | No                           |
| `--image-positionx <pos>`     |           | Image X position (e.g. 50%)               | No                           |
| `--image-positiony <pos>`     |           | Image Y position (e.g. 40%)               | No                           |
| `--pub-date <date>`           |           | Publication date (ISO format)             | No                           |

## Supported Content Types

The tool supports all content collections defined in `content.config.ts`:

- **muses** - Photography collections with image frontmatter
- **short_form** - Brief posts
- **long_form** - In-depth articles
- **zeitweilig** - Ephemeral content
- **authors** - Contributor profiles
- **cv** - Professional resume data (complex schema)

## Interactive Workflow

1. Select content type:

   ```
   ? Select content type: (Use arrow keys)
   > muses
     short_form
     long_form
     zeitweilig
     authors
     cv
   ```

2. Fill in required fields (validation included):

   ```
   Title: Stockholm: Urban Reflections
   Slug (leave blank to auto-generate from title):
   Tags (comma-separated): sweden, architecture, street, reflection
   Author (default: Erfi Anugrah):
   Description: A winter wander through Stockholm's glass-filled business district
   ```

3. Add optional image information:

   ```
   ? Include image? Yes
   Image src: https://image.erfi.io/stockholm-reflections-01.jpg
   Image alt: Office building reflection with stark contrast on a winter day
   Image positionx (optional): center
   Image positiony (optional): top-33
   ```

4. Preview and confirm:

   ```
   Content Preview:
   ---
   title: Stockholm: Urban Reflections
   slug: stockholm-urban-reflections
   pubDate: 2025-05-19T12:45:26.789Z
   tags: ["sweden", "architecture", "street", "reflection"]
   author: "Erfi Anugrah"
   image: { src: https://image.erfi.io/stockholm-reflections-01.jpg, alt: Office building reflection with stark contrast on a winter day, positionx: center, positiony: top-33 }
   description: A winter wander through Stockholm's glass-filled business district
   ---

   ? Create file at /home/erfi/revista-3/src/content/muses/2025-05-19-stockholm-urban-reflections.mdx? Yes
   ```

5. File is created and next steps are shown

## Technical Implementation

The content creator (`scripts/create-content.js`) is a self-contained CLI tool:

- **Collection definitions** are maintained inline in the script (the `COLLECTIONS` map). If you add or rename a collection in `content.config.ts`, update the map in the script too.
- **Frontmatter formatting** is handled by `buildFrontmatter()` — a single function shared by both interactive and non-interactive modes to ensure identical output.
- Uses Commander for CLI option parsing, Inquirer for interactive prompts, and Chalk for coloured output.

To check that the CLI scripts are in sync with `content.config.ts`, run the drift checker:

```bash
node scripts/parser.js
```

## Schema Validation

The tool validates user input according to the schema requirements:

- Required fields must be provided
- Complex fields like `image` are properly structured
- Date fields are automatically generated in ISO format
- Special handling for the more complex CV schema

## Examples

### Creating a Photography Post

```bash
bun run create -t muses
```

### Creating a Long-Form Article

```bash
bun run create -t long_form
```

### Previewing Without Creating

```bash
bun run create -t short_form --dry-run
```

### Creating with a Custom Slug

```bash
bun run create --non-interactive --type muses --title "Über Alles" --slug "uber-alles" --description "A description"
```

## Post Update Tool (`update-post.js`)

### Overview

The Post Update Tool modifies frontmatter in existing content files without changing the content itself. It uses targeted line-level replacements to preserve the original formatting of unchanged fields (flow-style image blocks, tag quoting style, etc.).

This is useful for:

- Quickly stamping the current time as `updatedDate` (via `--touch`)
- Updating publication or update dates
- Changing tags or categories
- Updating image metadata
- Modifying titles or descriptions

### Usage

```bash
# Set updatedDate to the current timestamp
bun run update-post --file muses/2026-03-16-hiraeth.mdx --touch

# Preview changes without writing to file
bun run update-post --file muses/2026-03-16-hiraeth.mdx --touch --dry-run

# Set a specific updated date
bun run update-post --file muses/2025-05-19-commodification.mdx --updated-date "2025-05-20T12:00:00Z"

# Update tags (preview first)
bun run update-post --file short_form/2025-05-19-the-essence-of-light.mdx --tags "photography,light,art,philosophy" --dry-run

# Update multiple fields at once
bun run update-post --file zeitweilig/2022-06-03-what-is-erfi.mdx \
  --title "Updated Title" \
  --description "New description text" \
  --tags "new,tags,here" \
  --touch

# Remove the updated date field
bun run update-post --file muses/2017-09-02-the-beginning.mdx --remove-updated-date

# Update image properties
bun run update-post --file short_form/2021-03-08-hypnagogia.mdx \
  --image-src "https://image.erfi.io/new-image.jpg" \
  --image-alt "New alt text" \
  --image-positionx "center" \
  --image-positiony "top"
```

### Options Reference

| Option                    | Description                                 | Required |
| ------------------------- | ------------------------------------------- | -------- |
| `--file <path>`           | Path to the file (relative to src/content)  | Yes      |
| `--title <title>`         | Update the content title                    | No       |
| `--description <desc>`    | Update the description                      | No       |
| `--tags <tags>`           | Update tags (comma-separated)               | No       |
| `--author <name>`         | Update the author name                      | No       |
| `--pub-date <date>`       | Update publication date (ISO format)        | No       |
| `--updated-date <date>`   | Update or add updated date (ISO format)     | No       |
| `--touch`                 | Set updated date to current timestamp (now) | No       |
| `--remove-updated-date`   | Remove the updated date field               | No       |
| `--image-src <url>`       | Update image source URL                     | No       |
| `--image-alt <text>`      | Update image alt text                       | No       |
| `--image-positionx <pos>` | Update image X position                     | No       |
| `--image-positiony <pos>` | Update image Y position                     | No       |
| `--dry-run`               | Preview changes without writing to file     | No       |

### Format Preservation

The update tool preserves the original formatting style of your frontmatter. Both of these styles are handled correctly:

**Flow-style (single-line):**

```yaml
image:
  {
    src: https://image.erfi.io/photo.jpg,
    alt: description,
    positionx: 50%,
    positiony: 40%,
  }
```

**Block-style (multi-line):**

```yaml
image:
  {
    src: https://image.erfi.io/photo.jpg,
    alt: description,
    positionx: 50%,
    positiony: 40%,
  }
```

Only the fields you explicitly update are modified; everything else stays byte-for-byte identical.

### Example Workflow

1. Create a new post with the creation tool

   ```bash
   bun run create -t muses
   ```

2. Later, stamp the updated date with a single command
   ```bash
   bun run update-post --file muses/2025-05-19-commodification.mdx --touch
   ```

## Schema Drift Checker (`parser.js`)

A standalone utility to verify that the collection definitions in the CLI scripts match `content.config.ts`. Not imported by other scripts — run directly:

```bash
node scripts/parser.js
```

Output when in sync:

```
content.config.ts defines 6 collection(s): muses, short_form, long_form, zeitweilig, authors, cv
CLI scripts know about 6: muses, short_form, long_form, zeitweilig, authors, cv

✅ CLI scripts and content.config.ts are in sync.
```

If a new collection is added to `content.config.ts` but not to the CLI scripts, it will warn you to update the `COLLECTIONS` map in `scripts/create-content.js`.

## Other Scripts

### `sync-readme-versions.js`

Runs as a prebuild step (`bun run prebuild`). Reads dependency versions from `package.json` and updates badge URLs and version strings across all `.md` files in the repo. No arguments needed.

### `check-version-tag.mjs`

CI version guard used by `.github/workflows/version-consistency.yml`. On tag refs, verifies `package.json` version matches the git tag. On non-tag refs, ensures `package.json` version is not ahead of the latest semver tag.
