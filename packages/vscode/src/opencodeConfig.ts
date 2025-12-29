import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'yaml';
import stripJsonComments from 'strip-json-comments';

const OPENCODE_CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode');
const AGENT_DIR = path.join(OPENCODE_CONFIG_DIR, 'agent');
const COMMAND_DIR = path.join(OPENCODE_CONFIG_DIR, 'command');
const CONFIG_FILE = path.join(OPENCODE_CONFIG_DIR, 'opencode.json');
const CUSTOM_CONFIG_FILE = process.env.OPENCODE_CONFIG
  ? path.resolve(process.env.OPENCODE_CONFIG)
  : null;
const PROMPT_FILE_PATTERN = /^\{file:(.+)\}$/i;

// Scope types (shared by agents and commands)
export const AGENT_SCOPE = {
  USER: 'user',
  PROJECT: 'project'
} as const;

export const COMMAND_SCOPE = {
  USER: 'user',
  PROJECT: 'project'
} as const;

export type AgentScope = typeof AGENT_SCOPE[keyof typeof AGENT_SCOPE];
export type CommandScope = typeof COMMAND_SCOPE[keyof typeof COMMAND_SCOPE];

export type ConfigSources = {
  md: { exists: boolean; path: string | null; fields: string[]; scope?: AgentScope | CommandScope | null };
  json: { exists: boolean; path: string; fields: string[]; scope?: AgentScope | CommandScope | null };
  projectMd?: { exists: boolean; path: string | null };
  userMd?: { exists: boolean; path: string | null };
};

const ensureDirs = () => {
  if (!fs.existsSync(OPENCODE_CONFIG_DIR)) fs.mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(AGENT_DIR)) fs.mkdirSync(AGENT_DIR, { recursive: true });
  if (!fs.existsSync(COMMAND_DIR)) fs.mkdirSync(COMMAND_DIR, { recursive: true });
};

// ============== AGENT SCOPE HELPERS ==============

const ensureProjectAgentDir = (workingDirectory: string): string => {
  const projectAgentDir = path.join(workingDirectory, '.opencode', 'agent');
  if (!fs.existsSync(projectAgentDir)) {
    fs.mkdirSync(projectAgentDir, { recursive: true });
  }
  return projectAgentDir;
};

const getProjectAgentPath = (workingDirectory: string, agentName: string): string => {
  return path.join(workingDirectory, '.opencode', 'agent', `${agentName}.md`);
};

const getUserAgentPath = (agentName: string): string => {
  return path.join(AGENT_DIR, `${agentName}.md`);
};

export const getAgentScope = (agentName: string, workingDirectory?: string): { scope: AgentScope | null; path: string | null } => {
  if (workingDirectory) {
    const projectPath = getProjectAgentPath(workingDirectory, agentName);
    if (fs.existsSync(projectPath)) {
      return { scope: AGENT_SCOPE.PROJECT, path: projectPath };
    }
  }
  
  const userPath = getUserAgentPath(agentName);
  if (fs.existsSync(userPath)) {
    return { scope: AGENT_SCOPE.USER, path: userPath };
  }
  
  return { scope: null, path: null };
};

const getAgentWritePath = (agentName: string, workingDirectory?: string, requestedScope?: AgentScope): { scope: AgentScope; path: string } => {
  const existing = getAgentScope(agentName, workingDirectory);
  if (existing.path) {
    return { scope: existing.scope!, path: existing.path };
  }
  
  const scope = requestedScope || AGENT_SCOPE.USER;
  if (scope === AGENT_SCOPE.PROJECT && workingDirectory) {
    return { 
      scope: AGENT_SCOPE.PROJECT, 
      path: getProjectAgentPath(workingDirectory, agentName) 
    };
  }
  
  return { 
    scope: AGENT_SCOPE.USER, 
    path: getUserAgentPath(agentName) 
  };
};

// ============== COMMAND SCOPE HELPERS ==============

const ensureProjectCommandDir = (workingDirectory: string): string => {
  const projectCommandDir = path.join(workingDirectory, '.opencode', 'command');
  if (!fs.existsSync(projectCommandDir)) {
    fs.mkdirSync(projectCommandDir, { recursive: true });
  }
  return projectCommandDir;
};

const getProjectCommandPath = (workingDirectory: string, commandName: string): string => {
  return path.join(workingDirectory, '.opencode', 'command', `${commandName}.md`);
};

const getUserCommandPath = (commandName: string): string => {
  return path.join(COMMAND_DIR, `${commandName}.md`);
};

export const getCommandScope = (commandName: string, workingDirectory?: string): { scope: CommandScope | null; path: string | null } => {
  if (workingDirectory) {
    const projectPath = getProjectCommandPath(workingDirectory, commandName);
    if (fs.existsSync(projectPath)) {
      return { scope: COMMAND_SCOPE.PROJECT, path: projectPath };
    }
  }
  
  const userPath = getUserCommandPath(commandName);
  if (fs.existsSync(userPath)) {
    return { scope: COMMAND_SCOPE.USER, path: userPath };
  }
  
  return { scope: null, path: null };
};

const getCommandWritePath = (commandName: string, workingDirectory?: string, requestedScope?: CommandScope): { scope: CommandScope; path: string } => {
  const existing = getCommandScope(commandName, workingDirectory);
  if (existing.path) {
    return { scope: existing.scope!, path: existing.path };
  }
  
  const scope = requestedScope || COMMAND_SCOPE.USER;
  if (scope === COMMAND_SCOPE.PROJECT && workingDirectory) {
    return { 
      scope: COMMAND_SCOPE.PROJECT, 
      path: getProjectCommandPath(workingDirectory, commandName) 
    };
  }
  
  return { 
    scope: COMMAND_SCOPE.USER, 
    path: getUserCommandPath(commandName) 
  };
};

const isPromptFileReference = (value: unknown): value is string => {
  return typeof value === 'string' && PROMPT_FILE_PATTERN.test(value.trim());
};

const resolvePromptFilePath = (reference: string): string | null => {
  const match = reference.trim().match(PROMPT_FILE_PATTERN);
  if (!match?.[1]) return null;
  let target = match[1].trim();
  if (!target) return null;

  if (target.startsWith('./')) {
    target = path.join(OPENCODE_CONFIG_DIR, target.slice(2));
  } else if (!path.isAbsolute(target)) {
    target = path.join(OPENCODE_CONFIG_DIR, target);
  }

  return target;
};

const writePromptFile = (filePath: string, content: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
};

const getProjectConfigPath = (workingDirectory?: string): string | null => {
  if (!workingDirectory) return null;
  return path.join(workingDirectory, 'opencode.json');
};

const getConfigPaths = (workingDirectory?: string) => ({
  userPath: CONFIG_FILE,
  projectPath: getProjectConfigPath(workingDirectory),
  customPath: CUSTOM_CONFIG_FILE
});

const readConfigFile = (filePath?: string | null): Record<string, unknown> => {
  if (!filePath || !fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const normalized = stripJsonComments(content).trim();
  if (!normalized) return {};
  return JSON.parse(normalized) as Record<string, unknown>;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const mergeConfigs = (base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (key in result) {
      const baseValue = result[key];
      if (isPlainObject(baseValue) && isPlainObject(value)) {
        result[key] = mergeConfigs(baseValue, value);
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
};

const readConfigLayers = (workingDirectory?: string) => {
  const { userPath, projectPath, customPath } = getConfigPaths(workingDirectory);
  const userConfig = readConfigFile(userPath);
  const projectConfig = readConfigFile(projectPath);
  const customConfig = readConfigFile(customPath);
  const mergedConfig = mergeConfigs(mergeConfigs(userConfig, projectConfig), customConfig);

  return {
    userConfig,
    projectConfig,
    customConfig,
    mergedConfig,
    paths: { userPath, projectPath, customPath }
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use or debugging
const readConfig = (workingDirectory?: string): Record<string, unknown> =>
  readConfigLayers(workingDirectory).mergedConfig;

const writeConfig = (config: Record<string, unknown>, filePath: string = CONFIG_FILE) => {
  if (fs.existsSync(filePath)) {
    const backupFile = `${filePath}.openchamber.backup`;
    try {
      fs.copyFileSync(filePath, backupFile);
    } catch {
      // ignore backup failures
    }
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
};

const getJsonEntrySource = (
  layers: ReturnType<typeof readConfigLayers>,
  sectionKey: 'agent' | 'command',
  entryName: string
) => {
  const { userConfig, projectConfig, customConfig, paths } = layers;
  const customSection = (customConfig as Record<string, unknown>)?.[sectionKey] as Record<string, unknown> | undefined;
  if (customSection?.[entryName] !== undefined) {
    return { section: customSection[entryName], config: customConfig, path: paths.customPath, exists: true };
  }

  const projectSection = (projectConfig as Record<string, unknown>)?.[sectionKey] as Record<string, unknown> | undefined;
  if (projectSection?.[entryName] !== undefined) {
    return { section: projectSection[entryName], config: projectConfig, path: paths.projectPath, exists: true };
  }

  const userSection = (userConfig as Record<string, unknown>)?.[sectionKey] as Record<string, unknown> | undefined;
  if (userSection?.[entryName] !== undefined) {
    return { section: userSection[entryName], config: userConfig, path: paths.userPath, exists: true };
  }

  return { section: null, config: null, path: null, exists: false };
};

const getJsonWriteTarget = (
  layers: ReturnType<typeof readConfigLayers>,
  preferredScope: AgentScope | CommandScope
) => {
  const { userConfig, projectConfig, customConfig, paths } = layers;
  if (paths.customPath) {
    return { config: customConfig, path: paths.customPath };
  }
  if (preferredScope === AGENT_SCOPE.PROJECT && paths.projectPath) {
    return { config: projectConfig, path: paths.projectPath };
  }
  if (paths.projectPath) {
    return { config: projectConfig, path: paths.projectPath };
  }
  return { config: userConfig, path: paths.userPath };
};

const parseMdFile = (filePath: string): { frontmatter: Record<string, unknown>; body: string } => {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content.trim() };
  return { frontmatter: (yaml.parse(match[1]) || {}) as Record<string, unknown>, body: (match[2] || '').trim() };
};

const writeMdFile = (filePath: string, frontmatter: Record<string, unknown>, body: string) => {
  // Filter out null/undefined values - OpenCode expects keys to be omitted rather than set to null
  const cleanedFrontmatter = Object.fromEntries(
    Object.entries(frontmatter ?? {}).filter(([, value]) => value != null)
  );
  const yamlStr = yaml.stringify(cleanedFrontmatter);
  const content = `---\n${yamlStr}---\n\n${body ?? ''}`.trimEnd();
  fs.writeFileSync(filePath, content, 'utf8');
};

export const getAgentSources = (agentName: string, workingDirectory?: string): ConfigSources => {
  // Check project level first (takes precedence)
  const projectPath = workingDirectory ? getProjectAgentPath(workingDirectory, agentName) : null;
  const projectExists = projectPath ? fs.existsSync(projectPath) : false;
  
  // Then check user level
  const userPath = getUserAgentPath(agentName);
  const userExists = fs.existsSync(userPath);
  
  // Determine which md file to use (project takes precedence)
  const mdPath = projectExists ? projectPath : (userExists ? userPath : null);
  const mdExists = !!mdPath;
  const mdScope = projectExists ? AGENT_SCOPE.PROJECT : (userExists ? AGENT_SCOPE.USER : null);

  const layers = readConfigLayers(workingDirectory);
  const jsonSource = getJsonEntrySource(layers, 'agent', agentName);
  const agentSection = jsonSource.section as Record<string, unknown> | undefined;
  const jsonPath = jsonSource.path || layers.paths.customPath || layers.paths.projectPath || layers.paths.userPath;
  const jsonScope = jsonSource.path === layers.paths.projectPath ? AGENT_SCOPE.PROJECT : AGENT_SCOPE.USER;

  const sources: ConfigSources = {
    md: { exists: mdExists, path: mdPath, scope: mdScope, fields: [] },
    json: { exists: jsonSource.exists, path: jsonPath || CONFIG_FILE, scope: jsonSource.exists ? jsonScope : null, fields: [] },
    projectMd: { exists: projectExists, path: projectPath },
    userMd: { exists: userExists, path: userPath }
  };

  if (mdExists && mdPath) {
    const { frontmatter, body } = parseMdFile(mdPath);
    sources.md.fields = Object.keys(frontmatter);
    if (body) sources.md.fields.push('prompt');
  }

  if (agentSection) {
    sources.json.fields = Object.keys(agentSection);
  }

  return sources;
};

export const createAgent = (agentName: string, config: Record<string, unknown>, workingDirectory?: string, scope?: AgentScope) => {
  ensureDirs();

  // Check if agent already exists at either level
  const projectPath = workingDirectory ? getProjectAgentPath(workingDirectory, agentName) : null;
  const userPath = getUserAgentPath(agentName);
  
  if (projectPath && fs.existsSync(projectPath)) {
    throw new Error(`Agent ${agentName} already exists as project-level .md file`);
  }
  
  if (fs.existsSync(userPath)) {
    throw new Error(`Agent ${agentName} already exists as user-level .md file`);
  }

  const layers = readConfigLayers(workingDirectory);
  const jsonSource = getJsonEntrySource(layers, 'agent', agentName);
  if (jsonSource.exists) throw new Error(`Agent ${agentName} already exists in opencode.json`);

  // Determine target path based on requested scope
  let targetPath: string;
  
  if (scope === AGENT_SCOPE.PROJECT && workingDirectory) {
    ensureProjectAgentDir(workingDirectory);
    targetPath = projectPath!;
  } else {
    targetPath = userPath;
  }

  // Extract scope and prompt from config - scope is only used for path determination, not written to file
  const { prompt, scope: _ignored, ...frontmatter } = config as Record<string, unknown> & { prompt?: unknown; scope?: unknown };
  void _ignored; // Scope is only used for path determination
  writeMdFile(targetPath, frontmatter, typeof prompt === 'string' ? prompt : '');
};

export const updateAgent = (agentName: string, updates: Record<string, unknown>, workingDirectory?: string) => {
  ensureDirs();

  // Determine correct path: project level takes precedence
  const { path: mdPath } = getAgentWritePath(agentName, workingDirectory);
  const mdExists = mdPath ? fs.existsSync(mdPath) : false;
  
  // Check if agent exists in opencode.json across all config layers
  const layers = readConfigLayers(workingDirectory);
  const jsonSource = getJsonEntrySource(layers, 'agent', agentName);
  const jsonSection = jsonSource.section as Record<string, unknown> | undefined;
  const hasJsonFields = Boolean(jsonSource.exists && jsonSection && Object.keys(jsonSection).length > 0);
  const jsonTarget = jsonSource.exists
    ? { config: jsonSource.config, path: jsonSource.path }
    : getJsonWriteTarget(layers, workingDirectory ? AGENT_SCOPE.PROJECT : AGENT_SCOPE.USER);
  const config = (jsonTarget.config || {}) as Record<string, unknown>;
  
  // Determine if we should create a new md file:
  // Only for built-in agents (no md file AND no json config)
  const isBuiltinOverride = !mdExists && !hasJsonFields;
  
  let targetPath = mdPath;
  
  if (!mdExists && isBuiltinOverride) {
    // Built-in agent override - create at user level
    targetPath = getUserAgentPath(agentName);
  }

  // Only create md data for existing md files or built-in overrides
  const mdData = mdExists && mdPath ? parseMdFile(mdPath) : (isBuiltinOverride ? { frontmatter: {} as Record<string, unknown>, body: '' } : null);

  let mdModified = false;
  let jsonModified = false;
  // Only create new md if it's a built-in override
  const creatingNewMd = isBuiltinOverride;

  for (const [field, value] of Object.entries(updates || {})) {
    if (field === 'prompt') {
      const normalizedValue = typeof value === 'string' ? value : value == null ? '' : String(value);

      if (mdExists || creatingNewMd) {
        if (mdData) {
          mdData.body = normalizedValue;
          mdModified = true;
        }
        continue;
      }

      if (isPromptFileReference(jsonSection?.prompt)) {
        const promptFilePath = resolvePromptFilePath(jsonSection.prompt);
        if (!promptFilePath) throw new Error(`Invalid prompt file reference for agent ${agentName}`);
        writePromptFile(promptFilePath, normalizedValue);
        continue;
      }

      // For JSON-only agents, store prompt inline in JSON
      if (!config.agent) config.agent = {};
      const current = ((config.agent as Record<string, unknown>)[agentName] as Record<string, unknown> | undefined) ?? {};
      (config.agent as Record<string, unknown>)[agentName] = { ...current, prompt: normalizedValue };
      jsonModified = true;
      continue;
    }

    const hasMdField = Boolean(mdData?.frontmatter?.[field] !== undefined);
    const hasJsonField = Boolean(jsonSection?.[field] !== undefined);

    // JSON takes precedence over md, so update JSON first if field exists there
    if (hasJsonField) {
      if (!config.agent) config.agent = {};
      const current = ((config.agent as Record<string, unknown>)[agentName] as Record<string, unknown> | undefined) ?? {};
      (config.agent as Record<string, unknown>)[agentName] = { ...current, [field]: value };
      jsonModified = true;
      continue;
    }

    if (hasMdField || creatingNewMd) {
      if (mdData) {
        mdData.frontmatter[field] = value;
        mdModified = true;
      }
      continue;
    }

    // New field - add to appropriate location based on agent source
    if ((mdExists || creatingNewMd) && mdData) {
      mdData.frontmatter[field] = value;
      mdModified = true;
    } else {
      if (!config.agent) config.agent = {};
      const current = ((config.agent as Record<string, unknown>)[agentName] as Record<string, unknown> | undefined) ?? {};
      (config.agent as Record<string, unknown>)[agentName] = { ...current, [field]: value };
      jsonModified = true;
    }
  }

  if (mdModified && mdData && targetPath) {
    writeMdFile(targetPath, mdData.frontmatter, mdData.body);
  }

  if (jsonModified) {
    writeConfig(config, jsonTarget.path || CONFIG_FILE);
  }
};

export const deleteAgent = (agentName: string, workingDirectory?: string) => {
  let deleted = false;

  // Check project level first (takes precedence)
  if (workingDirectory) {
    const projectPath = getProjectAgentPath(workingDirectory, agentName);
    if (fs.existsSync(projectPath)) {
      fs.unlinkSync(projectPath);
      deleted = true;
    }
  }

  // Then check user level
  const userPath = getUserAgentPath(agentName);
  if (fs.existsSync(userPath)) {
    fs.unlinkSync(userPath);
    deleted = true;
  }

  // Also check json config (highest precedence entry only)
  const layers = readConfigLayers(workingDirectory);
  const jsonSource = getJsonEntrySource(layers, 'agent', agentName);
  if (jsonSource.exists && jsonSource.config && jsonSource.path) {
    const targetConfig = jsonSource.config as Record<string, unknown>;
    const agentMap = (targetConfig.agent as Record<string, unknown> | undefined) ?? {};
    delete agentMap[agentName];
    targetConfig.agent = agentMap;
    writeConfig(targetConfig, jsonSource.path);
    deleted = true;
  }

  // If nothing was deleted (built-in agent), disable it in highest-precedence config
  if (!deleted) {
    const jsonTarget = getJsonWriteTarget(layers, workingDirectory ? AGENT_SCOPE.PROJECT : AGENT_SCOPE.USER);
    const targetConfig = (jsonTarget.config || {}) as Record<string, unknown>;
    const agentMap = (targetConfig.agent as Record<string, unknown> | undefined) ?? {};
    agentMap[agentName] = { disable: true };
    targetConfig.agent = agentMap;
    writeConfig(targetConfig, jsonTarget.path || CONFIG_FILE);
  }
};

export const getCommandSources = (commandName: string, workingDirectory?: string): ConfigSources => {
  // Check project level first (takes precedence)
  const projectPath = workingDirectory ? getProjectCommandPath(workingDirectory, commandName) : null;
  const projectExists = projectPath ? fs.existsSync(projectPath) : false;
  
  // Then check user level
  const userPath = getUserCommandPath(commandName);
  const userExists = fs.existsSync(userPath);
  
  // Determine which md file to use (project takes precedence)
  const mdPath = projectExists ? projectPath : (userExists ? userPath : null);
  const mdExists = !!mdPath;
  const mdScope = projectExists ? COMMAND_SCOPE.PROJECT : (userExists ? COMMAND_SCOPE.USER : null);

  const layers = readConfigLayers(workingDirectory);
  const jsonSource = getJsonEntrySource(layers, 'command', commandName);
  const commandSection = jsonSource.section as Record<string, unknown> | undefined;
  const jsonPath = jsonSource.path || layers.paths.customPath || layers.paths.projectPath || layers.paths.userPath;

  const sources: ConfigSources = {
    md: { exists: mdExists, path: mdPath, scope: mdScope, fields: [] },
    json: { exists: jsonSource.exists, path: jsonPath || CONFIG_FILE, fields: [] },
    projectMd: { exists: projectExists, path: projectPath },
    userMd: { exists: userExists, path: userPath }
  };

  if (mdExists && mdPath) {
    const { frontmatter, body } = parseMdFile(mdPath);
    sources.md.fields = Object.keys(frontmatter);
    if (body) sources.md.fields.push('template');
  }

  if (commandSection) {
    sources.json.fields = Object.keys(commandSection);
  }

  return sources;
};

export const createCommand = (commandName: string, config: Record<string, unknown>, workingDirectory?: string, scope?: CommandScope) => {
  ensureDirs();

  // Check if command already exists at either level
  const projectPath = workingDirectory ? getProjectCommandPath(workingDirectory, commandName) : null;
  const userPath = getUserCommandPath(commandName);
  
  if (projectPath && fs.existsSync(projectPath)) {
    throw new Error(`Command ${commandName} already exists as project-level .md file`);
  }
  
  if (fs.existsSync(userPath)) {
    throw new Error(`Command ${commandName} already exists as user-level .md file`);
  }

  const layers = readConfigLayers(workingDirectory);
  const jsonSource = getJsonEntrySource(layers, 'command', commandName);
  if (jsonSource.exists) throw new Error(`Command ${commandName} already exists in opencode.json`);

  // Determine target path based on requested scope
  let targetPath: string;
  
  if (scope === COMMAND_SCOPE.PROJECT && workingDirectory) {
    ensureProjectCommandDir(workingDirectory);
    targetPath = projectPath!;
  } else {
    targetPath = userPath;
  }

  // Extract scope from config - it's only used for path determination, not written to file
  const { template, scope: _ignored, ...frontmatter } = config as Record<string, unknown> & { template?: unknown; scope?: unknown };
  void _ignored; // Scope is only used for path determination
  writeMdFile(targetPath, frontmatter, typeof template === 'string' ? template : '');
};

export const updateCommand = (commandName: string, updates: Record<string, unknown>, workingDirectory?: string) => {
  ensureDirs();

  // Determine correct path: project level takes precedence
  const { path: mdPath } = getCommandWritePath(commandName, workingDirectory);
  const mdExists = mdPath ? fs.existsSync(mdPath) : false;

  const layers = readConfigLayers(workingDirectory);
  const jsonSource = getJsonEntrySource(layers, 'command', commandName);
  const jsonSection = jsonSource.section as Record<string, unknown> | undefined;
  const hasJsonFields = Boolean(jsonSource.exists && jsonSection && Object.keys(jsonSection).length > 0);
  const jsonTarget = jsonSource.exists
    ? { config: jsonSource.config, path: jsonSource.path }
    : getJsonWriteTarget(layers, workingDirectory ? COMMAND_SCOPE.PROJECT : COMMAND_SCOPE.USER);
  const config = (jsonTarget.config || {}) as Record<string, unknown>;

  // Only create a new md file for built-in overrides (no md + no json)
  const isBuiltinOverride = !mdExists && !hasJsonFields;

  let targetPath = mdPath;
  if (!mdExists && isBuiltinOverride) {
    // Built-in command override - create at user level
    targetPath = getUserCommandPath(commandName);
  }

  const mdData = mdExists && mdPath ? parseMdFile(mdPath) : (isBuiltinOverride ? { frontmatter: {} as Record<string, unknown>, body: '' } : null);

  let mdModified = false;
  let jsonModified = false;
  const creatingNewMd = isBuiltinOverride;

  for (const [field, value] of Object.entries(updates || {})) {
    if (field === 'template') {
      const normalizedValue = typeof value === 'string' ? value : value == null ? '' : String(value);

      if (mdExists || creatingNewMd) {
        if (mdData) {
          mdData.body = normalizedValue;
          mdModified = true;
        }
        continue;
      }

      if (isPromptFileReference(jsonSection?.template)) {
        const templateFilePath = resolvePromptFilePath(jsonSection.template);
        if (!templateFilePath) throw new Error(`Invalid template file reference for command ${commandName}`);
        writePromptFile(templateFilePath, normalizedValue);
        continue;
      }

      // For JSON-only commands, store template inline in JSON
      if (!config.command) config.command = {};
      const current = ((config.command as Record<string, unknown>)[commandName] as Record<string, unknown> | undefined) ?? {};
      (config.command as Record<string, unknown>)[commandName] = { ...current, template: normalizedValue };
      jsonModified = true;
      continue;
    }

    const hasMdField = Boolean(mdData?.frontmatter?.[field] !== undefined);
    const hasJsonField = Boolean(jsonSection?.[field] !== undefined);

    // JSON takes precedence over md, so update JSON first if field exists there
    if (hasJsonField) {
      if (!config.command) config.command = {};
      const current = ((config.command as Record<string, unknown>)[commandName] as Record<string, unknown> | undefined) ?? {};
      (config.command as Record<string, unknown>)[commandName] = { ...current, [field]: value };
      jsonModified = true;
      continue;
    }

    if (hasMdField || creatingNewMd) {
      if (mdData) {
        mdData.frontmatter[field] = value;
        mdModified = true;
      }
      continue;
    }

    // New field - add to appropriate location based on command source
    if ((mdExists || creatingNewMd) && mdData) {
      mdData.frontmatter[field] = value;
      mdModified = true;
    } else {
      if (!config.command) config.command = {};
      const current = ((config.command as Record<string, unknown>)[commandName] as Record<string, unknown> | undefined) ?? {};
      (config.command as Record<string, unknown>)[commandName] = { ...current, [field]: value };
      jsonModified = true;
    }
  }

  if (mdModified && mdData && targetPath) {
    writeMdFile(targetPath, mdData.frontmatter, mdData.body);
  }

  if (jsonModified) {
    writeConfig(config, jsonTarget.path || CONFIG_FILE);
  }
};

export const deleteCommand = (commandName: string, workingDirectory?: string) => {
  let deleted = false;

  // Check project level first (takes precedence)
  if (workingDirectory) {
    const projectPath = getProjectCommandPath(workingDirectory, commandName);
    if (fs.existsSync(projectPath)) {
      fs.unlinkSync(projectPath);
      deleted = true;
    }
  }

  // Then check user level
  const userPath = getUserCommandPath(commandName);
  if (fs.existsSync(userPath)) {
    fs.unlinkSync(userPath);
    deleted = true;
  }

  // Also check json config (highest precedence entry only)
  const layers = readConfigLayers(workingDirectory);
  const jsonSource = getJsonEntrySource(layers, 'command', commandName);
  if (jsonSource.exists && jsonSource.config && jsonSource.path) {
    const targetConfig = jsonSource.config as Record<string, unknown>;
    const commandMap = (targetConfig.command as Record<string, unknown> | undefined) ?? {};
    delete commandMap[commandName];
    targetConfig.command = commandMap;
    writeConfig(targetConfig, jsonSource.path);
    deleted = true;
  }

  if (!deleted) {
    throw new Error(`Command "${commandName}" not found`);
  }
};

