import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 相对基路径：dist/ 可直接放到任意静态托管的子目录（例如 GitHub Pages 的 /仓库名/）
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
})
