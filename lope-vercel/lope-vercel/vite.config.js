import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// No proxy needed — on Vercel, /api/* is served by serverless functions on same domain
// For local dev: run `npx vercel dev` (handles both frontend + functions)
export default defineConfig({ plugins: [react()] })
