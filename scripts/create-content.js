#!/usr/bin/env node

/**
 * Revista Content Creator CLI
 * 
 * A command-line tool for creating new content files with the proper
 * frontmatter according to the schema defined in content.config.ts.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import { parseTS } from './parser.js';

// Get the directory of the current script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const contentConfigPath = path.join(rootDir, 'src', 'content.config.ts');
const contentDir = path.join(rootDir, 'src', 'content');

// Set up Commander
const program = new Command();

program
  .name('create-content')
  .description(chalk.blue('CLI to create content files for Revista with proper frontmatter'))
  .version('1.0.0')
  .option('-t, --type <type>', 'content type (muses, short_form, long_form, zeitweilig, authors, cv)')
  .option('-d, --dry-run', 'preview frontmatter without creating the file')
  .option('--debug', 'show debug information')
  .option('--non-interactive', 'run in non-interactive mode with provided options')
  .option('--title <title>', 'title for the content (for non-interactive mode)')
  .option('--tags <tags>', 'comma-separated tags (for non-interactive mode)')
  .option('--author <author>', 'author name (for non-interactive mode)')
  .option('--description <description>', 'content description (for non-interactive mode)')
  .option('--image-src <src>', 'image source URL (for non-interactive mode)')
  .option('--image-alt <alt>', 'image alt text (for non-interactive mode)')
  .option('--pub-date <date>', 'publication date in ISO format (for non-interactive mode)')
  .option('--updated-date <date>', 'updated date in ISO format (for non-interactive mode)')
  .parse(process.argv);

const options = program.opts();

/**
 * Generate a slug from a title
 * @param {string} title - The title to slugify
 * @returns {string} - URL-friendly slug
 */
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special characters
    .replace(/[\s_-]+/g, '-')   // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');   // Remove leading/trailing hyphens
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} - Formatted date string
 */
function getFormattedDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Main function to create content
 */
async function main() {
  try {
    console.log(chalk.blue.bold('🌟 Revista Content Creator 🌟'));
    console.log(chalk.gray('Creates content files with proper frontmatter based on content.config.ts\n'));

    // Parse schemas from content.config.ts
    const schemas = await parseTS(contentConfigPath);
    
    if (options.debug) {
      console.log(chalk.gray('Parsed schemas:'));
      console.log(schemas);
    }

    // Check for non-interactive mode
    if (options.nonInteractive) {
      if (!options.type || !options.title || !options.description) {
        console.error(chalk.red('Error: In non-interactive mode, --type, --title, and --description are required'));
        process.exit(1);
      }
      
      return handleNonInteractiveMode(schemas, options);
    }

    // Collect collection type
    let collectionType = options.type;
    if (!collectionType) {
      // Get available collections
      const collections = Object.keys(schemas);
      
      // If no collection type is specified, ask the user
      const response = await inquirer.prompt([
        {
          type: 'list',
          name: 'collectionType',
          message: 'Select content type:',
          choices: collections
        }
      ]);
      
      collectionType = response.collectionType;
    }
    
    // Validate collection type
    if (!schemas[collectionType]) {
      console.error(chalk.red(`Error: Collection type '${collectionType}' not found in schema.`));
      console.log(chalk.yellow(`Available collection types: ${Object.keys(schemas).join(', ')}`));
      process.exit(1);
    }
    
    console.log(chalk.green(`\nCreating new ${chalk.bold(collectionType)} content\n`));
    
    const schema = schemas[collectionType];
    
    // Prepare questions for inquirer
    const questions = [];
    
    // Start with title since we need it for the filename
    questions.push({
      type: 'input',
      name: 'title',
      message: `${chalk.cyan('Title:')}`,
      validate: input => input ? true : 'Title is required'
    });
    
    // Add required fields
    for (const field of schema.required) {
      // Skip title since we already asked
      if (field === 'title') continue;
      
      if (field === 'pubDate') {
        // Use current date as default for pubDate
        continue;
      } else if (field === 'tags') {
        questions.push({
          type: 'input',
          name: 'tags',
          message: `${chalk.cyan('Tags')} ${chalk.gray('(comma-separated)')}:`,
          default: collectionType,
          filter: input => input.split(',').map(tag => tag.trim())
        });
      } else if (field === 'author') {
        questions.push({
          type: 'input',
          name: 'author',
          message: `${chalk.cyan('Author:')}`,
          default: 'Erfi Anugrah'
        });
      } else if (field === 'description') {
        questions.push({
          type: 'input',
          name: 'description',
          message: `${chalk.cyan('Description:')}`,
          validate: input => input ? true : 'Description is required'
        });
      } else {
        // For any other required field
        questions.push({
          type: 'input',
          name: field,
          message: `${chalk.cyan(field + ':')}`,
          validate: input => input ? true : `${field} is required`
        });
      }
    }
    
    // Ask if user wants to include image
    questions.push({
      type: 'confirm',
      name: 'includeImage',
      message: 'Include image?',
      default: false
    });
    
    // Image properties if user wants to include image
    if (schema.imageProps) {
      const imageQuestions = schema.imageProps.map(prop => ({
        type: 'input',
        name: `image.${prop.name}`,
        message: `${chalk.cyan(`Image ${prop.name}:`)}`,
        when: answers => answers.includeImage,
        validate: input => {
          if (!prop.isOptional && !input) return `Image ${prop.name} is required`;
          return true;
        }
      }));
      
      questions.push(...imageQuestions);
    } else {
      // Default image properties
      questions.push(
        {
          type: 'input',
          name: 'image.src',
          message: `${chalk.cyan('Image src:')}`,
          when: answers => answers.includeImage,
          validate: input => input ? true : 'Image src is required'
        },
        {
          type: 'input',
          name: 'image.alt',
          message: `${chalk.cyan('Image alt:')}`,
          when: answers => answers.includeImage,
          validate: input => input ? true : 'Image alt is required'
        },
        {
          type: 'input',
          name: 'image.positionx',
          message: `${chalk.cyan('Image positionx:')} ${chalk.gray('(optional, e.g., center, 40%)')}`,
          when: answers => answers.includeImage
        },
        {
          type: 'input',
          name: 'image.positiony',
          message: `${chalk.cyan('Image positiony:')} ${chalk.gray('(optional, e.g., top, 20%)')}`,
          when: answers => answers.includeImage
        }
      );
    }
    
    // Get answers from user
    const answers = await inquirer.prompt(questions);
    
    // Process answers into frontmatter
    const frontmatter = {
      title: answers.title,
      pubDate: new Date().toISOString(),
      tags: answers.tags
    };
    
    // Add other fields from answers
    for (const [key, value] of Object.entries(answers)) {
      if (key === 'title' || key === 'tags' || key === 'includeImage') continue;
      
      if (key.startsWith('image.')) {
        // Handle image fields
        const [_, prop] = key.split('.');
        if (!frontmatter.image) frontmatter.image = {};
        frontmatter.image[prop] = value;
      } else {
        frontmatter[key] = value;
      }
    }
    
    // Optional slug based on title
    frontmatter.slug = slugify(answers.title);
    
    // Generate filename using date-slug.mdx pattern
    const date = getFormattedDate();
    const filename = `${date}-${frontmatter.slug}.mdx`;
    const filePath = path.join(contentDir, collectionType, filename);
    
    // Generate file content
    const yamlFrontmatter = yaml.stringify(frontmatter);
    const fileContent = `---
${yamlFrontmatter}---

Enter your content here.
`;

    // Show preview
    console.log(chalk.yellow('\nContent Preview:'));
    console.log(chalk.gray('---'));
    console.log(chalk.cyan(yamlFrontmatter));
    console.log(chalk.gray('---'));
    console.log(chalk.gray('Enter your content here.'));
    
    if (options.dryRun) {
      console.log(chalk.yellow('\nDry run - no file created.'));
      return;
    }
    
    // Confirm creation
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Create file at ${chalk.cyan(filePath)}?`,
        default: true
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.yellow('File creation cancelled.'));
      return;
    }
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, fileContent);
    console.log(chalk.green(`\n✅ File created: ${chalk.cyan(filePath)}`));
    
    // Show next steps
    console.log(chalk.blue('\nNext steps:'));
    console.log(`  1. ${chalk.cyan(`Edit ${filename}`)} to add your content`);
    console.log(`  2. Run ${chalk.cyan('bun run dev')} to preview your changes`);
    console.log(`  3. Run ${chalk.cyan('bun run build')} when ready to publish`);
    
  } catch (error) {
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
}

/**
 * Handle non-interactive mode for content creation
 */
function handleNonInteractiveMode(schemas, options) {
  const collectionType = options.type;
  
  // Validate collection type
  if (!schemas[collectionType]) {
    console.error(chalk.red(`Error: Collection type '${collectionType}' not found in schema.`));
    console.log(chalk.yellow(`Available collection types: ${Object.keys(schemas).join(', ')}`));
    process.exit(1);
  }
  
  console.log(chalk.green(`\nCreating new ${chalk.bold(collectionType)} content in non-interactive mode\n`));
  
  // Prepare frontmatter
  const frontmatter = {
    title: options.title,
    // Convert tags to the [ 'tag1', 'tag2' ] format
    tags: options.tags ? 
      `[ ${options.tags.split(',').map(tag => `'${tag.trim()}'`).join(', ')} ]` : 
      `[ '${collectionType}' ]`,
    author: options.author || 'Erfi Anugrah',
    description: options.description,
    pubDate: options.pubDate || new Date().toISOString(),
    slug: slugify(options.title)
  };
  
  // Add updated date if provided
  if (options.updatedDate) {
    frontmatter.updatedDate = options.updatedDate;
  }
  
  // Add image if provided
  if (options.imageSrc && options.imageAlt) {
    frontmatter.image = {
      src: options.imageSrc,
      alt: options.imageAlt
    };
  }
  
  // Generate filename using date-slug.mdx pattern
  // If pubDate is provided, use that date for the filename, otherwise use today's date
  let filenameDate;
  if (frontmatter.pubDate) {
    // Extract YYYY-MM-DD from the ISO date string
    const pubDate = new Date(frontmatter.pubDate);
    filenameDate = pubDate.toISOString().split('T')[0];
  } else {
    filenameDate = getFormattedDate();
  }
  
  const filename = `${filenameDate}-${frontmatter.slug}.mdx`;
  const filePath = path.join(contentDir, collectionType, filename);
  
  // Generate file content with custom tags format
  // For proper YAML serialization while keeping the tags in the desired format
  let yamlFrontmatter = yaml.stringify(frontmatter, {
    keepSourceTokens: true,
    keepNodeTypes: true,
    lineWidth: 0
  });
  
  // Since tags is now a string pretending to be an array, we need to make sure it's formatted correctly
  yamlFrontmatter = yamlFrontmatter.replace(/tags: ['"]?\[(.+?)\]['"]?/g, 'tags: [$1]');
  
  const fileContent = `---
${yamlFrontmatter}---

Enter your content here.
`;

  // Show preview
  console.log(chalk.yellow('\nContent Preview:'));
  console.log(chalk.gray('---'));
  console.log(chalk.cyan(yamlFrontmatter));
  console.log(chalk.gray('---'));
  console.log(chalk.gray('Enter your content here.'));
  
  if (options.dryRun) {
    console.log(chalk.yellow('\nDry run - no file created.'));
    console.log(chalk.gray(`Would create file: ${chalk.cyan(filePath)}`));
    return;
  }
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(filePath, fileContent);
  console.log(chalk.green(`\n✅ File created: ${chalk.cyan(filePath)}`));
  
  // Show next steps
  console.log(chalk.blue('\nNext steps:'));
  console.log(`  1. ${chalk.cyan(`Edit ${filename}`)} to add your content`);
  console.log(`  2. Run ${chalk.cyan('bun run dev')} to preview your changes`);
  console.log(`  3. Run ${chalk.cyan('bun run build')} when ready to publish`);
}

// Run the main function
main();