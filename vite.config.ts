import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// IMPORTANT: base must be the repo name for GitHub Pages
const REPO = 'review-agent-frontend'


export default defineConfig({
    plugins: [react()],
    base: `/${REPO}/`,
    build: { outDir: 'dist' }
})
