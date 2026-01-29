#!/usr/bin/env node

import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { parseSchema } from './src/schema-parser.js';
import { generateRecord } from './src/data-generator.js';

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const separateFiles = args.includes('--separate-files');
  const positionalArgs = args.filter(arg => !arg.startsWith('--'));

  if (positionalArgs.length < 2) {
    console.error('Usage: node generate.js <schema.json> <output-folder> [--separate-files]');
    console.error('');
    console.error('Options:');
    console.error('  --separate-files  Generate one file per record instead of a single array');
    process.exit(1);
  }

  const [schemaPath, outputFolder] = positionalArgs;

  // Validate schema file exists
  if (!existsSync(schemaPath)) {
    console.error(`Error: Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  // Parse schema
  let schema;
  try {
    schema = await parseSchema(schemaPath);
  } catch (err) {
    console.error(`Error parsing schema: ${err.message}`);
    process.exit(1);
  }

  // Create output directory
  try {
    await mkdir(outputFolder, { recursive: true });
  } catch (err) {
    console.error(`Error creating output directory: ${err.message}`);
    process.exit(1);
  }

  // Generate records
  console.log(`Generating ${schema.count} records...`);
  const records = [];

  for (let i = 0; i < schema.count; i++) {
    try {
      const record = generateRecord(schema.template, i);
      records.push(record);
    } catch (err) {
      console.error(`Error generating record ${i + 1}: ${err.message}`);
      process.exit(1);
    }
  }

  // Write output
  try {
    if (separateFiles) {
      await writeSeparateFiles(records, schema.filename, outputFolder);
    } else {
      await writeSingleFile(records, schema.filename, outputFolder);
    }
  } catch (err) {
    console.error(`Error writing output: ${err.message}`);
    process.exit(1);
  }

  console.log('Done!');
}

/**
 * Writes all records to a single JSON file as an array.
 */
async function writeSingleFile(records, filename, outputFolder) {
  // Remove {{index}} placeholder and any adjacent separator for single-file mode
  let cleanFilename = filename.replace(/[-_]?\{\{index\}\}[-_]?/g, '');
  // If filename became empty or just an extension, use a default
  if (!cleanFilename || cleanFilename === '.json') {
    cleanFilename = 'output.json';
  }
  const outputPath = join(outputFolder, cleanFilename);

  await writeFile(outputPath, JSON.stringify(records, null, 2));
  console.log(`Written ${records.length} records to ${outputPath}`);
}

/**
 * Writes each record to a separate JSON file.
 */
async function writeSeparateFiles(records, filenameTemplate, outputFolder) {
  for (let i = 0; i < records.length; i++) {
    const index = String(i + 1).padStart(3, '0');
    const filename = filenameTemplate.replace(/\{\{index\}\}/g, index);
    const outputPath = join(outputFolder, filename);

    await writeFile(outputPath, JSON.stringify(records[i], null, 2));
  }
  console.log(`Written ${records.length} separate files to ${outputFolder}`);
}

main();
