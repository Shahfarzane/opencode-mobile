/**
 * Worktree Session Creator
 * Creates new sessions with associated git worktrees for isolated development environments.
 */

import { checkIsGitRepository } from '@/lib/gitApi';
import { generateUniqueBranchName, generateBranchSlug } from '@/lib/git/branchNameGenerator';
import { createWorktree, type CreateWorktreeOptions } from '@/lib/git/worktreeService';
import { getWorktreeSetupCommands, processSetupCommands, type SetupCommandContext } from '@/lib/openchamberConfig';
import { useSessionStore } from '@/stores/sessionStore';
import { useProjectsStore } from '@/stores/useProjectsStore';
import type { WorktreeDefaults } from '@/stores/useProjectsStore';
import { opencodeClient } from '@/lib/opencode/client';

/**
 * Options for creating a worktree session.
 */
export interface CreateWorktreeSessionOptions {
  /** Project directory (required) */
  projectDirectory: string;
  /** Optional session title */
  title?: string;
  /** Override worktree defaults from project settings */
  worktreeDefaults?: Partial<WorktreeDefaults>;
}

/**
 * Result of creating a worktree session.
 */
export interface CreateWorktreeSessionResult {
  /** Created session ID */
  sessionId: string;
  /** Worktree path */
  worktreePath: string;
  /** Branch name */
  branchName: string;
}

// Track ongoing creation to prevent concurrent creations
let isCreating = false;

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
 * Run setup commands for a newly created worktree.
 * Commands are run asynchronously and non-blocking.
 * Note: Currently logs commands. Full execution will be enabled when
 * the desktop API supports command execution.
 */
async function runSetupCommands(
  worktreePath: string,
  commands: string[]
): Promise<void> {
  if (commands.length === 0) {
    return;
  }

  console.log('[WorktreeSessionCreator] Setup commands for worktree:', {
    path: worktreePath,
    commands,
  });

  // TODO: Implement command execution when desktop API supports it
  // For now, just log the commands that should be run
  for (const command of commands) {
    console.log(`[WorktreeSessionCreator] Would execute: ${command} in ${worktreePath}`);
  }
}

/**
 * Create a new session with an associated git worktree.
 *
 * This function:
 * 1. Validates the project is a git repository
 * 2. Gets worktree defaults from project settings
 * 3. Generates a unique branch name
 * 4. Creates a git worktree in .openchamber/{slug}
 * 5. Creates a session associated with the worktree path
 * 6. Runs setup commands (async, non-blocking)
 *
 * @param options - Options for creating the worktree session
 * @returns The created session result, or null if creation failed
 */
export async function createWorktreeSession(
  options: CreateWorktreeSessionOptions
): Promise<CreateWorktreeSessionResult | null> {
  // Prevent concurrent creations
  if (isCreating) {
    console.warn('[WorktreeSessionCreator] Already creating a worktree session');
    return null;
  }

  isCreating = true;

  try {
    const { projectDirectory, title, worktreeDefaults: overrideDefaults } = options;
    const normalizedProject = normalizePath(projectDirectory);

    if (!normalizedProject) {
      console.error('[WorktreeSessionCreator] Invalid project directory');
      return null;
    }

    // Step 1: Validate project is a git repository
    const isGitRepo = await checkIsGitRepository(normalizedProject);
    if (!isGitRepo) {
      console.error('[WorktreeSessionCreator] Project is not a git repository:', normalizedProject);
      return null;
    }

    // Step 2: Get worktree defaults from project settings
    const projectsStore = useProjectsStore.getState();
    const project = projectsStore.getProjectByPath(normalizedProject);
    const projectDefaults = project?.worktreeDefaults ?? {};

    // Merge defaults (override takes precedence)
    const defaults: WorktreeDefaults = {
      ...projectDefaults,
      ...overrideDefaults,
    };

    const branchPrefix = defaults.branchPrefix;
    const baseBranch = defaults.baseBranch || 'HEAD';

    // Step 3: Generate unique branch name
    const branchName = await generateUniqueBranchName(normalizedProject, branchPrefix);
    if (!branchName) {
      console.error('[WorktreeSessionCreator] Failed to generate unique branch name');
      return null;
    }

    // Generate a worktree slug from the branch name
    // Remove prefix if present and use the adjective-animal part
    const worktreeSlug = branchPrefix && branchName.startsWith(branchPrefix)
      ? branchName.substring(branchPrefix.length).replace(/^\//, '')
      : branchName;

    // Step 4: Create git worktree
    const worktreeOptions: CreateWorktreeOptions = {
      projectDirectory: normalizedProject,
      worktreeSlug,
      branch: branchName,
      createBranch: true,
      startPoint: baseBranch,
    };

    const worktreeMetadata = await createWorktree(worktreeOptions);

    // Step 5: Create session associated with worktree path
    const sessionStore = useSessionStore.getState();
    const sessionTitle = title || `Worktree: ${worktreeMetadata.label}`;

    // Create session in the worktree directory
    const session = await sessionStore.createSession(
      sessionTitle,
      worktreeMetadata.path,
      null // No parent session
    );

    if (!session) {
      console.error('[WorktreeSessionCreator] Failed to create session');
      return null;
    }

    // Associate worktree metadata with the session
    sessionStore.setWorktreeMetadata(session.id, worktreeMetadata);

    // Step 6: Run setup commands (async, non-blocking)
    const setupCommands = await getWorktreeSetupCommands(normalizedProject);
    if (setupCommands.length > 0) {
      const context: SetupCommandContext = {
        rootWorktreePath: normalizedProject,
        worktreePath: worktreeMetadata.path,
        branchName: branchName,
      };
      const processedCommands = processSetupCommands(setupCommands, context);

      // Run setup commands in background (don't await)
      void runSetupCommands(worktreeMetadata.path, processedCommands);
    }

    console.log('[WorktreeSessionCreator] Successfully created worktree session:', {
      sessionId: session.id,
      worktreePath: worktreeMetadata.path,
      branchName,
    });

    return {
      sessionId: session.id,
      worktreePath: worktreeMetadata.path,
      branchName,
    };
  } catch (error) {
    console.error('[WorktreeSessionCreator] Failed to create worktree session:', error);
    return null;
  } finally {
    isCreating = false;
  }
}

/**
 * Check if a worktree session creation is currently in progress.
 */
export function isCreatingWorktreeSession(): boolean {
  return isCreating;
}

/**
 * Get the default worktree settings for a project.
 */
export function getProjectWorktreeDefaults(projectDirectory: string): WorktreeDefaults | undefined {
  const normalizedProject = normalizePath(projectDirectory);
  if (!normalizedProject) {
    return undefined;
  }

  const projectsStore = useProjectsStore.getState();
  const project = projectsStore.getProjectByPath(normalizedProject);
  return project?.worktreeDefaults;
}
