import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { useConnectionStore } from "./useConnectionStore";

const STORAGE_KEYS = {
	PROJECTS: "openchamber_projects",
	ACTIVE_PROJECT_ID: "openchamber_active_project_id",
} as const;

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
 * A project entry representing a directory that can be opened.
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
	/** Whether the store is currently loading */
	isLoading: boolean;
	/** Error message if any */
	error: string | null;
}

interface ProjectsActions {
	/** Initialize the store and load projects from storage/server */
	initialize: () => Promise<void>;
	/** Sync projects from the server */
	syncFromServer: () => Promise<void>;
	/** Add a new project (syncs to server) */
	addProject: (path: string, options?: { label?: string }) => Promise<ProjectEntry | null>;
	/** Remove a project by ID (syncs to server) */
	removeProject: (id: string) => Promise<void>;
	/** Set the active project */
	setActiveProject: (id: string | null) => Promise<void>;
	/** Rename a project */
	renameProject: (id: string, label: string) => Promise<void>;
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
 */
const normalizePath = (value: string | null | undefined): string | null => {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	// Convert backslashes to forward slashes
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
 * Save projects to local storage.
 */
const saveProjectsToStorage = async (projects: ProjectEntry[]): Promise<void> => {
	try {
		await SecureStore.setItemAsync(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
	} catch (error) {
		console.warn("[ProjectsStore] Failed to save projects to storage:", error);
	}
};

/**
 * Load projects from local storage.
 */
const loadProjectsFromStorage = async (): Promise<ProjectEntry[]> => {
	try {
		const raw = await SecureStore.getItemAsync(STORAGE_KEYS.PROJECTS);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				return parsed as ProjectEntry[];
			}
		}
	} catch (error) {
		console.warn("[ProjectsStore] Failed to load projects from storage:", error);
	}
	return [];
};

/**
 * Sync projects to server.
 */
const syncProjectsToServer = async (projects: ProjectEntry[]): Promise<void> => {
	const { serverUrl, authToken } = useConnectionStore.getState();
	if (!serverUrl || !authToken) {
		return;
	}

	try {
		await fetch(`${serverUrl}/api/config/settings`, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${authToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ projects }),
		});
	} catch (error) {
		console.warn("[ProjectsStore] Failed to sync projects to server:", error);
	}
};

/**
 * Fetch projects from server.
 */
const fetchProjectsFromServer = async (): Promise<ProjectEntry[] | null> => {
	const { serverUrl, authToken } = useConnectionStore.getState();
	if (!serverUrl || !authToken) {
		return null;
	}

	try {
		const response = await fetch(`${serverUrl}/api/config/settings`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${authToken}`,
				Accept: "application/json",
			},
		});

		if (response.ok) {
			const data = await response.json();
			if (Array.isArray(data?.projects)) {
				return data.projects as ProjectEntry[];
			}
		}
	} catch (error) {
		console.warn("[ProjectsStore] Failed to fetch projects from server:", error);
	}

	return null;
};

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
	// State
	projects: [],
	activeProjectId: null,
	isInitialized: false,
	isLoading: false,
	error: null,

	// Actions
	initialize: async () => {
		if (get().isInitialized) {
			return;
		}

		set({ isLoading: true });

		try {
			// First load from local storage for quick startup
			const localProjects = await loadProjectsFromStorage();
			const activeIdRaw = await SecureStore.getItemAsync(STORAGE_KEYS.ACTIVE_PROJECT_ID);

			set({
				projects: localProjects,
				activeProjectId: activeIdRaw || null,
				isInitialized: true,
				isLoading: false,
			});

			// Then sync from server in background
			void get().syncFromServer();
		} catch (error) {
			console.error("[ProjectsStore] Failed to initialize:", error);
			set({
				isInitialized: true,
				isLoading: false,
				error: "Failed to load projects",
			});
		}
	},

	syncFromServer: async () => {
		const serverProjects = await fetchProjectsFromServer();
		if (serverProjects && serverProjects.length > 0) {
			const { projects: localProjects } = get();

			// Merge server projects with local (server is authoritative)
			const mergedMap = new Map<string, ProjectEntry>();

			// Add local projects first
			localProjects.forEach((p) => {
				const normalized = normalizePath(p.path);
				if (normalized) {
					mergedMap.set(normalized, p);
				}
			});

			// Override with server projects (authoritative)
			serverProjects.forEach((p) => {
				const normalized = normalizePath(p.path);
				if (normalized) {
					mergedMap.set(normalized, p);
				}
			});

			const mergedProjects = Array.from(mergedMap.values());

			set({ projects: mergedProjects });
			await saveProjectsToStorage(mergedProjects);
		}
	},

	addProject: async (path: string, options?: { label?: string }) => {
		const normalized = normalizePath(path);
		if (!normalized) {
			set({ error: "Invalid path provided" });
			return null;
		}

		const { projects } = get();

		// Check for duplicates
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
			await saveProjectsToStorage(updatedProjects);
			await syncProjectsToServer(updatedProjects);
			return existingProject;
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
		await saveProjectsToStorage(updatedProjects);
		await syncProjectsToServer(updatedProjects);

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

		await saveProjectsToStorage(updatedProjects);
		if (newActiveId !== activeProjectId) {
			await SecureStore.setItemAsync(
				STORAGE_KEYS.ACTIVE_PROJECT_ID,
				newActiveId || ""
			);
		}
		await syncProjectsToServer(updatedProjects);
	},

	setActiveProject: async (id: string | null) => {
		const { projects } = get();

		if (id === null) {
			set({ activeProjectId: null });
			await SecureStore.deleteItemAsync(STORAGE_KEYS.ACTIVE_PROJECT_ID);
			return;
		}

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

		await SecureStore.setItemAsync(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
		await saveProjectsToStorage(updatedProjects);
	},

	renameProject: async (id: string, label: string) => {
		const { projects } = get();
		const updatedProjects = projects.map((p) =>
			p.id === id ? { ...p, label: label.trim() || getDirectoryName(p.path) } : p
		);

		set({ projects: updatedProjects, error: null });
		await saveProjectsToStorage(updatedProjects);
		await syncProjectsToServer(updatedProjects);
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
}));

export const getProjectsState = () => useProjectsStore.getState();
