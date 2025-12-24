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

export type ConfigSources = {
  md: { exists: boolean; path: string | null; fields: string[] };
  json: { exists: boolean; path: string; fields: string[] };
};

const ensureDirs = () => {
  if (!fs.existsSync(OPENCODE_CONFIG_DIR)) fs.mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(AGENT_DIR)) fs.mkdirSync(AGENT_DIR, { recursive: true });
  if (!fs.existsSync(COMMAND_DIR)) fs.mkdirSync(COMMAND_DIR, { recursive: true });
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
  const yamlStr = yaml.stringify(frontmatter ?? {});
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

export const getCommandSources = (commandName: string): ConfigSources => {
  const mdPath = path.join(COMMAND_DIR, `${commandName}.md`);
  const mdExists = fs.existsSync(mdPath);

  const config = readConfig();
  const commandSection = (config.command as Record<string, unknown> | undefined)?.[commandName] as Record<string, unknown> | undefined;

  const sources: ConfigSources = {
    md: { exists: mdExists, path: mdExists ? mdPath : null, fields: [] },
    json: { exists: Boolean(commandSection), path: CONFIG_FILE, fields: [] },
  };

  if (mdExists) {
    const { frontmatter, body } = parseMdFile(mdPath);
    sources.md.fields = Object.keys(frontmatter);
    if (body) sources.md.fields.push('template');
  }

  if (commandSection) {
    sources.json.fields = Object.keys(commandSection);
  }

  return sources;
};

export const createCommand = (commandName: string, config: Record<string, unknown>) => {
  ensureDirs();

  const mdPath = path.join(COMMAND_DIR, `${commandName}.md`);
  if (fs.existsSync(mdPath)) throw new Error(`Command ${commandName} already exists as .md file`);

  const existingConfig = readConfig();
  const commandMap = existingConfig.command as Record<string, unknown> | undefined;
  if (commandMap?.[commandName]) throw new Error(`Command ${commandName} already exists in opencode.json`);

  const { template, ...frontmatter } = config as Record<string, unknown> & { template?: unknown };
  writeMdFile(mdPath, frontmatter, typeof template === 'string' ? template : '');
};

export const updateCommand = (commandName: string, updates: Record<string, unknown>) => {
  ensureDirs();

  const mdPath = path.join(COMMAND_DIR, `${commandName}.md`);
  const mdExists = fs.existsSync(mdPath);

  const mdData = mdExists ? parseMdFile(mdPath) : null;
  const config = readConfig();
  const commandMap = (config.command as Record<string, unknown> | undefined) ?? {};
  const jsonSection = commandMap[commandName] as Record<string, unknown> | undefined;

  let mdModified = false;
  let jsonModified = false;

  for (const [field, value] of Object.entries(updates || {})) {
    if (field === 'template') {
      const normalizedValue = typeof value === 'string' ? value : value == null ? '' : String(value);

      if (mdExists && mdData) {
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

      if (!config.command) config.command = {};
      const target = (config.command as Record<string, unknown>)[commandName] as Record<string, unknown> | undefined;
      (config.command as Record<string, unknown>)[commandName] = { ...(target || {}), template: normalizedValue };
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

    if (!config.command) config.command = {};
    const current = ((config.command as Record<string, unknown>)[commandName] as Record<string, unknown> | undefined) ?? {};
    (config.command as Record<string, unknown>)[commandName] = { ...current, [field]: value };
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

export const deleteCommand = (commandName: string) => {
  const mdPath = path.join(COMMAND_DIR, `${commandName}.md`);
  let deleted = false;

  if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
    deleted = true;
  }

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

