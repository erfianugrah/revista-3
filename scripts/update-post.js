#!/usr/bin/env node

/**
 * Update Post Tool for Revista
 * 
 * A command-line tool for updating frontmatter in existing content files.
 * This is particularly useful for modifying dates, tags, or other metadata
 * without changing the content itself.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

// Get the directory of the current script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const contentDir = path.join(rootDir, 'src', 'content');

// Set up Commander
const program = new Command();

program
  .name('update-post')
  .description(chalk.blue('Update frontmatter in existing content files'))
  .version('1.0.0')
  .requiredOption('--file <path>', 'path to the content file (relative to src/content)')
  .option('--title <title>', 'update the title')
  .option('--description <description>', 'update the description')
  .option('--tags <tags>', 'update tags (comma-separated)')
  .option('--author <author>', 'update the author name')
  .option('--pub-date <date>', 'update publication date (ISO format)')
  .option('--updated-date <date>', 'update or add updated date (ISO format)')
  .option('--remove-updated-date', 'remove the updated date field')
  .option('--image-src <src>', 'update image source URL')
  .option('--image-alt <alt>', 'update image alt text')
  .option('--image-positionx <position>', 'update image X position')
  .option('--image-positiony <position>', 'update image Y position')
  .option('--dry-run', 'preview changes without modifying the file')
  .parse(process.argv);

const options = program.opts();

/**
 * Main function
 */
async function main() {
  try {
    console.log(chalk.blue.bold('🔄 Revista Post Updater 🔄'));
    
    // Resolve the full file path
    const filePath = path.join(contentDir, options.file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`Error: File not found: ${filePath}`));
      console.log(chalk.yellow('Make sure the path is relative to src/content'));
      process.exit(1);
    }
    
    console.log(chalk.green(`\nUpdating: ${chalk.cyan(options.file)}\n`));
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Split content into frontmatter and body
    const parts = fileContent.split(/---\s*\n/);
    if (parts.length < 3) {
      console.error(chalk.red('Error: Invalid content file format. Expected frontmatter between --- delimiters.'));
      process.exit(1);
    }
    
    // Parse frontmatter
    let frontmatter;
    try {
      frontmatter = yaml.parse(parts[1]);
    } catch (error) {
      console.error(chalk.red('Error parsing frontmatter:'), error);
      process.exit(1);
    }
    
    // Store original frontmatter for comparison
    const originalFrontmatter = { ...frontmatter };
    
    // Update frontmatter based on options
    if (options.title) frontmatter.title = options.title;
    if (options.description) frontmatter.description = options.description;
    if (options.author) frontmatter.author = options.author;
    if (options.pubDate) frontmatter.pubDate = options.pubDate;
    
    // Handle tags
    if (options.tags) {
      // Convert tags to the [ 'tag1', 'tag2' ] format
      frontmatter.tags = `[ ${options.tags.split(',').map(tag => `'${tag.trim()}'`).join(', ')} ]`;
    }
    
    // Handle updated date
    if (options.removeUpdatedDate) {
      delete frontmatter.updatedDate;
    } else if (options.updatedDate) {
      frontmatter.updatedDate = options.updatedDate;
    }
    
    // Handle image properties
    if (options.imageSrc || options.imageAlt || options.imagePositionx || options.imagePositiony) {
      // Create image object if it doesn't exist
      if (!frontmatter.image) frontmatter.image = {};
      
      if (options.imageSrc) frontmatter.image.src = options.imageSrc;
      if (options.imageAlt) frontmatter.image.alt = options.imageAlt;
      if (options.imagePositionx) frontmatter.image.positionx = options.imagePositionx;
      if (options.imagePositiony) frontmatter.image.positiony = options.imagePositiony;
    }
    
    // Generate new frontmatter string with custom tags format
    let newFrontmatterStr = yaml.stringify(frontmatter, {
      keepSourceTokens: true,
      keepNodeTypes: true,
      lineWidth: 0
    });
    
    // Since tags is now a string pretending to be an array, we need to make sure it's formatted correctly
    newFrontmatterStr = newFrontmatterStr.replace(/tags: ['"]?\[(.+?)\]['"]?/g, 'tags: [$1]');
    
    // Create the updated content
    const updatedContent = `---\n${newFrontmatterStr}---\n${parts.slice(2).join('---\n')}`;
    
    // Show the changes
    console.log(chalk.yellow('Original Frontmatter:'));
    console.log(chalk.gray('---'));
    console.log(chalk.cyan(yaml.stringify(originalFrontmatter)));
    console.log(chalk.gray('---\n'));
    
    console.log(chalk.yellow('Updated Frontmatter:'));
    console.log(chalk.gray('---'));
    console.log(chalk.cyan(newFrontmatterStr));
    console.log(chalk.gray('---'));
    
    // Check if there are any changes
    if (JSON.stringify(originalFrontmatter) === JSON.stringify(frontmatter)) {
      console.log(chalk.yellow('\nNo changes detected. Frontmatter is unchanged.'));
      return;
    }
    
    if (options.dryRun) {
      console.log(chalk.yellow('\nDry run - no changes written to file.'));
      return;
    }
    
    // Write the updated content back to file
    fs.writeFileSync(filePath, updatedContent);
    console.log(chalk.green(`\n✅ File updated: ${chalk.cyan(options.file)}`));
    
  } catch (error) {
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
}

// Run the main function
main();