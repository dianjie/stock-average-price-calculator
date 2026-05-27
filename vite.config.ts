import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), ...(process.env.ANALYZE === 'true' ? [visualizer()] : [])],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            // 代码分割规则
            {
              name: 'vendor-zrender',
              test: (id) => id.includes('node_modules/zrender'),
              priority: 10,
            },
            {
              name: 'vendor-echarts',
              test: (id) => id.includes('node_modules/echarts'),
              priority: 9,
            },
            { name: 'vendor-html2canvas', test: (id) => id.includes('/node_modules/html2canvas') },
            {
              name: 'vendor-firebase',
              test: (id) => id.includes('node_modules/firebase'),
            },
          ],
        },
      },
    },
  },
})
