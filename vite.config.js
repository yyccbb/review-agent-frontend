import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // GitHub Pages base path: https://<user>.github.io/<repo>/
  base: '/review-agent-frontend/',
  build: { outDir: 'docs' }
})
