import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { getSafeStorage } from "./utils/safeStorage";
import { getRegisteredRuntimeAPIs } from "@/contexts/runtimeAPIRegistry";

/**
 * Worktree defaults for a project.
 * Used when creating new worktree sessions.
 */
export interface WorktreeDefaults {
    /** Prefix for generated branch names (e.g., "feature/", "fix/") */
    branchPrefix?: string;
    /** Base branch to create worktrees from (e.g., "main", "develop") */
    baseBranch?: string;
    /** Auto-create worktree when creating new session */
    autoCreateWorktree?: boolean;
    /** Setup commands to run after worktree creation */
    setupCommands?: string[];
}

/**
 * A project entry representing a directory that can be opened in OpenChamber.
 */
export interface ProjectEntry {
    /** Unique identifier for the project */
    id: string;
    /** Normalized absolute path to the project directory */
    path: string;
    /** Optional display name (defaults to directory name) */
    label?: string;
    /** Timestamp when the project was added */
    addedAt?: number;
    /** Timestamp when the project was last opened */
    lastOpenedAt?: number;
    /** Worktree defaults for this project */
    worktreeDefaults?: WorktreeDefaults;
}

interface ProjectsState {
    /** List of all projects */
    projects: ProjectEntry[];
    /** Currently active project ID */
    activeProjectId: string | null;
    /** Whether the store has been initialized */
    isInitialized: boolean;
    /** Error message if any */
    error: string | null;
}

interface ProjectsActions {
    /** Initialize the store and load projects from storage */
    initialize: () => Promise<void>;
    /** Add a new project */
    addProject: (path: string, options?: { label?: string }) => Promise<ProjectEntry | null>;
    /** Remove a project by ID */
    removeProject: (id: string) => Promise<void>;
    /** Set the active project */
    setActiveProject: (id: string | null) => Promise<void>;
    /** Rename a project */
    renameProject: (id: string, label: string) => void;
    /** Reorder projects in the list */
    reorderProjects: (fromIndex: number, toIndex: number) => void;
    /** Validate a project path */
    validateProjectPath: (path: string) => Promise<{ valid: boolean; normalized: string; error?: string }>;
    /** Update worktree defaults for a project */
    updateWorktreeDefaults: (projectId: string, defaults: Partial<WorktreeDefaults>) => void;
    /** Get a project by ID */
    getProject: (id: string) => ProjectEntry | undefined;
    /** Get the active project */
    getActiveProject: () => ProjectEntry | undefined;
    /** Get a project by path */
    getProjectByPath: (path: string) => ProjectEntry | undefined;
    /** Clear any errors */
    clearError: () => void;
}

type ProjectsStore = ProjectsState & ProjectsActions;

/**
 * Generate a unique ID for a project.
 */
const generateProjectId = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 9);
    return `proj_${timestamp}_${random}`;
};

/**
 * Normalize a file path for consistent comparison.
 * - Expands tilde (~) to home directory (when possible)
 * - Converts backslashes to forward slashes
 * - Removes trailing slashes (except for root "/")
 * - Trims whitespace
 */
const normalizePath = (value: string | null | undefined, homeDirectory?: string): string | null => {
    if (typeof value !== "string") {
        return null;
    }

    let trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    // Expand tilde if home directory is provided
    if (trimmed.startsWith("~/") && homeDirectory) {
        trimmed = homeDirectory + trimmed.slice(1);
    } else if (trimmed === "~" && homeDirectory) {
        trimmed = homeDirectory;
    }

    // Convert backslashes to forward slashes (Windows compatibility)
    const replaced = trimmed.replace(/\\/g, "/");

    // Handle root path
    if (replaced === "/") {
        return "/";
    }

    // Remove trailing slashes
    return replaced.length > 1 ? replaced.replace(/\/+$/, "") : replaced;
};

/**
 * Extract the directory name from a path.
 */
const getDirectoryName = (path: string): string => {
    const normalized = normalizePath(path);
    if (!normalized) {
        return "Unknown";
    }
    const parts = normalized.split("/").filter(Boolean);
    return parts[parts.length - 1] || normalized;
};

/**
 * Persist projects to server settings via API.
 * Projects are stored as part of the OpenChamber configuration.
 */
const persistProjectsToServer = async (projects: ProjectEntry[]): Promise<void> => {
    try {
        const response = await fetch("/api/config/settings", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ projects }),
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
    } catch (error) {
        console.warn("[ProjectsStore] Failed to persist projects to server:", error);
    }
};

/**
 * Load projects from server settings via API.
 */
const loadProjectsFromServer = async (): Promise<ProjectEntry[] | null> => {
    try {
        const response = await fetch("/api/config/settings", {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (Array.isArray(data?.projects)) {
            return data.projects as ProjectEntry[];
        }
        return null;
    } catch (error) {
        console.warn("[ProjectsStore] Failed to load projects from server:", error);
        return null;
    }
};

/**
 * Load projects from VSCode runtime settings.
 */
const loadFromVSCodeSettings = async (): Promise<ProjectEntry[] | null> => {
    const runtimeSettings = getRegisteredRuntimeAPIs()?.settings;
    if (!runtimeSettings) {
        return null;
    }

    try {
        const result = await runtimeSettings.load();
        const data = result?.settings;
        if (data && Array.isArray(data.projects)) {
            return data.projects as ProjectEntry[];
        }
        return null;
    } catch (error) {
        console.warn("[ProjectsStore] Failed to load projects from VSCode settings:", error);
        return null;
    }
};

/**
 * Validate that a path exists and is a directory.
 * Uses the server API when available.
 */
const validateDirectoryExists = async (path: string): Promise<boolean> => {
    try {
        // Try using server API
        const response = await fetch(`/api/fs/stat?path=${encodeURIComponent(path)}`, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (response.ok) {
            const data = await response.json();
            return data.isDirectory === true;
        }

        // Fallback: assume valid if we can't check
        return true;
    } catch {
        // If server isn't available, assume valid
        return true;
    }
};

export const useProjectsStore = create<ProjectsStore>()(
    devtools(
        persist(
            (set, get) => ({
                // State
                projects: [],
                activeProjectId: null,
                isInitialized: false,
                error: null,

                // Actions
                initialize: async () => {
                    if (get().isInitialized) {
                        return;
                    }

                    try {
                        // Try loading from server settings first (most authoritative)
                        const serverProjects = await loadProjectsFromServer();
                        if (serverProjects && serverProjects.length > 0) {
                            set({
                                projects: serverProjects,
                                isInitialized: true,
                            });
                            return;
                        }

                        // Try VSCode runtime settings
                        const vscodeProjects = await loadFromVSCodeSettings();
                        if (vscodeProjects && vscodeProjects.length > 0) {
                            set({
                                projects: vscodeProjects,
                                isInitialized: true,
                            });
                            return;
                        }

                        // Use persisted state from localStorage (handled by Zustand persist)
                        set({ isInitialized: true });
                    } catch (error) {
                        console.error("[ProjectsStore] Failed to initialize:", error);
                        set({
                            isInitialized: true,
                            error: "Failed to load projects",
                        });
                    }
                },

                addProject: async (path: string, options?: { label?: string }) => {
                    const normalized = normalizePath(path);
                    if (!normalized) {
                        set({ error: "Invalid path provided" });
                        return null;
                    }

                    // Check for duplicates
                    const { projects } = get();
                    const existingProject = projects.find(
                        (p) => normalizePath(p.path) === normalized
                    );
                    if (existingProject) {
                        // Update lastOpenedAt and return existing
                        const updatedProjects = projects.map((p) =>
                            p.id === existingProject.id
                                ? { ...p, lastOpenedAt: Date.now() }
                                : p
                        );
                        set({ projects: updatedProjects });
                        await persistProjectsToServer(updatedProjects);
                        return existingProject;
                    }

                    // Validate path exists
                    const isValid = await validateDirectoryExists(normalized);
                    if (!isValid) {
                        set({ error: `Directory does not exist: ${normalized}` });
                        return null;
                    }

                    const newProject: ProjectEntry = {
                        id: generateProjectId(),
                        path: normalized,
                        label: options?.label || getDirectoryName(normalized),
                        addedAt: Date.now(),
                        lastOpenedAt: Date.now(),
                    };

                    const updatedProjects = [newProject, ...projects];
                    set({ projects: updatedProjects, error: null });
                    await persistProjectsToServer(updatedProjects);

                    return newProject;
                },

                removeProject: async (id: string) => {
                    const { projects, activeProjectId } = get();
                    const updatedProjects = projects.filter((p) => p.id !== id);

                    const newActiveId = activeProjectId === id
                        ? (updatedProjects[0]?.id ?? null)
                        : activeProjectId;

                    set({
                        projects: updatedProjects,
                        activeProjectId: newActiveId,
                        error: null,
                    });
                    await persistProjectsToServer(updatedProjects);
                },

                setActiveProject: async (id: string | null) => {
                    if (id === null) {
                        set({ activeProjectId: null });
                        return;
                    }

                    const { projects } = get();
                    const project = projects.find((p) => p.id === id);

                    if (!project) {
                        set({ error: `Project not found: ${id}` });
                        return;
                    }

                    // Update lastOpenedAt
                    const updatedProjects = projects.map((p) =>
                        p.id === id ? { ...p, lastOpenedAt: Date.now() } : p
                    );

                    set({
                        activeProjectId: id,
                        projects: updatedProjects,
                        error: null,
                    });
                    await persistProjectsToServer(updatedProjects);
                },

                renameProject: (id: string, label: string) => {
                    const { projects } = get();
                    const updatedProjects = projects.map((p) =>
                        p.id === id ? { ...p, label: label.trim() || getDirectoryName(p.path) } : p
                    );

                    set({ projects: updatedProjects, error: null });
                    void persistProjectsToServer(updatedProjects);
                },

                reorderProjects: (fromIndex: number, toIndex: number) => {
                    const { projects } = get();
                    if (
                        fromIndex < 0 ||
                        fromIndex >= projects.length ||
                        toIndex < 0 ||
                        toIndex >= projects.length
                    ) {
                        return;
                    }

                    const reorderedProjects = [...projects];
                    const [removed] = reorderedProjects.splice(fromIndex, 1);
                    reorderedProjects.splice(toIndex, 0, removed);

                    set({ projects: reorderedProjects });
                    void persistProjectsToServer(reorderedProjects);
                },

                validateProjectPath: async (path: string) => {
                    const normalized = normalizePath(path);
                    if (!normalized) {
                        return { valid: false, normalized: "", error: "Invalid path" };
                    }

                    // Check for duplicates
                    const { projects } = get();
                    const existingProject = projects.find(
                        (p) => normalizePath(p.path) === normalized
                    );
                    if (existingProject) {
                        return { valid: true, normalized, error: "Project already exists" };
                    }

                    // Validate path exists
                    const isValid = await validateDirectoryExists(normalized);
                    if (!isValid) {
                        return { valid: false, normalized, error: "Directory does not exist" };
                    }

                    return { valid: true, normalized };
                },

                updateWorktreeDefaults: (projectId: string, defaults: Partial<WorktreeDefaults>) => {
                    const { projects } = get();
                    const updatedProjects = projects.map((p) => {
                        if (p.id !== projectId) {
                            return p;
                        }
                        return {
                            ...p,
                            worktreeDefaults: {
                                ...p.worktreeDefaults,
                                ...defaults,
                            },
                        };
                    });

                    set({ projects: updatedProjects });
                    void persistProjectsToServer(updatedProjects);
                },

                getProject: (id: string) => {
                    const { projects } = get();
                    return projects.find((p) => p.id === id);
                },

                getActiveProject: () => {
                    const { projects, activeProjectId } = get();
                    if (!activeProjectId) {
                        return undefined;
                    }
                    return projects.find((p) => p.id === activeProjectId);
                },

                getProjectByPath: (path: string) => {
                    const normalized = normalizePath(path);
                    if (!normalized) {
                        return undefined;
                    }
                    const { projects } = get();
                    return projects.find((p) => normalizePath(p.path) === normalized);
                },

                clearError: () => {
                    set({ error: null });
                },
            }),
            {
                name: "projects-store",
                storage: createJSONStorage(() => getSafeStorage()),
                partialize: (state) => ({
                    projects: state.projects,
                    activeProjectId: state.activeProjectId,
                }),
            }
        ),
        {
            name: "projects-store",
        }
    )
);

// Declare global type for cross-store access
declare global {
    interface Window {
        __zustand_projects_store__?: typeof useProjectsStore;
    }
}

// Register store globally for cross-store access
if (typeof window !== "undefined") {
    window.__zustand_projects_store__ = useProjectsStore;
}
