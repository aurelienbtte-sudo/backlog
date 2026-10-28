import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build "artefact" (npm run build:artifact) : React vient d'un CDN (React 18 UMD),
// le reste du code est empaqueté dans un seul script, assemblé ensuite par scripts/build-artifact.mjs
const artifact = {
  base: './',
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    jsxInject: "import React from 'react'",
  },
  build: {
    outDir: 'dist-artifact',
    cssCodeSplit: false,
    rollupOptions: {
      input: 'src/main.jsx',
      external: ['react', 'react-dom', 'react-dom/client'],
      output: {
        format: 'iife',
        globals: { react: 'React', 'react-dom': 'ReactDOM', 'react-dom/client': 'ReactDOM' },
        entryFileNames: 'app.js',
        assetFileNames: 'app[extname]',
      },
    },
  },
}

// base './' : le site fonctionne dans n'importe quel sous-dossier (GitHub Pages, Netlify...)
export default defineConfig(({ mode }) => (mode === 'artifact' ? artifact : { plugins: [react()], base: './' }))
