import { readFile } from 'fs/promises';

/**
 * Parses and validates a schema file.
 * @param {string} filePath - Path to the schema JSON file
 * @returns {Promise<object>} The normalized schema object
 */
export async function parseSchema(filePath) {
  let content;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Schema file not found: ${filePath}`);
    }
    throw new Error(`Failed to read schema file: ${err.message}`);
  }

  let schema;
  try {
    schema = JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON in schema file: ${err.message}`);
  }

  return validateAndNormalize(schema);
}

/**
 * Validates the schema structure and applies defaults.
 * @param {object} schema - The raw schema object
 * @returns {object} The normalized schema
 */
function validateAndNormalize(schema) {
  if (typeof schema !== 'object' || schema === null) {
    throw new Error('Schema must be a JSON object');
  }

  // Validate count
  if (schema.count === undefined) {
    throw new Error('Schema must have a "count" field');
  }
  if (typeof schema.count !== 'number' || schema.count < 1 || !Number.isInteger(schema.count)) {
    throw new Error('"count" must be a positive integer');
  }

  // Validate template
  if (schema.template === undefined) {
    throw new Error('Schema must have a "template" field');
  }

  // Normalize filename (default to "output.json")
  const filename = schema.filename ?? 'output.json';
  if (typeof filename !== 'string') {
    throw new Error('"filename" must be a string');
  }

  return {
    count: schema.count,
    filename,
    template: schema.template
  };
}
