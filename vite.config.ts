import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const REPO = 'review-agent-frontend'

export default defineConfig({
    plugins: [react()],
    base: `/${REPO}/`,
    build: { outDir: 'dist' },
})
