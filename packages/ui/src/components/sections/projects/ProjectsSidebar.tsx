import React from 'react';
import { Button } from '@/components/ui/button';
import { ButtonLarge } from '@/components/ui/button-large';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFolderLine,
  RiFolderOpenLine,
  RiMore2Line,
} from '@remixicon/react';
import { useProjectsStore, type ProjectEntry } from '@/stores/useProjectsStore';
import { useUIStore } from '@/stores/useUIStore';
import { useDeviceInfo } from '@/lib/device';
import { isVSCodeRuntime } from '@/lib/desktop';
import { cn } from '@/lib/utils';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';

interface ProjectsSidebarProps {
  onItemSelect?: () => void;
}

export const ProjectsSidebar: React.FC<ProjectsSidebarProps> = ({ onItemSelect }) => {
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [addPath, setAddPath] = React.useState('');
  const [addLabel, setAddLabel] = React.useState('');
  const [renameProject, setRenameProject] = React.useState<ProjectEntry | null>(null);
  const [renameLabel, setRenameLabel] = React.useState('');

  const {
    projects,
    activeProjectId,
    initialize,
    addProject,
    removeProject,
    setActiveProject,
    renameProject: doRename,
    clearError,
    error,
  } = useProjectsStore();

  const { setSidebarOpen } = useUIStore();
  const { isMobile } = useDeviceInfo();

  const [isDesktopRuntime, setIsDesktopRuntime] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return typeof window.opencodeDesktop !== 'undefined';
  });

  const isVSCode = React.useMemo(() => isVSCodeRuntime(), []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsDesktopRuntime(typeof window.opencodeDesktop !== 'undefined');
  }, []);

  React.useEffect(() => {
    void initialize();
  }, [initialize]);

  React.useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const bgClass = isDesktopRuntime
    ? 'bg-transparent'
    : isVSCode
      ? 'bg-background'
      : 'bg-sidebar';

  const handleAddProject = async () => {
    const trimmedPath = addPath.trim();
    if (!trimmedPath) {
      toast.error('Please enter a project path');
      return;
    }

    const result = await addProject(trimmedPath, { label: addLabel.trim() || undefined });
    if (result) {
      toast.success(`Project "${result.label}" added`);
      setAddDialogOpen(false);
      setAddPath('');
      setAddLabel('');
    }
  };

  const handleDeleteProject = async (project: ProjectEntry) => {
    if (window.confirm(`Are you sure you want to remove project "${project.label}"?\n\nThis will only remove it from your project list, not delete any files.`)) {
      await removeProject(project.id);
      toast.success(`Project "${project.label}" removed`);
    }
  };

  const handleSelectProject = async (project: ProjectEntry) => {
    await setActiveProject(project.id);
    onItemSelect?.();
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleOpenRenameDialog = (project: ProjectEntry) => {
    setRenameLabel(project.label || '');
    setRenameProject(project);
  };

  const handleRenameProject = () => {
    if (!renameProject) return;

    const trimmedLabel = renameLabel.trim();
    if (!trimmedLabel) {
      toast.error('Project name is required');
      return;
    }

    doRename(renameProject.id, trimmedLabel);
    toast.success(`Project renamed to "${trimmedLabel}"`);
    setRenameProject(null);
  };

  return (
    <div className={cn('flex h-full flex-col', bgClass)}>
      <div className={cn('border-b px-3', isMobile ? 'mt-2 py-3' : 'py-3')}>
        <div className="flex items-center justify-between gap-2">
          <span className="typography-meta text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 -my-1 text-muted-foreground"
            onClick={() => setAddDialogOpen(true)}
          >
            <RiAddLine className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollableOverlay outerClassName="flex-1 min-h-0" className="space-y-1 px-3 py-2 overflow-x-hidden">
        {projects.length === 0 ? (
          <div className="py-12 px-4 text-center text-muted-foreground">
            <RiFolderLine className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="typography-ui-label font-medium">No projects added</p>
            <p className="typography-meta mt-1 opacity-75">
              Use the + button above to add a project
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              isSelected={activeProjectId === project.id}
              onSelect={() => handleSelectProject(project)}
              onDelete={() => handleDeleteProject(project)}
              onRename={() => handleOpenRenameDialog(project)}
            />
          ))
        )}
      </ScrollableOverlay>

      {/* Add Project Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
            <DialogDescription>
              Enter the path to your project directory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="typography-meta text-muted-foreground mb-1.5 block">
                Project Path
              </label>
              <Input
                value={addPath}
                onChange={(e) => setAddPath(e.target.value)}
                placeholder="/path/to/project"
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="typography-meta text-muted-foreground mb-1.5 block">
                Display Name (optional)
              </label>
              <Input
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="My Project"
                className="text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleAddProject();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAddDialogOpen(false)}
              className="text-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <ButtonLarge onClick={() => void handleAddProject()}>
              Add Project
            </ButtonLarge>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Project Dialog */}
      <Dialog open={renameProject !== null} onOpenChange={(open) => !open && setRenameProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new display name for "{renameProject?.label}"
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameLabel}
            onChange={(e) => setRenameLabel(e.target.value)}
            placeholder="Project name..."
            className="text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameProject();
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRenameProject(null)}
              className="text-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <ButtonLarge onClick={handleRenameProject}>
              Rename
            </ButtonLarge>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ProjectListItemProps {
  project: ProjectEntry;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: () => void;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({
  project,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}) => {
  return (
    <div
      className={cn(
        'group relative flex items-center rounded-md px-1.5 py-1 transition-all duration-200',
        isSelected ? 'dark:bg-accent/80 bg-primary/12' : 'hover:dark:bg-accent/40 hover:bg-primary/6'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <button
          onClick={onSelect}
          className="flex min-w-0 flex-1 flex-col gap-0 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          tabIndex={0}
        >
          <div className="flex items-center gap-1.5">
            {isSelected ? (
              <RiFolderOpenLine className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            ) : (
              <RiFolderLine className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
            <span className="typography-ui-label font-normal truncate text-foreground">
              {project.label}
            </span>
          </div>
          <div className="typography-micro text-muted-foreground/60 truncate leading-tight pl-5">
            {project.path}
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 flex-shrink-0 -mr-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
            >
              <RiMore2Line className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-fit min-w-20">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
            >
              <RiEditLine className="h-4 w-4 mr-px" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive focus:text-destructive"
            >
              <RiDeleteBinLine className="h-4 w-4 mr-px" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
