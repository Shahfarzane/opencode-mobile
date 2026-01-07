import type { Agent } from "@/types";

// Extended Agent type for API properties not in SDK types
export type AgentWithExtras = Agent & {
  native?: boolean;
  hidden?: boolean;
  options?: { hidden?: boolean };
};

// Helper to check if agent is built-in (handles both SDK 'builtIn' and API 'native')
export const isAgentBuiltIn = (agent: Agent): boolean => {
  const extended = agent as AgentWithExtras & { builtIn?: boolean };
  return extended.native === true || extended.builtIn === true;
};

// Helper to check if agent is hidden (internal agents like title, compaction, summary)
// Checks both top-level hidden and options.hidden (OpenCode API inconsistency workaround)
export const isAgentHidden = (agent: Agent): boolean => {
  const extended = agent as AgentWithExtras;
  return extended.hidden === true || extended.options?.hidden === true;
};

// Helper to filter only visible (non-hidden) agents
export const filterVisibleAgents = (agents: Agent[]): Agent[] =>
  agents.filter((agent) => !isAgentHidden(agent));
