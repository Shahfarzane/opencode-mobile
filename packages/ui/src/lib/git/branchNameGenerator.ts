/**
 * Branch name generator utility.
 * Generates Ubuntu-style adjective-animal pairs for unique branch names.
 */

import { getGitBranches } from '@/lib/gitApi';

/**
 * List of positive/descriptive adjectives for branch names.
 * Inspired by Ubuntu release naming conventions.
 */
const ADJECTIVES = [
  'artful',
  'bionic',
  'cosmic',
  'daring',
  'eager',
  'feisty',
  'groovy',
  'hardy',
  'impish',
  'jaunty',
  'karmic',
  'lucid',
  'maverick',
  'noble',
  'oneiric',
  'precise',
  'quantal',
  'raring',
  'saucy',
  'trusty',
  'utopic',
  'vivid',
  'wily',
  'xenial',
  'yakkety',
  'zesty',
  'agile',
  'bold',
  'clever',
  'dynamic',
  'elegant',
  'fluent',
  'graceful',
  'hasty',
  'iconic',
  'jovial',
  'keen',
  'lively',
  'mighty',
  'nimble',
  'optimal',
  'playful',
  'quick',
  'rapid',
  'swift',
  'tranquil',
  'unique',
  'valiant',
  'witty',
  'zippy',
];

/**
 * List of animals/creatures for branch names.
 * Inspired by Ubuntu release naming conventions.
 */
const NOUNS = [
  'aardvark',
  'beaver',
  'chipmunk',
  'dolphin',
  'eagle',
  'ferret',
  'gorilla',
  'hedgehog',
  'ibis',
  'jaguar',
  'koala',
  'lemur',
  'meerkat',
  'narwhal',
  'ocelot',
  'panda',
  'quetzal',
  'raccoon',
  'salamander',
  'toucan',
  'urchin',
  'viper',
  'wombat',
  'xerus',
  'yak',
  'zebra',
  'armadillo',
  'badger',
  'coyote',
  'dragonfly',
  'elk',
  'falcon',
  'gecko',
  'heron',
  'iguana',
  'jellyfish',
  'kingfisher',
  'lynx',
  'mantis',
  'newt',
  'octopus',
  'pelican',
  'quail',
  'robin',
  'starfish',
  'tiger',
  'unicorn',
  'vulture',
  'walrus',
  'xenops',
];

/**
 * Get a random element from an array.
 */
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generates a random branch slug (adjective-noun).
 *
 * @example
 * generateBranchSlug(); // "cosmic-dolphin"
 */
export function generateBranchSlug(): string {
  const adjective = getRandomElement(ADJECTIVES);
  const noun = getRandomElement(NOUNS);
  return `${adjective}-${noun}`;
}

/**
 * Generates a branch name with optional prefix.
 *
 * @param prefix - Optional prefix for the branch name (e.g., "feature/", "fix/")
 * @example
 * generateBranchName(); // "cosmic-dolphin"
 * generateBranchName("feature/"); // "feature/cosmic-dolphin"
 */
export function generateBranchName(prefix?: string): string {
  const slug = generateBranchSlug();
  if (prefix) {
    // Ensure prefix ends with / if it's not empty and doesn't end with /
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return `${normalizedPrefix}${slug}`;
  }
  return slug;
}

/**
 * Normalizes a branch prefix by ensuring proper formatting.
 *
 * @param prefix - The prefix to normalize
 * @returns Normalized prefix (removes leading/trailing slashes, spaces)
 */
const normalizePrefix = (prefix: string | undefined): string | undefined => {
  if (!prefix) {
    return undefined;
  }
  const trimmed = prefix.trim();
  if (!trimmed) {
    return undefined;
  }
  // Remove leading slashes
  let result = trimmed.replace(/^\/+/, '');
  // Ensure ends with /
  if (result && !result.endsWith('/')) {
    result = `${result}/`;
  }
  return result || undefined;
};

/**
 * Generates a unique branch name by checking existing branches.
 *
 * @param projectDirectory - The project directory to check for existing branches
 * @param prefix - Optional prefix for the branch name
 * @param maxAttempts - Maximum number of attempts to find a unique name (default: 20)
 * @returns A unique branch name, or null if couldn't generate one
 *
 * @example
 * await generateUniqueBranchName("/path/to/project"); // "cosmic-dolphin"
 * await generateUniqueBranchName("/path/to/project", "feature/"); // "feature/cosmic-dolphin"
 */
export async function generateUniqueBranchName(
  projectDirectory: string,
  prefix?: string,
  maxAttempts = 20
): Promise<string | null> {
  const normalizedPrefix = normalizePrefix(prefix);

  try {
    // Get existing branches
    const branches = await getGitBranches(projectDirectory);
    const existingBranchNames = new Set(
      branches.all.map((name) => {
        // Handle both simple branch names and ref paths
        if (name.startsWith('refs/heads/')) {
          return name.substring('refs/heads/'.length);
        }
        return name;
      })
    );

    // Try to generate unique name
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = generateBranchName(normalizedPrefix);
      if (!existingBranchNames.has(candidate)) {
        return candidate;
      }
    }

    // If all random attempts failed, add a timestamp suffix
    const timestampSuffix = Date.now().toString(36);
    const fallback = generateBranchName(normalizedPrefix);
    return `${fallback}-${timestampSuffix}`;
  } catch (error) {
    console.warn('[BranchNameGenerator] Failed to check existing branches:', error);
    // Fallback to timestamp-based unique name
    const timestampSuffix = Date.now().toString(36);
    return generateBranchName(normalizedPrefix) + `-${timestampSuffix}`;
  }
}

/**
 * Validates a branch name according to git rules.
 *
 * @param name - The branch name to validate
 * @returns Object with valid flag and optional error message
 */
export function validateBranchName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Branch name cannot be empty' };
  }

  const trimmed = name.trim();

  // Check for invalid characters
  if (/[\s~^:?*\[\]\\]/.test(trimmed)) {
    return { valid: false, error: 'Branch name contains invalid characters' };
  }

  // Check for leading/trailing dots or slashes
  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return { valid: false, error: 'Branch name cannot start or end with a dot' };
  }

  if (trimmed.startsWith('/') || trimmed.endsWith('/')) {
    return { valid: false, error: 'Branch name cannot start or end with a slash' };
  }

  // Check for consecutive dots or slashes
  if (/\.\./.test(trimmed) || /\/\//.test(trimmed)) {
    return { valid: false, error: 'Branch name cannot contain consecutive dots or slashes' };
  }

  // Check for @{
  if (/@\{/.test(trimmed)) {
    return { valid: false, error: 'Branch name cannot contain @{' };
  }

  // Check for ending with .lock
  if (trimmed.endsWith('.lock')) {
    return { valid: false, error: 'Branch name cannot end with .lock' };
  }

  return { valid: true };
}
