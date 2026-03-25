import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub proje adınız 'math-quest' ise base bu şekilde olmalıdır.
export default defineConfig({
  plugins: [react()],
  base: '/math-quest/', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})