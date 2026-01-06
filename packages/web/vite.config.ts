import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { themeStoragePlugin } from '../../vite-theme-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  root: path.resolve(__dirname, '.'),
  plugins: [
    react(),
    themeStoragePlugin(),
  ],
  resolve: {
    alias: [
      { find: '@opencode-ai/sdk/v2', replacement: path.resolve(__dirname, '../../node_modules/@opencode-ai/sdk/dist/v2/client.js') },
      { find: '@openchamber/ui', replacement: path.resolve(__dirname, '../ui/src') },
      { find: '@web', replacement: path.resolve(__dirname, './src') },
      { find: '@', replacement: path.resolve(__dirname, '../ui/src') },
    ],
  },
  define: {
    'process.env': {},
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  optimizeDeps: {
    include: ['@opencode-ai/sdk/v2'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 10000, // Large limit due to shiki language grammars (~9MB) needed for syntax highlighting
    rollupOptions: {
      external: ['node:child_process', 'node:fs', 'node:path', 'node:url'],
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Normalize path to extract package name from .bun cache or regular node_modules
          let packagePath = '';
          if (id.includes('.bun/')) {
            packagePath = id.split('.bun/')[1] || '';
          } else if (id.includes('node_modules/')) {
            packagePath = id.split('node_modules/')[1] || '';
          }

          if (!packagePath) return 'vendor';

          // Extract package name (handle scoped packages)
          const segments = packagePath.split('/');
          let packageName = '';
          if (packagePath.startsWith('@')) {
            // Scoped package: @scope/name@version or @scope+name@version
            const scopedPart = segments[0];
            if (scopedPart.includes('+')) {
              // Bun format: @scope+name@version
              packageName = scopedPart.split('@')[0].replace('+', '/');
            } else {
              packageName = `${segments[0]}/${segments[1]}`;
            }
          } else {
            // Regular package: name@version or name
            packageName = segments[0].split('@')[0];
          }

          // React core
          if (packageName === 'react' || packageName === 'react-dom' || packageName === 'scheduler') {
            return 'vendor-react';
          }

          // Icons (lucide-react is huge)
          if (packageName === 'lucide-react' || packageName === '@remixicon/react') {
            return 'vendor-icons';
          }

          // Mermaid and D3 (diagram rendering - very large)
          if (
            packageName === 'mermaid' ||
            packageName.startsWith('d3-') ||
            packageName === 'd3' ||
            packageName === 'dagre-d3-es' ||
            packageName === 'dagre' ||
            packageName === '@mermaid-js/parser' ||
            packageName === 'chevrotain' ||
            packageName === 'langium' ||
            packageName === 'khroma' ||
            packagePath.includes('mermaid') ||
            packagePath.includes('dagre')
          ) {
            return 'vendor-mermaid';
          }

          // Shiki syntax highlighting
          if (
            packageName.startsWith('@shikijs') ||
            packageName === 'shiki' ||
            packagePath.includes('shiki')
          ) {
            return 'vendor-shiki';
          }

          // Syntax highlighting (react-syntax-highlighter, prism, etc.)
          if (
            packageName === 'react-syntax-highlighter' ||
            packageName === 'refractor' ||
            packageName === 'prismjs' ||
            packageName === 'highlight.js' ||
            packagePath.includes('react-syntax-highlighter') ||
            packagePath.includes('refractor') ||
            packagePath.includes('highlight.js')
          ) {
            return 'vendor-syntax';
          }

          // Framer Motion
          if (
            packageName === 'framer-motion' ||
            packageName === 'motion-dom' ||
            packageName === 'motion-utils' ||
            packagePath.includes('framer-motion') ||
            packagePath.includes('motion-dom')
          ) {
            return 'vendor-motion';
          }

          // Lodash
          if (packageName === 'lodash-es' || packageName === 'lodash' || packagePath.includes('lodash')) {
            return 'vendor-lodash';
          }

          // Diff library
          if (packageName === '@pierre/diffs' || packageName === 'diff' || packagePath.includes('@pierre+diffs')) {
            return 'vendor-diff';
          }

          // Markdown processing - let these fall through to default vendor chunk
          // to avoid circular dependency initialization issues
          if (
            packageName === 'react-markdown' ||
            packageName.includes('remark') ||
            packageName.includes('rehype') ||
            packageName.includes('unified') ||
            packageName.includes('mdast') ||
            packageName.includes('hast') ||
            packageName.includes('micromark') ||
            packageName === 'unist-util-visit' ||
            packageName.startsWith('unist-') ||
            packagePath.includes('remark') ||
            packagePath.includes('rehype') ||
            packagePath.includes('mdast') ||
            packagePath.includes('micromark')
          ) {
            return undefined; // Falls into default vendor chunk
          }

          // Terminal
          if (packageName.startsWith('@xterm') || packagePath.includes('xterm')) {
            return 'vendor-xterm';
          }

          // Radix UI
          if (packageName.startsWith('@radix-ui') || packagePath.includes('radix-ui')) {
            return 'vendor-radix';
          }

          // OpenCode SDK
          if (packageName === '@opencode-ai/sdk' || packagePath.includes('@opencode-ai+sdk')) {
            return 'vendor-opencode-sdk';
          }

          // State management
          if (packageName === 'zustand' || packagePath.includes('zustand')) {
            return 'vendor-zustand';
          }

          // Iconify utils
          if (packageName.startsWith('@iconify') || packagePath.includes('@iconify')) {
            return 'vendor-icons';
          }

          // Everything else goes to a shared vendor chunk
          return 'vendor';
        },
      },
    },
  },
});
