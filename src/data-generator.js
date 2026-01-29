import { resolveFaker } from './faker-resolver.js';

/**
 * Generates a single record from a template.
 * @param {*} template - The template to process
 * @param {number} index - The current record index (0-based)
 * @returns {*} The generated data
 */
export function generateRecord(template, index) {
  return processValue(template, index);
}

/**
 * Recursively processes a template value.
 * @param {*} value - The value to process
 * @param {number} index - The current record index
 * @returns {*} The processed value
 */
function processValue(value, index) {
  // Null or undefined - return as-is
  if (value === null || value === undefined) {
    return value;
  }

  // Primitive types - return as-is
  if (typeof value !== 'object') {
    return value;
  }

  // Arrays - process each element
  if (Array.isArray(value)) {
    return value.map(item => processValue(item, index));
  }

  // Objects with special directives
  if (value.$faker !== undefined) {
    return resolveFaker(value.$faker, value.args);
  }

  if (value.$array !== undefined) {
    return processArray(value.$array, index);
  }

  if (value.$oneOf !== undefined) {
    return processOneOf(value.$oneOf, index);
  }

  if (value.$nullable !== undefined) {
    return processNullable(value.$nullable, index);
  }

  // Regular object - process each property
  const result = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = processValue(val, index);
  }
  return result;
}

/**
 * Processes a $array directive.
 * @param {object} config - The array configuration
 * @param {number} index - The current record index
 * @returns {Array} The generated array
 */
function processArray(config, index) {
  let count;

  if (config.count !== undefined) {
    count = config.count;
  } else if (config.min !== undefined && config.max !== undefined) {
    count = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
  } else {
    throw new Error('$array requires either "count" or both "min" and "max"');
  }

  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(processValue(config.element, index));
  }
  return result;
}

/**
 * Processes a $oneOf directive.
 * @param {Array} options - The array of options to choose from
 * @param {number} index - The current record index
 * @returns {*} A randomly selected and processed option
 */
function processOneOf(options, index) {
  if (!Array.isArray(options) || options.length === 0) {
    throw new Error('$oneOf requires a non-empty array of options');
  }

  const selected = options[Math.floor(Math.random() * options.length)];
  return processValue(selected, index);
}

/**
 * Processes a $nullable directive.
 * @param {object} config - The nullable configuration
 * @param {number} index - The current record index
 * @returns {*} Either null or the processed value
 */
function processNullable(config, index) {
  const probability = config.probability ?? 0.5;

  if (Math.random() < probability) {
    return null;
  }

  return processValue(config.value, index);
}
