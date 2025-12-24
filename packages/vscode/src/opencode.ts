import * as vscode from 'vscode';
import { spawn, ChildProcess, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Optimized timeouts for faster startup
const PORT_DETECTION_TIMEOUT_MS = 10000;
const READY_CHECK_TIMEOUT_MS = 12000;
const READY_CHECK_INTERVAL_MS = 100;  // Fast polling during startup
const HEALTH_CHECK_INTERVAL_MS = 5000;
const SHUTDOWN_TIMEOUT_MS = 3000;

// Regex to detect port from CLI output (matches desktop pattern)
const URL_REGEX = /https?:\/\/[^:\s]+:(\d+)(?:\/[^\s"']*)?/gi;
const FALLBACK_PORT_REGEX = /(?:^|\s)(?:127\.0\.0\.1|localhost):(\d+)/i;

const BIN_CANDIDATES = [
  process.env.OPENCHAMBER_OPENCODE_PATH,
  process.env.OPENCHAMBER_OPENCODE_BIN,
  process.env.OPENCODE_PATH,
  process.env.OPENCODE_BINARY,
  '/opt/homebrew/bin/opencode',
  '/usr/local/bin/opencode',
  '/usr/bin/opencode',
  path.join(os.homedir(), '.local/bin/opencode'),
  path.join(os.homedir(), '.opencode/bin/opencode'),
].filter(Boolean) as string[];

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface OpenCodeManager {
  start(workdir?: string): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  setWorkingDirectory(path: string): Promise<{ success: boolean; restarted: boolean; path: string }>;
  getStatus(): ConnectionStatus;
  getApiUrl(): string | null;
  getWorkingDirectory(): string;
  isCliAvailable(): boolean;
  onStatusChange(callback: (status: ConnectionStatus, error?: string) => void): vscode.Disposable;
}

function isExecutable(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function getLoginShellPath(): string | null {
  if (process.platform === 'win32') {
    return null;
  }

  const shell = process.env.SHELL || '/bin/zsh';
  try {
    const result = spawnSync(shell, ['-lic', 'echo -n "$PATH"'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status === 0 && typeof result.stdout === 'string') {
      const value = result.stdout.trim();
      if (value) {
        return value;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function buildAugmentedPath(): string {
  const augmented = new Set<string>();

  const loginPath = getLoginShellPath();
  if (loginPath) {
    for (const segment of loginPath.split(path.delimiter)) {
      if (segment) {
        augmented.add(segment);
      }
    }
  }

  const current = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const segment of current) {
    augmented.add(segment);
  }

  return Array.from(augmented).join(path.delimiter);
}

function resolveCliPath(): string | null {
  // First check explicit candidates
  for (const candidate of BIN_CANDIDATES) {
    if (candidate && isExecutable(candidate)) {
      return candidate;
    }
  }

  // Then search in augmented PATH
  const augmentedPath = buildAugmentedPath();
  for (const segment of augmentedPath.split(path.delimiter)) {
    const candidate = path.join(segment, 'opencode');
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  // Fallback: try login shell detection
  if (process.platform !== 'win32') {
    const shellCandidates = [
      process.env.SHELL,
      '/bin/bash',
      '/bin/zsh',
      '/bin/sh',
    ].filter(Boolean) as string[];

    for (const shellPath of shellCandidates) {
      if (!isExecutable(shellPath)) continue;
      try {
        const result = spawnSync(shellPath, ['-lic', 'command -v opencode'], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        if (result.status === 0) {
          const candidate = result.stdout.trim().split(/\s+/).pop();
          if (candidate && isExecutable(candidate)) {
            return candidate;
          }
        }
      } catch {
        // continue
      }
    }
  }

  return null;
}

async function checkHealth(apiUrl: string, quick = false): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutMs = quick ? 1500 : 3000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    // For quick checks during startup, just check /health
    if (quick) {
      try {
        const response = await fetch(`${apiUrl}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        return response.ok;
      } catch {
        clearTimeout(timeout);
        return false;
      }
    }
    
    // Full health check: verify multiple endpoints
    const candidates = [`${apiUrl}/health`, `${apiUrl}/config`];
    let successCount = 0;

    for (const target of candidates) {
      try {
        const response = await fetch(target, { signal: controller.signal });
        if (response.ok) {
          successCount++;
          if (successCount >= 2) {
            clearTimeout(timeout);
            return true;
          }
        }
      } catch {
        // try next
      }
    }
    clearTimeout(timeout);
  } catch {
    // ignore
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createOpenCodeManager(_context: vscode.ExtensionContext): OpenCodeManager {
  let childProcess: ChildProcess | null = null;
  let status: ConnectionStatus = 'disconnected';
  let healthCheckInterval: NodeJS.Timeout | null = null;
  let lastError: string | undefined;
  const listeners = new Set<(status: ConnectionStatus, error?: string) => void>();
  let workingDirectory: string = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || os.homedir();
  
  // Port detection state (like desktop)
  let detectedPort: number | null = null;
  let portWaiters: Array<(port: number) => void> = [];
  
  // Check if user configured a specific API URL
  const config = vscode.workspace.getConfiguration('openchamber');
  const configuredApiUrl = config.get<string>('apiUrl') || '';
  const useConfiguredUrl = configuredApiUrl && configuredApiUrl.trim().length > 0;
  
  // Parse configured URL to extract port if specified
  let configuredPort: number | null = null;
  if (useConfiguredUrl) {
    try {
      const parsed = new URL(configuredApiUrl);
      if (parsed.port) {
        configuredPort = parseInt(parsed.port, 10);
      }
    } catch {
      // Invalid URL, will use dynamic port
    }
  }

  const cliPath = resolveCliPath();
  const cliAvailable = cliPath !== null;

  function setStatus(newStatus: ConnectionStatus, error?: string) {
    if (status !== newStatus || lastError !== error) {
      status = newStatus;
      lastError = error;
      listeners.forEach(cb => cb(status, error));
    }
  }

  function setDetectedPort(port: number) {
    if (detectedPort !== port) {
      detectedPort = port;
      console.log(`[OpenCode] Detected port: ${port}`);
      
      // Notify all waiters
      const waiters = portWaiters;
      portWaiters = [];
      for (const notify of waiters) {
        try {
          notify(port);
        } catch (e) {
          console.warn('[OpenCode] Port waiter error:', e);
        }
      }
    }
  }

  function detectPortFromOutput(text: string) {
    // Match URL pattern first (like desktop)
    URL_REGEX.lastIndex = 0;
    let match;
    while ((match = URL_REGEX.exec(text)) !== null) {
      const port = parseInt(match[1], 10);
      if (Number.isFinite(port) && port > 0) {
        setDetectedPort(port);
        return;
      }
    }

    // Fallback pattern
    const fallbackMatch = FALLBACK_PORT_REGEX.exec(text);
    if (fallbackMatch) {
      const port = parseInt(fallbackMatch[1], 10);
      if (Number.isFinite(port) && port > 0) {
        setDetectedPort(port);
      }
    }
  }

  async function waitForPort(timeoutMs: number): Promise<number> {
    if (detectedPort !== null) {
      return detectedPort;
    }

    return new Promise((resolve, reject) => {
      const onPortDetected = (port: number) => {
        clearTimeout(timeout);
        resolve(port);
      };

      const timeout = setTimeout(() => {
        portWaiters = portWaiters.filter(cb => cb !== onPortDetected);
        reject(new Error('Timed out waiting for OpenCode port detection'));
      }, timeoutMs);

      portWaiters.push(onPortDetected);
    });
  }

  async function waitForReady(apiUrl: string, timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    
    while (Date.now() < deadline) {
      // Use quick health check during startup for faster response
      if (await checkHealth(apiUrl, true)) {
        return true;
      }
      await new Promise(r => setTimeout(r, READY_CHECK_INTERVAL_MS));
    }
    
    return false;
  }

  function getApiUrl(): string | null {
    if (useConfiguredUrl && configuredApiUrl) {
      return configuredApiUrl.replace(/\/+$/, '');
    }
    if (detectedPort !== null) {
      return `http://localhost:${detectedPort}`;
    }
    return null;
  }

  function startHealthCheck() {
    stopHealthCheck();
    healthCheckInterval = setInterval(async () => {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        if (status === 'connected') {
          setStatus('disconnected');
        }
        return;
      }
      
      const healthy = await checkHealth(apiUrl);
      if (healthy && status !== 'connected') {
        setStatus('connected');
      } else if (!healthy && status === 'connected') {
        setStatus('disconnected');
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  function stopHealthCheck() {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  }

  async function start(workdir?: string): Promise<void> {
    if (typeof workdir === 'string' && workdir.trim().length > 0) {
      workingDirectory = workdir.trim();
    }

    // If user configured an external API URL, just check if it's healthy
    if (useConfiguredUrl && configuredApiUrl) {
      setStatus('connecting');
      const healthy = await checkHealth(configuredApiUrl);
      if (healthy) {
        setStatus('connected');
        startHealthCheck();
        return;
      }
      // If configured URL isn't responding and no CLI, show error
      if (!cliAvailable) {
        setStatus('error', `OpenCode API at ${configuredApiUrl} is not responding and CLI is not available.`);
        return;
      }
      // Fall through to start CLI with configured port if possible
    }

    // Check for existing running instance (only if port is known)
    const currentUrl = getApiUrl();
    if (currentUrl && await checkHealth(currentUrl)) {
      setStatus('connected');
      startHealthCheck();
      return;
    }

    if (!cliAvailable) {
      setStatus('error', 'OpenCode CLI not found. Install it or set OPENCODE_BINARY env var.');
      vscode.window.showErrorMessage(
        'OpenCode CLI not found. Please install it or set the OPENCODE_BINARY environment variable.',
        'More Info'
      ).then(selection => {
        if (selection === 'More Info') {
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/opencode-ai/opencode'));
        }
      });
      return;
    }

    setStatus('connecting');

    // Reset port detection for fresh start
    detectedPort = null;

    const spawnCwd = workingDirectory || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || os.homedir();
    
    // Use port 0 for dynamic assignment unless user configured a specific port
    const portArg = configuredPort !== null ? configuredPort.toString() : '0';

    try {
      const augmentedEnv = {
        ...process.env,
        PATH: buildAugmentedPath(),
      };

      childProcess = spawn(cliPath!, ['serve', '--port', portArg], {
        cwd: spawnCwd,
        env: augmentedEnv,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      childProcess.stdout?.on('data', (data) => {
        const text = data.toString();
        console.log('[OpenCode]', text.trim());
        detectPortFromOutput(text);
      });

      childProcess.stderr?.on('data', (data) => {
        const text = data.toString();
        console.error('[OpenCode]', text.trim());
        detectPortFromOutput(text);
      });

      childProcess.on('error', (err) => {
        setStatus('error', `Failed to start OpenCode: ${err.message}`);
        childProcess = null;
      });

      childProcess.on('exit', (code) => {
        if (status !== 'disconnected') {
          setStatus('disconnected', code !== 0 ? `OpenCode exited with code ${code}` : undefined);
        }
        childProcess = null;
        detectedPort = null;
      });

      // Wait for port detection (port comes from stdout/stderr)
      try {
        await waitForPort(PORT_DETECTION_TIMEOUT_MS);
      } catch {
        setStatus('error', 'OpenCode did not report port in time');
        await stop();
        return;
      }

      // Now wait for API to be ready
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        setStatus('error', 'Failed to determine OpenCode API URL');
        await stop();
        return;
      }

      const ready = await waitForReady(apiUrl, READY_CHECK_TIMEOUT_MS);
      if (ready) {
        setStatus('connected');
        startHealthCheck();
      } else {
        setStatus('error', 'OpenCode API did not become ready in time');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus('error', `Failed to start OpenCode: ${message}`);
    }
  }

  async function stop(): Promise<void> {
    stopHealthCheck();

    if (childProcess) {
      try {
        childProcess.kill('SIGTERM');
        // Wait for graceful shutdown
        await new Promise(r => setTimeout(r, SHUTDOWN_TIMEOUT_MS));
        if (childProcess && !childProcess.killed && childProcess.exitCode === null) {
          childProcess.kill('SIGKILL');
        }
      } catch {
        // ignore
      }
      childProcess = null;
    }

    detectedPort = null;
    setStatus('disconnected');
  }

  async function restart(): Promise<void> {
    await stop();
    // Brief delay to let OS release resources
    await new Promise(r => setTimeout(r, 250));
    await start();
  }

  async function setWorkingDirectory(newPath: string): Promise<{ success: boolean; restarted: boolean; path: string }> {
    const target = typeof newPath === 'string' && newPath.trim().length > 0 ? newPath.trim() : workingDirectory;
    workingDirectory = target;
    await restart();
    return { success: true, restarted: true, path: target };
  }

  return {
    start,
    stop,
    restart,
    setWorkingDirectory,
    getStatus: () => status,
    getApiUrl,
    getWorkingDirectory: () => workingDirectory,
    isCliAvailable: () => cliAvailable,
    onStatusChange(callback) {
      listeners.add(callback);
      // Immediately call with current status
      callback(status, lastError);
      return new vscode.Disposable(() => listeners.delete(callback));
    },
  };
}
