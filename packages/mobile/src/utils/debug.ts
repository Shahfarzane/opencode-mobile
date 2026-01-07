/**
 * Debug utilities for development
 *
 * Usage:
 * import { debug } from '../utils/debug';
 * debug.log('message');
 * debug.warn('warning');
 * debug.display('Key', value);
 * debug.benchmark('operation', async () => { ... });
 */

import type Reactotron from "reactotron-react-native";

// Get Reactotron instance if available
const getReactotron = (): typeof Reactotron | null => {
  if (__DEV__ && console.tron) {
    return console.tron;
  }
  return null;
};

export const debug = {
  /**
   * Log a message to Reactotron and console
   */
  log: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.log(message, ...args);
      getReactotron()?.log?.(message, ...args);
    }
  },

  /**
   * Log a warning
   */
  warn: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.warn(message, ...args);
      getReactotron()?.warn?.(message);
    }
  },

  /**
   * Log an error
   */
  error: (message: string, ...args: unknown[]) => {
    if (__DEV__) {
      console.error(message, ...args);
      getReactotron()?.error?.(message, null);
    }
  },

  /**
   * Display a key-value pair in Reactotron
   */
  display: (name: string, value: unknown, preview?: string) => {
    if (__DEV__) {
      console.log(`[${name}]`, value);
      getReactotron()?.display?.({
        name,
        value,
        preview: preview || (typeof value === "object" ? JSON.stringify(value).slice(0, 50) : String(value)),
      });
    }
  },

  /**
   * Benchmark an async operation
   */
  benchmark: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    if (__DEV__) {
      const start = performance.now();
      const result = await fn();
      const duration = performance.now() - start;
      debug.display(`Benchmark: ${name}`, { duration: `${duration.toFixed(2)}ms` });
      return result;
    }
    return fn();
  },

  /**
   * Log current state (useful for Zustand stores)
   */
  state: (storeName: string, state: unknown) => {
    if (__DEV__) {
      getReactotron()?.display?.({
        name: `State: ${storeName}`,
        value: state,
        preview: "Store state snapshot",
      });
    }
  },

  /**
   * Log a network request manually
   */
  network: (url: string, method: string, status: number, duration: number) => {
    if (__DEV__) {
      getReactotron()?.display?.({
        name: `${method} ${url}`,
        value: { status, duration: `${duration}ms` },
        preview: `${status} in ${duration}ms`,
      });
    }
  },

  /**
   * Create a visual divider in logs
   */
  divider: (label?: string) => {
    if (__DEV__) {
      const line = "─".repeat(40);
      const message = label ? `${line} ${label} ${line}` : line + line;
      console.log(message);
      getReactotron()?.log?.(message);
    }
  },
};

export default debug;
