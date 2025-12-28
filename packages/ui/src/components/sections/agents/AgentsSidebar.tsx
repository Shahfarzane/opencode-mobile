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
import { RiAddLine, RiAiAgentFill, RiAiAgentLine, RiDeleteBinLine, RiFileCopyLine, RiMore2Line, RiRobot2Line, RiRobotLine } from '@remixicon/react';
import { useAgentsStore, isAgentBuiltIn, isAgentHidden } from '@/stores/useAgentsStore';
import { useUIStore } from '@/stores/useUIStore';
import { useDeviceInfo } from '@/lib/device';
import { isVSCodeRuntime } from '@/lib/desktop';
import { cn } from '@/lib/utils';
import type { Agent } from '@opencode-ai/sdk';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';

interface AgentsSidebarProps {
    onItemSelect?: () => void;
}

export const AgentsSidebar: React.FC<AgentsSidebarProps> = ({ onItemSelect }) => {
    const [newAgentName, setNewAgentName] = React.useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

    const {
        selectedAgentName,
        agents,
        setSelectedAgent,
        deleteAgent,
        loadAgents,
    } = useAgentsStore();

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
        loadAgents();
    }, [loadAgents]);

    const bgClass = isDesktopRuntime
        ? 'bg-transparent'
        : isVSCode
            ? 'bg-background'
            : 'bg-sidebar';

    const handleCreateAgent = () => {
        if (!newAgentName.trim()) {
            toast.error('Agent name is required');
            return;
        }

        if (agents.some((agent) => agent.name === newAgentName)) {
            toast.error('An agent with this name already exists');
            return;
        }

        setSelectedAgent(newAgentName);
        setNewAgentName('');
        setIsCreateDialogOpen(false);

        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    const handleDeleteAgent = async (agent: Agent) => {
        if (isAgentBuiltIn(agent)) {
            toast.error('Built-in agents cannot be deleted');
            return;
        }

        if (window.confirm(`Are you sure you want to delete agent "${agent.name}"?`)) {
            const success = await deleteAgent(agent.name);
            if (success) {
                toast.success(`Agent "${agent.name}" deleted successfully`);
            } else {
                toast.error('Failed to delete agent');
            }
        }
    };

    const handleDuplicateAgent = (agent: Agent) => {
        const baseName = agent.name;
        let copyNumber = 1;
        let newName = `${baseName} Copy`;

        while (agents.some((a) => a.name === newName)) {
            copyNumber++;
            newName = `${baseName} Copy ${copyNumber}`;
        }

        setSelectedAgent(newName);
        setIsCreateDialogOpen(false);

        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    const getAgentModeIcon = (mode?: string) => {
        switch (mode) {
            case 'primary':
                return <RiAiAgentLine className="h-3 w-3 text-primary" />;
            case 'all':
                return <RiAiAgentFill className="h-3 w-3 text-primary" />;
            case 'subagent':
                return <RiRobotLine className="h-3 w-3 text-primary" />;
            default:
                return null;
        }
    };

    // Filter out hidden agents (internal agents like title, compaction, summary)
    const visibleAgents = agents.filter((agent) => !isAgentHidden(agent));
    const builtInAgents = visibleAgents.filter(isAgentBuiltIn);
    const customAgents = visibleAgents.filter((agent) => !isAgentBuiltIn(agent));

    return (
        <div className={cn('flex h-full flex-col', bgClass)}>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <div className={cn('border-b px-3', isMobile ? 'mt-2 py-3' : 'py-3')}>
                    <div className="flex items-center justify-between gap-2">
                        <span className="typography-meta text-muted-foreground">Total {visibleAgents.length}</span>
                        <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 -my-1 text-muted-foreground">
                                <RiAddLine className="size-4" />
                            </Button>
                        </DialogTrigger>
                    </div>
                </div>

                <ScrollableOverlay outerClassName="flex-1 min-h-0" className="space-y-1 px-3 py-2 overflow-x-hidden">
                    {visibleAgents.length === 0 ? (
                        <div className="py-12 px-4 text-center text-muted-foreground">
                            <RiRobot2Line className="mx-auto mb-3 h-10 w-10 opacity-50" />
                            <p className="typography-ui-label font-medium">No agents configured</p>
                            <p className="typography-meta mt-1 opacity-75">Use the + button above to create one</p>
                        </div>
                    ) : (
                        <>
                            {builtInAgents.length > 0 && (
                                <>
                                    <div className="px-2 pb-1.5 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Built-in Agents
                                    </div>
                                    {builtInAgents.map((agent) => (
                                        <AgentListItem
                                            key={agent.name}
                                            agent={agent}
                                            isSelected={selectedAgentName === agent.name}
                                            onSelect={() => {
                                                setSelectedAgent(agent.name);
                                                onItemSelect?.();
                                                if (isMobile) {
                                                    setSidebarOpen(false);
                                                }
                                            }}
                                            onDuplicate={() => handleDuplicateAgent(agent)}
                                            getAgentModeIcon={getAgentModeIcon}
                                        />
                                    ))}
                                </>
                            )}

                            {customAgents.length > 0 && (
                                <>
                                    <div className="px-2 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Custom Agents
                                    </div>
                                    {customAgents.map((agent) => (
                                        <AgentListItem
                                            key={agent.name}
                                            agent={agent}
                                            isSelected={selectedAgentName === agent.name}
                                            onSelect={() => {
                                                setSelectedAgent(agent.name);
                                                onItemSelect?.();
                                                if (isMobile) {
                                                    setSidebarOpen(false);
                                                }
                                            }}
                                            onDelete={() => handleDeleteAgent(agent)}
                                            onDuplicate={() => handleDuplicateAgent(agent)}
                                            getAgentModeIcon={getAgentModeIcon}
                                        />
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </ScrollableOverlay>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Agent</DialogTitle>
                        <DialogDescription>
                            Enter a unique name for your new agent
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        placeholder="Agent name..."
                        className="text-foreground placeholder:text-muted-foreground"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateAgent();
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
                        <ButtonLarge onClick={handleCreateAgent}>
                            Create
                        </ButtonLarge>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

interface AgentListItemProps {
    agent: Agent;
    isSelected: boolean;
    onSelect: () => void;
    onDelete?: () => void;
    onDuplicate: () => void;
    getAgentModeIcon: (mode?: string) => React.ReactNode;
}

const AgentListItem: React.FC<AgentListItemProps> = ({
    agent,
    isSelected,
    onSelect,
    onDelete,
    onDuplicate,
    getAgentModeIcon,
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
                        <span className="typography-ui-label font-normal truncate text-foreground">
                            {agent.name}
                        </span>
                        {getAgentModeIcon(agent.mode)}
                    </div>

                    {agent.description && (
                        <div className="typography-micro text-muted-foreground/60 truncate leading-tight">
                            {agent.description}
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

                            {!isAgentBuiltIn(agent) && onDelete && (
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
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
            </div>
        </div>
    );
};
