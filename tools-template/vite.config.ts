import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Plugins are loaded via dynamic import(file://) which uses the browser's native
// ESM loader. That loader cannot resolve bare specifiers — not even Node built-ins.
// However, Electron's nodeIntegration exposes `require` as a global in the renderer,
// so we keep built-ins as Rollup externals (preventing bundling attempts) and then
// post-process the emitted chunk to rewrite `import ... from 'mod'` → `require('mod')`.
const NODE_BUILTINS = ['child_process', 'util', 'fs', 'path', 'os', 'crypto', 'events', 'stream', 'buffer']

function electronNodeBuiltinsPlugin(): Plugin {
  return {
    name: 'electron-node-builtins',
    renderChunk(code: string) {
      let result = code
      for (const mod of NODE_BUILTINS) {
        // named imports: import { execSync, spawn } from 'child_process'
        result = result.replace(
          new RegExp(`import\\s+(\\{[^}]+\\})\\s+from\\s+['"]${mod}['"];?`, 'g'),
          (_, specifier) => `const ${specifier} = require('${mod}');`
        )
        // default import: import cp from 'child_process'
        result = result.replace(
          new RegExp(`import\\s+(\\w+)\\s+from\\s+['"]${mod}['"];?`, 'g'),
          (_, name) => `const ${name} = require('${mod}');`
        )
      }
      return { code: result, map: null }
    },
  }
}

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // vite dev — runs the dev harness as a full browser app
    return { plugins: [react()] }
  }

  // vite build — library mode: one entry per tool, outputs to dist/
  return {
    plugins: [react(), electronNodeBuiltinsPlugin()],
    build: {
      lib: {
        entry: { git: path.resolve(__dirname, 'src/git/index.tsx') },
        formats: ['es'],
      },
      rollupOptions: {
        // Keep Node built-ins external so Rollup doesn't try to bundle them.
        // electronNodeBuiltinsPlugin() rewrites the emitted import statements to
        // require() calls, which resolve correctly via Electron's nodeIntegration.
        // NOTE: react and react-dom are intentionally NOT external — bundled per plugin
        // because the native ESM loader cannot resolve bare 'react' specifiers.
        external: NODE_BUILTINS,
        output: { entryFileNames: '[name].js' },
      },
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
