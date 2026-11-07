import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  test: {
    typecheck: {
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
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  plugins: [
    vue(),
    dts({
      bundleTypes: {
        // The `typescript` package is aliased to @typescript/typescript6, which
        // re-exports the TS 6 API but ships no lib.*.d.ts files. Let API Extractor
        // use its own bundled TypeScript instead of that folder.
        invokeOptions: { typescriptCompilerFolder: undefined },
      },
    }),
  ],
  esbuild: {
    target: 'es2022',
  },
})
