import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  test: {
    typecheck: {
      checker: 'vue-tsc',
      ignoreSourceErrors: true,
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, 'src'),
      },
    ],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: '@kitbag/query',
      fileName: 'kitbag-query',
    },
  },
  plugins: [
    vue(),
    dts({ 
      rollupTypes: true 
    })
  ],
  esbuild: {
    target: 'es2022'
  },
  rollupOptions: {
    external: ['vue'],
    output: {
      globals: {
        vue: 'Vue',
      },
    },
  },
})