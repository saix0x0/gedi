import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is /gedi/ for GitHub Pages project-site hosting
export default defineConfig({
  plugins: [react()],
  base: '/gedi/',
})
