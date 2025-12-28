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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RiAddLine, RiTerminalBoxLine, RiMore2Line, RiDeleteBinLine, RiFileCopyLine } from '@remixicon/react';
import { useCommandsStore, type Command } from '@/stores/useCommandsStore';
import { useUIStore } from '@/stores/useUIStore';
import { useDeviceInfo } from '@/lib/device';
import { isVSCodeRuntime } from '@/lib/desktop';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
import { cn } from '@/lib/utils';

interface CommandsSidebarProps {
  onItemSelect?: () => void;
}

export const CommandsSidebar: React.FC<CommandsSidebarProps> = ({ onItemSelect }) => {
  const [newCommandName, setNewCommandName] = React.useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const {
    selectedCommandName,
    commands,
    setSelectedCommand,
    deleteCommand,
    loadCommands,
  } = useCommandsStore();

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
    loadCommands();
  }, [loadCommands]);

  const bgClass = isDesktopRuntime
    ? 'bg-transparent'
    : isVSCode
      ? 'bg-background'
      : 'bg-sidebar';

  const handleCreateCommand = () => {
    if (!newCommandName.trim()) {
      toast.error('Command name is required');
      return;
    }

    const sanitizedName = newCommandName.trim().replace(/\s+/g, '-');

    if (commands.some((cmd) => cmd.name === sanitizedName)) {
      toast.error('A command with this name already exists');
      return;
    }

    setSelectedCommand(sanitizedName);
    setNewCommandName('');
    setIsCreateDialogOpen(false);

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteCommand = async (command: Command) => {
    if (window.confirm(`Are you sure you want to delete command "${command.name}"?`)) {
      const success = await deleteCommand(command.name);
      if (success) {
        toast.success(`Command "${command.name}" deleted successfully`);
      } else {
        toast.error('Failed to delete command');
      }
    }
  };

  const handleDuplicateCommand = (command: Command) => {
    const baseName = command.name;
    let copyNumber = 1;
    let newName = `${baseName}-copy`;

    while (commands.some((c) => c.name === newName)) {
      copyNumber++;
      newName = `${baseName}-copy-${copyNumber}`;
    }

    setSelectedCommand(newName);
    setIsCreateDialogOpen(false);

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={cn('flex h-full flex-col', bgClass)}>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <div className={cn('border-b px-3', isMobile ? 'mt-2 py-3' : 'py-3')}>
          <div className="flex items-center justify-between gap-2">
            <span className="typography-meta text-muted-foreground">Total {commands.length}</span>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 -my-1 text-muted-foreground">
                <RiAddLine className="size-4" />
              </Button>
            </DialogTrigger>
          </div>
        </div>

        <ScrollableOverlay outerClassName="flex-1 min-h-0" className="space-y-1 px-3 py-2">
            {commands.length === 0 ? (
              <div className="py-12 px-4 text-center text-muted-foreground">
                <RiTerminalBoxLine className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p className="typography-ui-label font-medium">No commands configured</p>
                <p className="typography-meta mt-1 opacity-75">Use the + button above to create one</p>
              </div>
            ) : (
              <>
                  {[...commands].sort((a, b) => a.name.localeCompare(b.name)).map((command) => (
                    <CommandListItem
                      key={command.name}
                      command={command}
                      isSelected={selectedCommandName === command.name}
                      onSelect={() => {
                        setSelectedCommand(command.name);
                        onItemSelect?.();
                        if (isMobile) {
                          setSidebarOpen(false);
                        }
                      }}
                      onDelete={() => handleDeleteCommand(command)}
                      onDuplicate={() => handleDuplicateCommand(command)}
                    />
                  ))}
              </>
            )}
        </ScrollableOverlay>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Command</DialogTitle>
            <DialogDescription>
              Enter a unique name for your new slash command
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newCommandName}
            onChange={(e) => setNewCommandName(e.target.value)}
            placeholder="Command name..."
            className="text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateCommand();
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(false)}
              className="text-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <ButtonLarge onClick={handleCreateCommand}>
              Create
            </ButtonLarge>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CommandListItemProps {
  command: Command;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const CommandListItem: React.FC<CommandListItemProps> = ({
  command,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
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
          <div className="flex items-center gap-2">
            <span className="typography-ui-label font-normal truncate text-foreground">
              /{command.name}
            </span>
          </div>

          {command.description && (
            <div className="typography-micro text-muted-foreground/60 truncate leading-tight">
              {command.description}
            </div>
          )}
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
                onDuplicate();
              }}
            >
              <RiFileCopyLine className="h-4 w-4 mr-px" />
              Duplicate
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive focus:text-destructive"
            >
              <RiDeleteBinLine className="h-4 w-4 mr-px" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
