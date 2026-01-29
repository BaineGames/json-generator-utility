import { faker } from '@faker-js/faker';

/**
 * Resolves a faker method path string to the actual faker function and calls it.
 * @param {string} methodPath - Dot-notation path like "person.firstName"
 * @param {object} [args] - Optional arguments to pass to the faker method
 * @returns {*} The generated fake value
 */
export function resolveFaker(methodPath, args) {
  const parts = methodPath.split('.');

  let current = faker;
  for (const part of parts) {
    if (current[part] === undefined) {
      throw new Error(`Invalid faker method path: "${methodPath}". "${part}" does not exist.`);
    }
    current = current[part];
  }

  if (typeof current !== 'function') {
    throw new Error(`Faker path "${methodPath}" does not resolve to a callable method.`);
  }

  return args ? current(args) : current();
}
