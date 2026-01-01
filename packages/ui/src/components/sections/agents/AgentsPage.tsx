import React from 'react';
import { Button } from '@/components/ui/button';
import { ButtonSmall } from '@/components/ui/button-small';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAgentsStore, type AgentConfig, type AgentScope } from '@/stores/useAgentsStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { RiAddLine, RiAiAgentFill, RiAiAgentLine, RiInformationLine, RiRobot2Line, RiRobotLine, RiSaveLine, RiSubtractLine, RiUser3Line, RiFolderLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { ModelSelector } from './ModelSelector';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
import { useAvailableTools } from '@/hooks/useAvailableTools';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

export const AgentsPage: React.FC = () => {
  const { selectedAgentName, getAgentByName, createAgent, updateAgent, agents, agentDraft, setAgentDraft } = useAgentsStore();
  useConfigStore();
  const { tools: availableTools } = useAvailableTools();

  const selectedAgent = selectedAgentName ? getAgentByName(selectedAgentName) : null;
  const isNewAgent = Boolean(agentDraft && agentDraft.name === selectedAgentName && !selectedAgent);

  const [draftName, setDraftName] = React.useState('');
  const [draftScope, setDraftScope] = React.useState<AgentScope>('user');
  const [description, setDescription] = React.useState('');
  const [mode, setMode] = React.useState<'primary' | 'subagent' | 'all'>('subagent');
  const [model, setModel] = React.useState('');
  const [temperature, setTemperature] = React.useState<number | undefined>(undefined);
  const [topP, setTopP] = React.useState<number | undefined>(undefined);
  const [prompt, setPrompt] = React.useState('');
  const [tools, setTools] = React.useState<Record<string, boolean>>({});
  const [editPermission, setEditPermission] = React.useState<'allow' | 'ask' | 'deny'>('allow');
  const [webfetchPermission, setWebfetchPermission] = React.useState<'allow' | 'ask' | 'deny'>('allow');
  const [bashPermission, setBashPermission] = React.useState<'allow' | 'ask' | 'deny'>('allow');
  const [skillPermission, setSkillPermission] = React.useState<'allow' | 'ask' | 'deny'>('allow');
  const [doomLoopPermission, setDoomLoopPermission] = React.useState<'allow' | 'ask' | 'deny'>('ask');
  const [externalDirectoryPermission, setExternalDirectoryPermission] = React.useState<'allow' | 'ask' | 'deny'>('ask');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isNewAgent && agentDraft) {
      // Prefill from draft (for new or duplicated agents)
      setDraftName(agentDraft.name || '');
      setDraftScope(agentDraft.scope || 'user');
      setDescription(agentDraft.description || '');
      setMode(agentDraft.mode || 'subagent');
      setModel(agentDraft.model || '');
      setTemperature(agentDraft.temperature);
      setTopP(agentDraft.top_p);
      setPrompt(agentDraft.prompt || '');
      
      const draftTools = agentDraft.tools || {};
      setTools(draftTools);
      
      // Determine permission based on explicit permission first, then tool state
      const resolvePermission = (
        explicitPerm: string | undefined,
        toolDisabled: boolean,
        fallback: 'allow' | 'ask' | 'deny'
      ): 'allow' | 'ask' | 'deny' => {
        if (explicitPerm === 'allow' || explicitPerm === 'ask' || explicitPerm === 'deny') {
          return explicitPerm;
        }
        if (toolDisabled) {
          return 'deny';
        }
        return fallback;
      };

      const permission = (agentDraft.permission || {}) as {
        edit?: unknown;
        bash?: unknown;
        skill?: unknown;
        webfetch?: unknown;
        doom_loop?: unknown;
        external_directory?: unknown;
      };
      
      const getPermissionValue = (value: unknown): 'allow' | 'ask' | 'deny' | undefined => {
        if (value === 'allow' || value === 'ask' || value === 'deny') {
          return value;
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const wildcard = (value as Record<string, unknown>)['*'];
          if (wildcard === 'allow' || wildcard === 'ask' || wildcard === 'deny') {
            return wildcard;
          }
        }
        return undefined;
      };

      const editToolDisabled = draftTools.edit === false || draftTools.write === false || draftTools.patch === false;
      setEditPermission(resolvePermission(getPermissionValue(permission.edit), editToolDisabled, 'allow'));
      
      setBashPermission(resolvePermission(getPermissionValue(permission.bash), draftTools.bash === false, 'allow'));
      
      setWebfetchPermission(resolvePermission(getPermissionValue(permission.webfetch), draftTools.webfetch === false, 'allow'));

      setSkillPermission(resolvePermission(getPermissionValue(permission.skill), draftTools.skill === false, 'allow'));
      setDoomLoopPermission(resolvePermission(getPermissionValue(permission.doom_loop), false, 'ask'));
      setExternalDirectoryPermission(resolvePermission(getPermissionValue(permission.external_directory), false, 'ask'));
    } else if (selectedAgent) {
      setDescription(selectedAgent.description || '');
      setMode(selectedAgent.mode || 'subagent');

      if (selectedAgent.model?.providerID && selectedAgent.model?.modelID) {
        setModel(`${selectedAgent.model.providerID}/${selectedAgent.model.modelID}`);
      } else {
        setModel('');
      }

      setTemperature(selectedAgent.temperature);
      setTopP(selectedAgent.topP);
      setPrompt(selectedAgent.prompt || '');
      
      const agentTools = selectedAgent.tools || {};
      setTools(agentTools);

      // Determine permission based on explicit permission first, then tool state
      const resolvePermission = (
        explicitPerm: string | undefined,
        toolDisabled: boolean,
        fallback: 'allow' | 'ask' | 'deny'
      ): 'allow' | 'ask' | 'deny' => {
        if (explicitPerm === 'allow' || explicitPerm === 'ask' || explicitPerm === 'deny') {
          return explicitPerm;
        }
        if (toolDisabled) {
          return 'deny';
        }
        return fallback;
      };

      const permission = (selectedAgent.permission || {}) as {
        edit?: unknown;
        bash?: unknown;
        skill?: unknown;
        webfetch?: unknown;
        doom_loop?: unknown;
        external_directory?: unknown;
      };

      const getPermissionValue = (value: unknown): 'allow' | 'ask' | 'deny' | undefined => {
        if (value === 'allow' || value === 'ask' || value === 'deny') {
          return value;
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const wildcard = (value as Record<string, unknown>)['*'];
          if (wildcard === 'allow' || wildcard === 'ask' || wildcard === 'deny') {
            return wildcard;
          }
        }
        return undefined;
      };

      // For edit permission, check 'edit', 'write', and 'patch' tools
      // If ANY of these tools is explicitly disabled (false), edit permission is 'deny'
      const editToolDisabled = agentTools.edit === false || agentTools.write === false || agentTools.patch === false;
      setEditPermission(resolvePermission(getPermissionValue(permission.edit), editToolDisabled, 'allow'));
      
      // For bash permission
      setBashPermission(resolvePermission(getPermissionValue(permission.bash), agentTools.bash === false, 'allow'));
      
      // For webfetch permission
      setWebfetchPermission(resolvePermission(getPermissionValue(permission.webfetch), agentTools.webfetch === false, 'allow'));

      setSkillPermission(resolvePermission(getPermissionValue(permission.skill), agentTools.skill === false, 'allow'));
      setDoomLoopPermission(resolvePermission(getPermissionValue(permission.doom_loop), false, 'ask'));
      setExternalDirectoryPermission(resolvePermission(getPermissionValue(permission.external_directory), false, 'ask'));
    }
  }, [selectedAgent, isNewAgent, selectedAgentName, agents, agentDraft]);

  const handleSave = async () => {
    const agentName = isNewAgent ? draftName.trim().replace(/\s+/g, '-') : selectedAgentName?.trim();

    if (!agentName) {
      toast.error('Agent name is required');
      return;
    }

    // Check for duplicate name when creating new agent
    if (isNewAgent && agents.some((a) => a.name === agentName)) {
      toast.error('An agent with this name already exists');
      return;
    }

    setIsSaving(true);

    try {
      const trimmedModel = model.trim();
      const config: AgentConfig = {
        name: agentName,
        description: description.trim() || undefined,
        mode,
        model: trimmedModel === '' ? null : trimmedModel,
        temperature,
        top_p: topP,
        prompt: prompt.trim() || undefined,
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        permission: {
          edit: editPermission,
          webfetch: webfetchPermission,
          bash: bashPermission,
          skill: skillPermission,
          doom_loop: doomLoopPermission,
          external_directory: externalDirectoryPermission,
        },
        scope: isNewAgent ? draftScope : undefined,
      };

      let success: boolean;
      if (isNewAgent) {
        success = await createAgent(config);
        if (success) {
          setAgentDraft(null); // Clear draft after successful creation
        }
      } else {
        success = await updateAgent(agentName, config);
      }

      if (success) {
        toast.success(isNewAgent ? 'Agent created successfully' : 'Agent updated successfully');
      } else {
        toast.error(isNewAgent ? 'Failed to create agent' : 'Failed to update agent');
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTool = (tool: string) => {
    setTools((prev) => ({
      ...prev,
      [tool]: !prev[tool],
    }));
  };

  const toggleAllTools = (enabled: boolean) => {
    const allTools: Record<string, boolean> = {};
    availableTools.forEach((tool: string) => {
      allTools[tool] = enabled;
    });
    setTools(allTools);
  };

  if (!selectedAgentName) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <RiRobot2Line className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p className="typography-body">Select an agent from the sidebar</p>
          <p className="typography-meta mt-1 opacity-75">or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollableOverlay keyboardAvoid outerClassName="h-full" className="w-full">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="typography-ui-header font-semibold text-lg">
          {isNewAgent ? 'New Agent' : selectedAgentName}
        </h1>
      </div>

      {}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="typography-ui-header font-semibold text-foreground">Basic Information</h2>
          <p className="typography-meta text-muted-foreground/80">
            Configure agent identity and behavior mode
          </p>
        </div>

        {isNewAgent && (
          <div className="space-y-2">
            <label className="typography-ui-label font-medium text-foreground">
              Agent Name & Scope
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1">
                <span className="typography-ui-label text-muted-foreground mr-1">@</span>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="agent-name"
                  className="flex-1 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Select value={draftScope} onValueChange={(v) => setDraftScope(v as AgentScope)}>
                <SelectTrigger className="!h-9 w-auto gap-1.5">
                  {draftScope === 'user' ? (
                    <RiUser3Line className="h-4 w-4" />
                  ) : (
                    <RiFolderLine className="h-4 w-4" />
                  )}
                  <span className="capitalize">{draftScope}</span>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="user" className="pr-2 [&>span:first-child]:hidden">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <RiUser3Line className="h-4 w-4" />
                        <span>User</span>
                      </div>
                      <span className="typography-micro text-muted-foreground ml-6">Available in all projects</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="project" className="pr-2 [&>span:first-child]:hidden">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <RiFolderLine className="h-4 w-4" />
                        <span>Project</span>
                      </div>
                      <span className="typography-micro text-muted-foreground ml-6">Only in current project</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="typography-ui-label font-medium text-foreground">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this agent do?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="typography-ui-label font-medium text-foreground">
            Mode
          </label>
          <div className="flex gap-1 w-fit">
            <ButtonSmall
              variant={mode === 'primary' ? 'default' : 'outline'}
              onClick={() => setMode('primary')}
              className={cn('gap-2', mode === 'primary' ? undefined : 'text-foreground')}
            >
              <RiAiAgentLine className="h-3 w-3" />
              Primary
            </ButtonSmall>
            <ButtonSmall
              variant={mode === 'subagent' ? 'default' : 'outline'}
              onClick={() => setMode('subagent')}
              className={cn('gap-2', mode === 'subagent' ? undefined : 'text-foreground')}
            >
              <RiRobotLine className="h-3 w-3" />
              Subagent
            </ButtonSmall>
            <ButtonSmall
              variant={mode === 'all' ? 'default' : 'outline'}
              onClick={() => setMode('all')}
              className={cn('gap-2', mode === 'all' ? undefined : 'text-foreground')}
            >
              <RiAiAgentFill className="h-3 w-3" />
              All
            </ButtonSmall>
          </div>
          <p className="typography-meta text-muted-foreground">
            Primary: main agent, Subagent: helper agent, All: both modes
          </p>
        </div>
      </div>

      {}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="typography-h2 font-semibold text-foreground">Model Configuration</h2>
          <p className="typography-meta text-muted-foreground/80">
            Configure model and generation parameters
          </p>
        </div>

        <div className="space-y-2">
          <label className="typography-ui-label font-medium text-foreground">
            Model
          </label>
          <ModelSelector
            providerId={model ? model.split('/')[0] : ''}
            modelId={model ? model.split('/')[1] : ''}
            onChange={(providerId: string, modelId: string) => {
              if (providerId && modelId) {
                setModel(`${providerId}/${modelId}`);
              } else {
                setModel('');
              }
            }}
          />
        </div>

        <div className="flex gap-4">
          <div className="space-y-2">
            <label className="typography-ui-label font-medium text-foreground flex items-center gap-2">
              Temperature
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <RiInformationLine className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="max-w-xs">
                  Controls randomness in responses.<br />
                  Higher values make output more creative and unpredictable,<br />
                  lower values make it more focused and deterministic.
                </TooltipContent>
              </Tooltip>
            </label>
            <div className="relative w-32">
              <button
                type="button"
                onClick={() => {
                  const current = temperature !== undefined ? temperature : 0.7;
                  const newValue = Math.max(0, current - 0.1);
                  setTemperature(parseFloat(newValue.toFixed(1)));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <RiSubtractLine className="h-3.5 w-3.5" />
              </button>
              <Input
                type="text"
                inputMode="decimal"
                value={temperature !== undefined ? temperature : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setTemperature(undefined);
                    return;
                  }
                  const parsed = parseFloat(value);
                  if (!isNaN(parsed) && parsed >= 0 && parsed <= 2) {
                    setTemperature(parsed);
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value !== '') {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                      const clamped = Math.max(0, Math.min(2, parsed));
                      setTemperature(parseFloat(clamped.toFixed(1)));
                    }
                  }
                }}
                placeholder="—"
                className="text-center px-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  const current = temperature !== undefined ? temperature : 0.7;
                  const newValue = Math.min(2, current + 0.1);
                  setTemperature(parseFloat(newValue.toFixed(1)));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <RiAddLine className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="typography-ui-label font-medium text-foreground flex items-center gap-2">
              Top P
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <RiInformationLine className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="max-w-xs">
                  Controls diversity via nucleus sampling.<br />
                  Lower values focus on most likely tokens,<br />
                  higher values consider more possibilities.
                </TooltipContent>
              </Tooltip>
            </label>
            <div className="relative w-32">
              <button
                type="button"
                onClick={() => {
                  const current = topP !== undefined ? topP : 0.9;
                  const newValue = Math.max(0, current - 0.1);
                  setTopP(parseFloat(newValue.toFixed(1)));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <RiSubtractLine className="h-3.5 w-3.5" />
              </button>
              <Input
                type="text"
                inputMode="decimal"
                value={topP !== undefined ? topP : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setTopP(undefined);
                    return;
                  }
                  const parsed = parseFloat(value);
                  if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                    setTopP(parsed);
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value !== '') {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                      const clamped = Math.max(0, Math.min(1, parsed));
                      setTopP(parseFloat(clamped.toFixed(1)));
                    }
                  }
                }}
                placeholder="—"
                className="text-center px-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  const current = topP !== undefined ? topP : 0.9;
                  const newValue = Math.min(1, current + 0.1);
                  setTopP(parseFloat(newValue.toFixed(1)));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 w-6 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <RiAddLine className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="typography-h2 font-semibold text-foreground">System Prompt</h2>
          <p className="typography-meta text-muted-foreground/80">
            Override the default system prompt for this agent
          </p>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Custom system prompt for this agent..."
          rows={8}
          className="font-mono typography-meta"
        />
      </div>

      {}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="typography-h2 font-semibold text-foreground">Available Tools</h2>
            <p className="typography-meta text-muted-foreground/80">
              Select tools this agent can access
            </p>
          </div>
          <div className="flex gap-1 w-fit">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAllTools(true)}
              className="h-6 px-2 text-xs"
            >
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAllTools(false)}
              className="h-6 px-2 text-xs"
            >
              Disable All
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTools.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleTool(tool)}
              className={cn(
                "h-6 px-2 rounded-lg border text-[13px] cursor-pointer transition-colors",
                tools[tool]
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border/40 bg-sidebar/30 text-foreground hover:bg-sidebar/50"
              )}
            >
              {tool}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="typography-h2 font-semibold text-foreground">Permissions</h2>
          <p className="typography-meta text-muted-foreground/80">
            Configure permission levels for different operations
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="typography-ui-label font-medium text-foreground">
              Edit Permission
            </label>
            <div className="flex gap-1 w-fit">
              <Button
                size="sm"
                variant={editPermission === 'allow' ? 'default' : 'outline'}
                onClick={() => setEditPermission('allow')}
                className="h-6 px-2 text-xs"
              >
                Allow
              </Button>
              <Button
                size="sm"
                variant={editPermission === 'ask' ? 'default' : 'outline'}
                onClick={() => setEditPermission('ask')}
                className="h-6 px-2 text-xs"
              >
                Ask
              </Button>
              <Button
                size="sm"
                variant={editPermission === 'deny' ? 'default' : 'outline'}
                onClick={() => setEditPermission('deny')}
                className="h-6 px-2 text-xs"
              >
                Deny
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <p className="typography-meta text-muted-foreground">
                Controls file editing permissions.
              </p>
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <RiInformationLine className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="max-w-xs">
                  <div className="space-y-1">
                    <p><strong>Allow:</strong> Allows file editing without confirmation</p>
                    <p><strong>Ask:</strong> Prompts for confirmation before editing</p>
                    <p><strong>Deny:</strong> Blocks all file editing operations</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-2">
            <label className="typography-ui-label font-medium text-foreground">
              Bash Permission
            </label>
            <div className="flex gap-1 w-fit">
              <Button
                size="sm"
                variant={bashPermission === 'allow' ? 'default' : 'outline'}
                onClick={() => setBashPermission('allow')}
                className="h-6 px-2 text-xs"
              >
                Allow
              </Button>
              <Button
                size="sm"
                variant={bashPermission === 'ask' ? 'default' : 'outline'}
                onClick={() => setBashPermission('ask')}
                className="h-6 px-2 text-xs"
              >
                Ask
              </Button>
              <Button
                size="sm"
                variant={bashPermission === 'deny' ? 'default' : 'outline'}
                onClick={() => setBashPermission('deny')}
                className="h-6 px-2 text-xs"
              >
                Deny
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <p className="typography-meta text-muted-foreground">
                Permission for running bash commands
              </p>
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <RiInformationLine className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="max-w-xs">
                  <div className="space-y-1">
                    <p><strong>Allow:</strong> Run bash commands without confirmation</p>
                    <p><strong>Ask:</strong> Prompt for confirmation before execution</p>
                    <p><strong>Deny:</strong> Block all bash command execution</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-2">
            <label className="typography-ui-label font-medium text-foreground">
              WebFetch Permission
            </label>
            <div className="flex gap-1 w-fit">
              <Button
                size="sm"
                variant={webfetchPermission === 'allow' ? 'default' : 'outline'}
                onClick={() => setWebfetchPermission('allow')}
                className="h-6 px-2 text-xs"
              >
                Allow
              </Button>
              <Button
                size="sm"
                variant={webfetchPermission === 'ask' ? 'default' : 'outline'}
                onClick={() => setWebfetchPermission('ask')}
                className="h-6 px-2 text-xs"
              >
                Ask
              </Button>
              <Button
                size="sm"
                variant={webfetchPermission === 'deny' ? 'default' : 'outline'}
                onClick={() => setWebfetchPermission('deny')}
                className="h-6 px-2 text-xs"
              >
                Deny
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <p className="typography-meta text-muted-foreground">
                Permission for fetching web content
              </p>
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <RiInformationLine className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="max-w-xs">
                  <div className="space-y-1">
                    <p><strong>Allow:</strong> Fetch web content without confirmation</p>
                    <p><strong>Ask:</strong> Prompt for confirmation before fetching</p>
                    <p><strong>Deny:</strong> Block all web content access</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-2">
            <label className="typography-ui-label font-medium text-foreground">
              Skill Permission
            </label>
            <div className="flex gap-1 w-fit">
              <Button
                size="sm"
                variant={skillPermission === 'allow' ? 'default' : 'outline'}
                onClick={() => setSkillPermission('allow')}
                className="h-6 px-2 text-xs"
              >
                Allow
              </Button>
              <Button
                size="sm"
                variant={skillPermission === 'ask' ? 'default' : 'outline'}
                onClick={() => setSkillPermission('ask')}
                className="h-6 px-2 text-xs"
              >
                Ask
              </Button>
              <Button
                size="sm"
                variant={skillPermission === 'deny' ? 'default' : 'outline'}
                onClick={() => setSkillPermission('deny')}
                className="h-6 px-2 text-xs"
              >
                Deny
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <p className="typography-meta text-muted-foreground">
                Permission for loading skills
              </p>
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <RiInformationLine className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="max-w-xs">
                  <div className="space-y-1">
                    <p><strong>Allow:</strong> Load skills without confirmation</p>
                    <p><strong>Ask:</strong> Prompt for confirmation before loading skills</p>
                    <p><strong>Deny:</strong> Block all skill loading</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-2">
            <label className="typography-ui-label font-medium text-foreground">
              Doom Loop Permission
            </label>
            <div className="flex gap-1 w-fit">
              <Button
                size="sm"
                variant={doomLoopPermission === 'allow' ? 'default' : 'outline'}
                onClick={() => setDoomLoopPermission('allow')}
                className="h-6 px-2 text-xs"
              >
                Allow
              </Button>
              <Button
                size="sm"
                variant={doomLoopPermission === 'ask' ? 'default' : 'outline'}
                onClick={() => setDoomLoopPermission('ask')}
                className="h-6 px-2 text-xs"
              >
                Ask
              </Button>
              <Button
                size="sm"
                variant={doomLoopPermission === 'deny' ? 'default' : 'outline'}
                onClick={() => setDoomLoopPermission('deny')}
                className="h-6 px-2 text-xs"
              >
                Deny
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <p className="typography-meta text-muted-foreground">
                Permission for repeated identical tool calls
              </p>
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <RiInformationLine className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="max-w-xs">
                  <div className="space-y-1">
                    <p><strong>Allow:</strong> Continue without confirmation</p>
                    <p><strong>Ask:</strong> Prompt when a doom loop is detected</p>
                    <p><strong>Deny:</strong> Block repeated tool calls</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-2">
            <label className="typography-ui-label font-medium text-foreground">
              External Directory Permission
            </label>
            <div className="flex gap-1 w-fit">
              <Button
                size="sm"
                variant={externalDirectoryPermission === 'allow' ? 'default' : 'outline'}
                onClick={() => setExternalDirectoryPermission('allow')}
                className="h-6 px-2 text-xs"
              >
                Allow
              </Button>
              <Button
                size="sm"
                variant={externalDirectoryPermission === 'ask' ? 'default' : 'outline'}
                onClick={() => setExternalDirectoryPermission('ask')}
                className="h-6 px-2 text-xs"
              >
                Ask
              </Button>
              <Button
                size="sm"
                variant={externalDirectoryPermission === 'deny' ? 'default' : 'outline'}
                onClick={() => setExternalDirectoryPermission('deny')}
                className="h-6 px-2 text-xs"
              >
                Deny
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <p className="typography-meta text-muted-foreground">
                Permission for file access outside project
              </p>
              <Tooltip delayDuration={1000}>
                <TooltipTrigger asChild>
                  <RiInformationLine className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="max-w-xs">
                  <div className="space-y-1">
                    <p><strong>Allow:</strong> Access external paths without confirmation</p>
                    <p><strong>Ask:</strong> Prompt before accessing external paths</p>
                    <p><strong>Deny:</strong> Block external directory access</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {}
        <div className="flex justify-end border-t border-border/40 pt-4">
          <Button
            size="sm"
            variant="default"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 h-6 px-2 text-xs w-fit"
          >
            <RiSaveLine className="h-3 w-3" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      </div>
    </ScrollableOverlay>
  );
};
