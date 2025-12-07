import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'yaml';
import stripJsonComments from 'strip-json-comments';

const OPENCODE_CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode');
const AGENT_DIR = path.join(OPENCODE_CONFIG_DIR, 'agent');
const COMMAND_DIR = path.join(OPENCODE_CONFIG_DIR, 'command');
const CONFIG_FILE = path.join(OPENCODE_CONFIG_DIR, 'opencode.json');
const PROMPT_FILE_PATTERN = /^\{file:(.+)\}$/i;

function ensureDirs() {
  if (!fs.existsSync(OPENCODE_CONFIG_DIR)) {
    fs.mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(AGENT_DIR)) {
    fs.mkdirSync(AGENT_DIR, { recursive: true });
  }
  if (!fs.existsSync(COMMAND_DIR)) {
    fs.mkdirSync(COMMAND_DIR, { recursive: true });
  }
}

function isPromptFileReference(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return PROMPT_FILE_PATTERN.test(value.trim());
}

function resolvePromptFilePath(reference) {
  const match = typeof reference === 'string' ? reference.trim().match(PROMPT_FILE_PATTERN) : null;
  if (!match) {
    return null;
  }
  let target = match[1].trim();
  if (!target) {
    return null;
  }

  if (target.startsWith('./')) {
    target = target.slice(2);
    target = path.join(OPENCODE_CONFIG_DIR, target);
  } else if (!path.isAbsolute(target)) {
    target = path.join(OPENCODE_CONFIG_DIR, target);
  }

  return target;
}

function writePromptFile(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content ?? '', 'utf8');
  console.log(`Updated prompt file: ${filePath}`);
}

function readConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    const normalized = stripJsonComments(content).trim();
    if (!normalized) {
      return {};
    }
    return JSON.parse(normalized);
  } catch (error) {
    console.error('Failed to read config file:', error);
    throw new Error('Failed to read OpenCode configuration');
  }
}

function writeConfig(config) {
  try {

    if (fs.existsSync(CONFIG_FILE)) {
      const backupFile = `${CONFIG_FILE}.openchamber.backup`;
      fs.copyFileSync(CONFIG_FILE, backupFile);
      console.log(`Created config backup: ${backupFile}`);
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('Successfully wrote config file');
  } catch (error) {
    console.error('Failed to write config file:', error);
    throw new Error('Failed to write OpenCode configuration');
  }
}

function parseMdFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

    if (!match) {
      return { frontmatter: {}, body: content.trim() };
    }

    const frontmatter = yaml.parse(match[1]) || {};
    const body = match[2].trim();

    return { frontmatter, body };
  } catch (error) {
    console.error(`Failed to parse markdown file ${filePath}:`, error);
    throw new Error('Failed to parse agent markdown file');
  }
}

function writeMdFile(filePath, frontmatter, body) {
  try {
    const yamlStr = yaml.stringify(frontmatter);
    const content = `---\n${yamlStr}---\n\n${body}`;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully wrote markdown file: ${filePath}`);
  } catch (error) {
    console.error(`Failed to write markdown file ${filePath}:`, error);
    throw new Error('Failed to write agent markdown file');
  }
}

function getAgentSources(agentName) {
  const mdPath = path.join(AGENT_DIR, `${agentName}.md`);
  const mdExists = fs.existsSync(mdPath);

  const config = readConfig();
  const jsonSection = config.agent?.[agentName];

  const sources = {
    md: {
      exists: mdExists,
      path: mdExists ? mdPath : null,
      fields: []
    },
    json: {
      exists: !!jsonSection,
      path: CONFIG_FILE,
      fields: []
    }
  };

  if (mdExists) {
    const { frontmatter, body } = parseMdFile(mdPath);
    sources.md.fields = Object.keys(frontmatter);
    if (body) {
      sources.md.fields.push('prompt');
    }
  }

  if (jsonSection) {
    sources.json.fields = Object.keys(jsonSection);
  }

  return sources;
}

function createAgent(agentName, config) {
  ensureDirs();

  const mdPath = path.join(AGENT_DIR, `${agentName}.md`);

  if (fs.existsSync(mdPath)) {
    throw new Error(`Agent ${agentName} already exists as .md file`);
  }

  const existingConfig = readConfig();
  if (existingConfig.agent?.[agentName]) {
    throw new Error(`Agent ${agentName} already exists in opencode.json`);
  }

  const { prompt, ...frontmatter } = config;

  writeMdFile(mdPath, frontmatter, prompt || '');
  console.log(`Created new agent: ${agentName}`);
}

function updateAgent(agentName, updates) {
  ensureDirs();

  const mdPath = path.join(AGENT_DIR, `${agentName}.md`);
  const mdExists = fs.existsSync(mdPath);

  let mdData = mdExists ? parseMdFile(mdPath) : null;
  let config = readConfig();
  const jsonSection = config.agent?.[agentName];

  let mdModified = false;
  let jsonModified = false;

  for (const [field, value] of Object.entries(updates)) {

    if (field === 'prompt') {
      const normalizedValue = typeof value === 'string' ? value : (value == null ? '' : String(value));

      if (mdExists) {
        mdData.body = normalizedValue;
        mdModified = true;
      } else if (isPromptFileReference(jsonSection?.prompt)) {
        const promptFilePath = resolvePromptFilePath(jsonSection.prompt);
        if (!promptFilePath) {
          throw new Error(`Invalid prompt file reference for agent ${agentName}`);
        }
        writePromptFile(promptFilePath, normalizedValue);
      } else if (isPromptFileReference(normalizedValue)) {
        if (!config.agent) config.agent = {};
        if (!config.agent[agentName]) config.agent[agentName] = {};
        config.agent[agentName].prompt = normalizedValue;
        jsonModified = true;
      } else {
        if (!config.agent) config.agent = {};
        if (!config.agent[agentName]) config.agent[agentName] = {};
        config.agent[agentName].prompt = normalizedValue;
        jsonModified = true;
      }
      continue;
    }

    const inMd = mdData?.frontmatter?.[field] !== undefined;
    const inJson = jsonSection?.[field] !== undefined;

    if (inMd) {

      mdData.frontmatter[field] = value;
      mdModified = true;
    } else if (inJson) {

      if (!config.agent) config.agent = {};
      if (!config.agent[agentName]) config.agent[agentName] = {};
      config.agent[agentName][field] = value;
      jsonModified = true;
    } else {

      if (mdExists && jsonSection) {

        if (!config.agent) config.agent = {};
        if (!config.agent[agentName]) config.agent[agentName] = {};
        config.agent[agentName][field] = value;
        jsonModified = true;
      } else if (mdExists) {

        mdData.frontmatter[field] = value;
        mdModified = true;
      } else {

        if (!config.agent) config.agent = {};
        if (!config.agent[agentName]) config.agent[agentName] = {};
        config.agent[agentName][field] = value;
        jsonModified = true;
      }
    }
  }

  if (mdModified) {
    writeMdFile(mdPath, mdData.frontmatter, mdData.body);
  }

  if (jsonModified) {
    writeConfig(config);
  }

  console.log(`Updated agent: ${agentName} (md: ${mdModified}, json: ${jsonModified})`);
}

function deleteAgent(agentName) {
  const mdPath = path.join(AGENT_DIR, `${agentName}.md`);
  let deleted = false;

  if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
    console.log(`Deleted agent .md file: ${mdPath}`);
    deleted = true;
  }

  const config = readConfig();
  if (config.agent?.[agentName]) {
    delete config.agent[agentName];
    writeConfig(config);
    console.log(`Removed agent from opencode.json: ${agentName}`);
    deleted = true;
  }

  if (!deleted) {
    if (!config.agent) config.agent = {};
    config.agent[agentName] = { disable: true };
    writeConfig(config);
    console.log(`Disabled built-in agent: ${agentName}`);
  }
}

function getCommandSources(commandName) {
  const mdPath = path.join(COMMAND_DIR, `${commandName}.md`);
  const mdExists = fs.existsSync(mdPath);

  const config = readConfig();
  const jsonSection = config.command?.[commandName];

  const sources = {
    md: {
      exists: mdExists,
      path: mdExists ? mdPath : null,
      fields: []
    },
    json: {
      exists: !!jsonSection,
      path: CONFIG_FILE,
      fields: []
    }
  };

  if (mdExists) {
    const { frontmatter, body } = parseMdFile(mdPath);
    sources.md.fields = Object.keys(frontmatter);
    if (body) {
      sources.md.fields.push('template');
    }
  }

  if (jsonSection) {
    sources.json.fields = Object.keys(jsonSection);
  }

  return sources;
}

function createCommand(commandName, config) {
  ensureDirs();

  const mdPath = path.join(COMMAND_DIR, `${commandName}.md`);

  if (fs.existsSync(mdPath)) {
    throw new Error(`Command ${commandName} already exists as .md file`);
  }

  const existingConfig = readConfig();
  if (existingConfig.command?.[commandName]) {
    throw new Error(`Command ${commandName} already exists in opencode.json`);
  }

  const { template, ...frontmatter } = config;

  writeMdFile(mdPath, frontmatter, template || '');
  console.log(`Created new command: ${commandName}`);
}

function updateCommand(commandName, updates) {
  ensureDirs();

  const mdPath = path.join(COMMAND_DIR, `${commandName}.md`);
  const mdExists = fs.existsSync(mdPath);

  let mdData = mdExists ? parseMdFile(mdPath) : null;
  let config = readConfig();
  const jsonSection = config.command?.[commandName];

  let mdModified = false;
  let jsonModified = false;

  for (const [field, value] of Object.entries(updates)) {

    if (field === 'template') {
      const normalizedValue = typeof value === 'string' ? value : (value == null ? '' : String(value));

      if (mdExists) {
        mdData.body = normalizedValue;
        mdModified = true;
      } else if (isPromptFileReference(jsonSection?.template)) {
        const templateFilePath = resolvePromptFilePath(jsonSection.template);
        if (!templateFilePath) {
          throw new Error(`Invalid template file reference for command ${commandName}`);
        }
        writePromptFile(templateFilePath, normalizedValue);
      } else if (isPromptFileReference(normalizedValue)) {
        if (!config.command) config.command = {};
        if (!config.command[commandName]) config.command[commandName] = {};
        config.command[commandName].template = normalizedValue;
        jsonModified = true;
      } else {
        if (!config.command) config.command = {};
        if (!config.command[commandName]) config.command[commandName] = {};
        config.command[commandName].template = normalizedValue;
        jsonModified = true;
      }
      continue;
    }

    const inMd = mdData?.frontmatter?.[field] !== undefined;
    const inJson = jsonSection?.[field] !== undefined;

    if (inMd) {

      mdData.frontmatter[field] = value;
      mdModified = true;
    } else if (inJson) {

      if (!config.command) config.command = {};
      if (!config.command[commandName]) config.command[commandName] = {};
      config.command[commandName][field] = value;
      jsonModified = true;
    } else {

      if (mdExists && jsonSection) {

        if (!config.command) config.command = {};
        if (!config.command[commandName]) config.command[commandName] = {};
        config.command[commandName][field] = value;
        jsonModified = true;
      } else if (mdExists) {

        mdData.frontmatter[field] = value;
        mdModified = true;
      } else {

        if (!config.command) config.command = {};
        if (!config.command[commandName]) config.command[commandName] = {};
        config.command[commandName][field] = value;
        jsonModified = true;
      }
    }
  }

  if (mdModified) {
    writeMdFile(mdPath, mdData.frontmatter, mdData.body);
  }

  if (jsonModified) {
    writeConfig(config);
  }

  console.log(`Updated command: ${commandName} (md: ${mdModified}, json: ${jsonModified})`);
}

function deleteCommand(commandName) {
  const mdPath = path.join(COMMAND_DIR, `${commandName}.md`);
  let deleted = false;

  if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
    console.log(`Deleted command .md file: ${mdPath}`);
    deleted = true;
  }

  const config = readConfig();
  if (config.command?.[commandName]) {
    delete config.command[commandName];
    writeConfig(config);
    console.log(`Removed command from opencode.json: ${commandName}`);
    deleted = true;
  }

  if (!deleted) {
    throw new Error(`Command "${commandName}" not found`);
  }
}

export {
  getAgentSources,
  createAgent,
  updateAgent,
  deleteAgent,
  getCommandSources,
  createCommand,
  updateCommand,
  deleteCommand,
  readConfig,
  writeConfig,
  AGENT_DIR,
  COMMAND_DIR,
  CONFIG_FILE
};
