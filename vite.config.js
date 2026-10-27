import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : le site fonctionne dans n'importe quel sous-dossier (GitHub Pages, Netlify...)
export default defineConfig({
  plugins: [react()],
  base: './',
})
