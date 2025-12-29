import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'yaml';
import stripJsonComments from 'strip-json-comments';

const OPENCODE_CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode');
const AGENT_DIR = path.join(OPENCODE_CONFIG_DIR, 'agent');
const COMMAND_DIR = path.join(OPENCODE_CONFIG_DIR, 'command');
const CONFIG_FILE = path.join(OPENCODE_CONFIG_DIR, 'opencode.json');
const PROMPT_FILE_PATTERN = /^\{file:(.+)\}$/i;

// Command scope types
export const COMMAND_SCOPE = {
  USER: 'user',
  PROJECT: 'project'
} as const;

export type CommandScope = typeof COMMAND_SCOPE[keyof typeof COMMAND_SCOPE];

export type ConfigSources = {
  md: { exists: boolean; path: string | null; fields: string[]; scope?: CommandScope | null };
  json: { exists: boolean; path: string; fields: string[] };
  projectMd?: { exists: boolean; path: string | null };
  userMd?: { exists: boolean; path: string | null };
};

const ensureDirs = () => {
  if (!fs.existsSync(OPENCODE_CONFIG_DIR)) fs.mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(AGENT_DIR)) fs.mkdirSync(AGENT_DIR, { recursive: true });
  if (!fs.existsSync(COMMAND_DIR)) fs.mkdirSync(COMMAND_DIR, { recursive: true });
};

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

const readConfig = (): Record<string, unknown> => {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  const content = fs.readFileSync(CONFIG_FILE, 'utf8');
  const normalized = stripJsonComments(content).trim();
  if (!normalized) return {};
  return JSON.parse(normalized) as Record<string, unknown>;
};

const writeConfig = (config: Record<string, unknown>) => {
  if (fs.existsSync(CONFIG_FILE)) {
    const backupFile = `${CONFIG_FILE}.openchamber.backup`;
    try {
      fs.copyFileSync(CONFIG_FILE, backupFile);
    } catch {
      // ignore backup failures
    }
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
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

export const getAgentSources = (agentName: string): ConfigSources => {
  const mdPath = path.join(AGENT_DIR, `${agentName}.md`);
  const mdExists = fs.existsSync(mdPath);

  const config = readConfig();
  const agentSection = (config.agent as Record<string, unknown> | undefined)?.[agentName] as Record<string, unknown> | undefined;

  const sources: ConfigSources = {
    md: { exists: mdExists, path: mdExists ? mdPath : null, fields: [] },
    json: { exists: Boolean(agentSection), path: CONFIG_FILE, fields: [] },
  };

  if (mdExists) {
    const { frontmatter, body } = parseMdFile(mdPath);
    sources.md.fields = Object.keys(frontmatter);
    if (body) sources.md.fields.push('prompt');
  }

  if (agentSection) {
    sources.json.fields = Object.keys(agentSection);
  }

  return sources;
};

export const createAgent = (agentName: string, config: Record<string, unknown>) => {
  ensureDirs();

  const mdPath = path.join(AGENT_DIR, `${agentName}.md`);
  if (fs.existsSync(mdPath)) throw new Error(`Agent ${agentName} already exists as .md file`);

  const existingConfig = readConfig();
  const agentMap = existingConfig.agent as Record<string, unknown> | undefined;
  if (agentMap?.[agentName]) throw new Error(`Agent ${agentName} already exists in opencode.json`);

  const { prompt, ...frontmatter } = config as Record<string, unknown> & { prompt?: unknown };
  writeMdFile(mdPath, frontmatter, typeof prompt === 'string' ? prompt : '');
};

export const updateAgent = (agentName: string, updates: Record<string, unknown>) => {
  ensureDirs();

  const mdPath = path.join(AGENT_DIR, `${agentName}.md`);
  const mdExists = fs.existsSync(mdPath);

  const mdData = mdExists ? parseMdFile(mdPath) : null;
  const config = readConfig();
  const agentMap = (config.agent as Record<string, unknown> | undefined) ?? {};
  const jsonSection = agentMap[agentName] as Record<string, unknown> | undefined;

  let mdModified = false;
  let jsonModified = false;

  for (const [field, value] of Object.entries(updates || {})) {
    if (field === 'prompt') {
      const normalizedValue = typeof value === 'string' ? value : value == null ? '' : String(value);

      if (mdExists && mdData) {
        mdData.body = normalizedValue;
        mdModified = true;
        continue;
      }

      if (isPromptFileReference(jsonSection?.prompt)) {
        const promptFilePath = resolvePromptFilePath(jsonSection.prompt);
        if (!promptFilePath) throw new Error(`Invalid prompt file reference for agent ${agentName}`);
        writePromptFile(promptFilePath, normalizedValue);
        continue;
      }

      if (!config.agent) config.agent = {};
      const target = (config.agent as Record<string, unknown>)[agentName] as Record<string, unknown> | undefined;
      (config.agent as Record<string, unknown>)[agentName] = { ...(target || {}), prompt: normalizedValue };
      jsonModified = true;
      continue;
    }

    const hasMdField = Boolean(mdData?.frontmatter?.[field] !== undefined);
    const hasJsonField = Boolean(jsonSection?.[field] !== undefined);

    if (hasMdField && mdData) {
      mdData.frontmatter[field] = value;
      mdModified = true;
      continue;
    }

    if (!config.agent) config.agent = {};
    const current = ((config.agent as Record<string, unknown>)[agentName] as Record<string, unknown> | undefined) ?? {};
    (config.agent as Record<string, unknown>)[agentName] = { ...current, [field]: value };
    jsonModified = true;

    if (hasJsonField) {
      continue;
    }
  }

  if (mdModified && mdData) {
    writeMdFile(mdPath, mdData.frontmatter, mdData.body);
  }

  if (jsonModified) {
    writeConfig(config);
  }
};

export const deleteAgent = (agentName: string) => {
  const mdPath = path.join(AGENT_DIR, `${agentName}.md`);
  let deleted = false;

  if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
    deleted = true;
  }

  const config = readConfig();
  const agentMap = (config.agent as Record<string, unknown> | undefined) ?? {};
  if (agentMap[agentName] !== undefined) {
    delete agentMap[agentName];
    config.agent = agentMap;
    writeConfig(config);
    deleted = true;
  }

  if (!deleted) {
    config.agent = agentMap;
    agentMap[agentName] = { disable: true };
    writeConfig(config);
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

  const config = readConfig();
  const commandSection = (config.command as Record<string, unknown> | undefined)?.[commandName] as Record<string, unknown> | undefined;

  const sources: ConfigSources = {
    md: { exists: mdExists, path: mdPath, scope: mdScope, fields: [] },
    json: { exists: Boolean(commandSection), path: CONFIG_FILE, fields: [] },
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

  const existingConfig = readConfig();
  const commandMap = existingConfig.command as Record<string, unknown> | undefined;
  if (commandMap?.[commandName]) throw new Error(`Command ${commandName} already exists in opencode.json`);

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
  
  // If no existing md file, we need to create one (for built-in command overrides)
  let targetPath = mdPath;
  
  if (!mdExists) {
    // No existing md file - this is a built-in override, create at user level
    targetPath = getUserCommandPath(commandName);
  }

  const mdData = mdExists && mdPath ? parseMdFile(mdPath) : { frontmatter: {} as Record<string, unknown>, body: '' };
  const config = readConfig();
  const commandMap = (config.command as Record<string, unknown> | undefined) ?? {};
  const jsonSection = commandMap[commandName] as Record<string, unknown> | undefined;

  let mdModified = false;
  let jsonModified = false;
  let creatingNewMd = !mdExists;

  for (const [field, value] of Object.entries(updates || {})) {
    if (field === 'template') {
      const normalizedValue = typeof value === 'string' ? value : value == null ? '' : String(value);

      if (mdExists || creatingNewMd) {
        mdData.body = normalizedValue;
        mdModified = true;
        continue;
      }

      if (isPromptFileReference(jsonSection?.template)) {
        const templateFilePath = resolvePromptFilePath(jsonSection.template);
        if (!templateFilePath) throw new Error(`Invalid template file reference for command ${commandName}`);
        writePromptFile(templateFilePath, normalizedValue);
        continue;
      }

      // Create new md file for the update
      mdData.body = normalizedValue;
      mdModified = true;
      creatingNewMd = true;
      continue;
    }

    const hasMdField = Boolean(mdData?.frontmatter?.[field] !== undefined);
    const hasJsonField = Boolean(jsonSection?.[field] !== undefined);

    if (hasMdField || creatingNewMd) {
      mdData.frontmatter[field] = value;
      mdModified = true;
      continue;
    }

    if (hasJsonField) {
      if (!config.command) config.command = {};
      const current = ((config.command as Record<string, unknown>)[commandName] as Record<string, unknown> | undefined) ?? {};
      (config.command as Record<string, unknown>)[commandName] = { ...current, [field]: value };
      jsonModified = true;
      continue;
    }

    // New field - add to md if it exists or we're creating one
    if (mdExists || creatingNewMd) {
      mdData.frontmatter[field] = value;
      mdModified = true;
    } else {
      if (!config.command) config.command = {};
      const current = ((config.command as Record<string, unknown>)[commandName] as Record<string, unknown> | undefined) ?? {};
      (config.command as Record<string, unknown>)[commandName] = { ...current, [field]: value };
      jsonModified = true;
    }
  }

  if (mdModified && targetPath) {
    writeMdFile(targetPath, mdData.frontmatter, mdData.body);
  }

  if (jsonModified) {
    writeConfig(config);
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

  // Also check json config
  const config = readConfig();
  const commandMap = (config.command as Record<string, unknown> | undefined) ?? {};
  if (commandMap[commandName] !== undefined) {
    delete commandMap[commandName];
    config.command = commandMap;
    writeConfig(config);
    deleted = true;
  }

  if (!deleted) {
    throw new Error(`Command "${commandName}" not found`);
  }
};

