import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 单文件分发构建：产出 dist-single/，随后由 scripts/inline-single.mjs 内联成一个 .html。
 * 用 iife 而非 esm，是为了让产物在 file:// 下双击也能直接运行
 * （浏览器会以 CORS 规则拉取 module script，file:// 下必被拦截）。
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist-single',
    emptyOutDir: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
