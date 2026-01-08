/**
 * Utility for reading and managing .openchamber/openchamber.json config files.
 * These configs contain project-specific settings like worktree setup commands.
 */

import { opencodeClient } from '@/lib/opencode/client';

const OPENCHAMBER_DIR = '.openchamber';
const CONFIG_FILENAME = 'openchamber.json';

/**
 * Configuration stored in .openchamber/openchamber.json
 */
export interface OpenchamberConfig {
  /** Commands to run after creating a worktree */
  'setup-worktree'?: string[];
  /** Additional custom configuration */
  [key: string]: unknown;
}

/**
 * Normalize a path for consistent handling.
 */
const normalizePath = (value: string): string => {
  if (!value) {
    return '';
  }
  const replaced = value.replace(/\\/g, '/');
  if (replaced === '/') {
    return '/';
  }
  return replaced.replace(/\/+$/, '');
};

/**
 * Join path segments.
 */
const joinPath = (base: string, ...segments: string[]): string => {
  const normalizedBase = normalizePath(base);
  const result = segments.reduce((current, segment) => {
    const sanitized = segment.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
    if (!current || current === '/') {
      return `/${sanitized}`;
    }
    return `${current}/${sanitized}`;
  }, normalizedBase);
  return result;
};

/**
 * Get the path to the openchamber config file for a project.
 */
export function getConfigPath(projectDirectory: string): string {
  return joinPath(projectDirectory, OPENCHAMBER_DIR, CONFIG_FILENAME);
}

/**
 * Read the openchamber config for a project.
 * Returns null if the config file doesn't exist or can't be read.
 */
export async function readOpenchamberConfig(
  projectDirectory: string
): Promise<OpenchamberConfig | null> {
  const configPath = getConfigPath(projectDirectory);

  try {
    const content = await opencodeClient.readFile(configPath);
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn('[OpenchamberConfig] Invalid config format:', configPath);
      return null;
    }

    return parsed as OpenchamberConfig;
  } catch (error) {
    // File doesn't exist or can't be read - this is expected for new projects
    return null;
  }
}

/**
 * Get the setup commands for worktree creation.
 * Returns an empty array if no commands are configured.
 */
export async function getWorktreeSetupCommands(
  projectDirectory: string
): Promise<string[]> {
  const config = await readOpenchamberConfig(projectDirectory);
  if (!config || !Array.isArray(config['setup-worktree'])) {
    return [];
  }
  return config['setup-worktree'].filter(
    (cmd): cmd is string => typeof cmd === 'string' && cmd.trim().length > 0
  );
}

/**
 * Variable substitutions for setup commands.
 */
export interface SetupCommandContext {
  /** Path to the root worktree (main project directory) */
  rootWorktreePath: string;
  /** Path to the new worktree being created */
  worktreePath: string;
  /** Branch name of the new worktree */
  branchName: string;
}

/**
 * Process setup command template variables.
 * Supports:
 * - $ROOT_WORKTREE_PATH - Path to the main project directory
 * - $WORKTREE_PATH - Path to the new worktree
 * - $BRANCH_NAME - Name of the worktree branch
 */
export function processSetupCommand(
  command: string,
  context: SetupCommandContext
): string {
  return command
    .replace(/\$ROOT_WORKTREE_PATH/g, context.rootWorktreePath)
    .replace(/\$WORKTREE_PATH/g, context.worktreePath)
    .replace(/\$BRANCH_NAME/g, context.branchName);
}

/**
 * Process all setup commands with variable substitutions.
 */
export function processSetupCommands(
  commands: string[],
  context: SetupCommandContext
): string[] {
  return commands.map((cmd) => processSetupCommand(cmd, context));
}
