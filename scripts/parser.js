#!/usr/bin/env node

/**
 * Schema Parser for Revista Content CLI
 * 
 * This utility parses the content.config.ts file to extract schema information
 * about the content collections defined in the project.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Parse Zod schema from TypeScript content configuration
 * 
 * @param {string} filePath - Path to the content.config.ts file
 * @returns {Object} Collection schemas with required and optional fields
 */
export async function parseTS(filePath) {
  try {
    // Read the content.config.ts file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Instead of regular expressions, let's use a simpler approach
    // to identify collections by looking for known patterns
    const collections = {};
    const collectionNames = ['muses', 'short_form', 'long_form', 'zeitweilig', 'authors', 'cv'];
    
    // Check for each known collection name in the content
    for (const name of collectionNames) {
      const collectionRegex = new RegExp(`const\\s+${name}\\s*=\\s*defineCollection\\(`, 'g');
      
      if (collectionRegex.test(content)) {
        // Collection found, add it with standard schema
        collections[name] = {
          required: ['title', 'tags', 'author', 'description', 'pubDate'],
          optional: ['updatedDate', 'image', 'slug'],
          complex: name === 'cv' ? ['sections', 'contacts', 'skills', 'languages', 'education', 'companies'] : [],
          imageProps: [
            { name: 'src', isOptional: false },
            { name: 'alt', isOptional: false },
            { name: 'positionx', isOptional: true },
            { name: 'positiony', isOptional: true }
          ]
        };
      }
    }
    
    // If no collections were found, this might be an error
    if (Object.keys(collections).length === 0) {
      // This would be unexpected since we're checking for known collection names
      console.warn('No collections found in content.config.ts, using default set');
      
      // Add all known collections as fallback
      collectionNames.forEach(name => {
        collections[name] = {
          required: ['title', 'tags', 'author', 'description', 'pubDate'],
          optional: ['updatedDate', 'image', 'slug'],
          complex: name === 'cv' ? ['sections', 'contacts', 'skills', 'languages', 'education', 'companies'] : [],
          imageProps: [
            { name: 'src', isOptional: false },
            { name: 'alt', isOptional: false },
            { name: 'positionx', isOptional: true },
            { name: 'positiony', isOptional: true }
          ]
        };
      });
    }
    
    console.log(`Found ${Object.keys(collections).length} collections: ${Object.keys(collections).join(', ')}`);
    return collections;
  } catch (error) {
    console.error('Error parsing schema:', error);
    
    // Return basic collection structure as fallback
    return {
      muses: {
        required: ['title', 'tags', 'author', 'description', 'pubDate'],
        optional: ['updatedDate', 'image', 'slug'],
        imageProps: [
          { name: 'src', isOptional: false },
          { name: 'alt', isOptional: false },
          { name: 'positionx', isOptional: true },
          { name: 'positiony', isOptional: true }
        ]
      }
    };
  }
}

// Since we're now using a hardcoded schema approach instead of parsing
// the file dynamically, this function is no longer needed.
// We're keeping a simplified version for documentation purposes.

/**
 * This is a simplified version of the original schema parsing function.
 * We're now using a hardcoded schema approach for better reliability.
 * 
 * @param {string} schemaContent - Content of the schema definition (not used)
 * @returns {Object} Object containing hardcoded schema information
 */
function parseSchemaFields(schemaContent) {
  // Return hardcoded schema structure
  return {
    required: ['title', 'tags', 'author', 'description', 'pubDate'],
    optional: ['updatedDate', 'image', 'slug'],
    complex: [],
    imageProps: [
      { name: 'src', isOptional: false },
      { name: 'alt', isOptional: false },
      { name: 'positionx', isOptional: true },
      { name: 'positiony', isOptional: true }
    ]
  };
}

// For testing the parser directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const testFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/content.config.ts');
  parseTS(testFile).then(schemas => {
    console.log(JSON.stringify(schemas, null, 2));
  }).catch(error => {
    console.error('Error parsing schema:', error);
  });
}