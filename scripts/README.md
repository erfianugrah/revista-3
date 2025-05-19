# Revista Content Management Tools

This directory contains CLI tools for creating, updating, and managing content in the Revista project. These tools ensure consistent frontmatter formatting and simplify content workflows.

## Content Creation CLI (`create-content.js`)

### Overview

The Content Creation CLI tool automatically generates content files with the proper frontmatter schema for all content collections in Revista. This tool helps maintain consistency across content and reduces the time spent setting up new posts.

**Key Features:**

- Dynamically reads schema from `content.config.ts` to ensure conformity with defined types
- Provides a user-friendly color-coded interface with interactive prompts
- Validates user input according to schema requirements
- Creates files with consistent naming patterns (YYYY-MM-DD-slug.mdx)
- Uses the publication date for the filename when provided (or today's date if not)
- Ensures required fields are properly formatted
- Formats tags in the `[ 'tag1', 'tag2' ]` style to match existing content
- Supports both interactive and non-interactive modes for different workflows

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
3. Enter tags (comma-separated, defaults to the collection type)
4. Enter author name (defaults to "Erfi Anugrah")
5. Enter description (required)
6. Choose whether to include an image
7. If including an image, enter image source URL, alt text, and optional positioning

The tool will then:
1. Generate a slug from the title
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

### Debug Mode

```bash
# Show debug information for schema parsing
bun run create --debug
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
  --description "Description" \
  --tags "tag1,tag2,tag3" \
  --author "Author Name" \
  --image-src "https://example.com/image.jpg" \
  --image-alt "Image description" \
  --pub-date "2024-05-19T12:00:00.000Z" \
  --updated-date "2024-05-20T15:30:00.000Z"

# Combined with dry-run
bun run create --non-interactive --type muses --title "Test" --description "Test" --dry-run
```

### Option Reference

| Option | Shorthand | Description | Required for Non-Interactive |
|--------|-----------|-------------|------------------------------|
| `--type <type>` | `-t` | Content type (muses, short_form, etc.) | Yes |
| `--dry-run` | `-d` | Preview without creating file | No |
| `--debug` | | Show debug information | No |
| `--non-interactive` | | Run without prompts | N/A |
| `--title <title>` | | Content title | Yes |
| `--tags <tags>` | | Comma-separated tags | No |
| `--author <author>` | | Author name | No |
| `--description <description>` | | Content description | Yes |
| `--image-src <src>` | | Image source URL | No |
| `--image-alt <alt>` | | Image alt text | No |
| `--pub-date <date>` | | Publication date (ISO format) | No |
| `--updated-date <date>` | | Last updated date (ISO format) | No |

## Supported Content Types

The tool automatically detects all content collections defined in `content.config.ts`:

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
   Tags (comma-separated): sweden, architecture, street, reflection
   Author (default: Erfi Anugrah): 
   Description: A winter wander through Stockholm's glass-filled business district
   ```

3. Add optional image information:
   ```
   ? Include image? Yes
   Image src: https://cdn.erfianugrah.com/stockholm-reflections-01.jpg
   Image alt: Office building reflection with stark contrast on a winter day
   Image positionx: (optional, e.g., center, 40%): center
   Image positiony: (optional, e.g., top, 20%): top-33
   ```

4. Preview and confirm:
   ```
   Content Preview:
   ---
   title: Stockholm: Urban Reflections
   tags:
     - sweden
     - architecture
     - street
     - reflection
   author: Erfi Anugrah
   description: A winter wander through Stockholm's glass-filled business district
   image:
     src: https://cdn.erfianugrah.com/stockholm-reflections-01.jpg
     alt: Office building reflection with stark contrast on a winter day
     positionx: center
     positiony: top-33
   pubDate: 2025-05-19T12:45:26.789Z
   slug: stockholm-urban-reflections
   ---

   ? Create file at /home/erfi/revista-3/src/content/muses/2025-05-19-stockholm-urban-reflections.mdx? Yes
   ```

5. File is created and next steps are shown

## Technical Implementation

The tool consists of two main components:

1. **Parser (`scripts/parser.js`)**: Dynamically extracts schema information from `content.config.ts` using regex-based parsing to identify required and optional fields.

2. **CLI (`scripts/create-content.js`)**: Uses Commander and Inquirer to provide an interactive command-line interface with colored prompts via Chalk.

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

## Extending the Tool

To add new features:

1. Update parser.js to extract additional schema information
2. Modify create-content.js to handle new field types or validation rules
3. Add new command-line options in the Commander setup

## Post Update Tool

### Overview

The Post Update Tool allows you to modify frontmatter in existing content files without changing the content itself. This is useful for:

- Updating publication or update dates
- Changing tags or categories
- Updating image metadata
- Modifying titles or descriptions

### Usage

```bash
# Basic usage (requires at least the --file parameter)
bun run update-post --file muses/2025-05-19-commodification.mdx --updated-date "2025-05-20T12:00:00Z"

# Preview changes without writing to file
bun run update-post --file short_form/2025-05-19-the-essence-of-light.mdx --tags "photography,light,art,philosophy" --dry-run

# Update multiple fields at once
bun run update-post --file zeitweilig/2022-06-03-what-is-erfi.mdx \
  --title "Updated Title" \
  --description "New description text" \
  --tags "new,tags,here" \
  --updated-date "2025-05-20T15:30:00Z"

# Remove the updated date field
bun run update-post --file muses/2017-09-02-the-beginning.mdx --remove-updated-date

# Update image properties
bun run update-post --file short_form/2021-03-08-hypnagogia.mdx \
  --image-src "https://cdn.erfianugrah.com/new-image.jpg" \
  --image-alt "New alt text" \
  --image-positionx "center" \
  --image-positiony "top"
```

### Options Reference

| Option | Description | Required |
|--------|-------------|----------|
| `--file <path>` | Path to the file (relative to src/content) | Yes |
| `--title <title>` | Update the content title | No |
| `--description <desc>` | Update the description | No |
| `--tags <tags>` | Update tags (comma-separated) | No |
| `--author <name>` | Update the author name | No |
| `--pub-date <date>` | Update publication date (ISO format) | No |
| `--updated-date <date>` | Update or add updated date (ISO format) | No |
| `--remove-updated-date` | Remove the updated date field | No |
| `--image-src <url>` | Update image source URL | No |
| `--image-alt <text>` | Update image alt text | No |
| `--image-positionx <pos>` | Update image X position | No |
| `--image-positiony <pos>` | Update image Y position | No |
| `--dry-run` | Preview changes without writing to file | No |

### Example Workflow

1. Create a new post with the creation tool
   ```bash
   bun run create -t muses
   ```

2. Later, update the post with new tags and set an updated date
   ```bash
   bun run update-post --file muses/2025-05-19-commodification.mdx --tags "photography,art,economics,critique" --updated-date "2025-05-20T08:15:00Z"
   ```