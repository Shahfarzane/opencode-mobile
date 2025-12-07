export interface WorktreeMetadata {

  path: string;

  projectDirectory: string;

  branch: string;

  label: string;

  relativePath?: string;

  status?: {
    isDirty: boolean;
    ahead?: number;
    behind?: number;
    upstream?: string | null;
  };
}

export type WorktreeMap = Map<string, WorktreeMetadata>;
