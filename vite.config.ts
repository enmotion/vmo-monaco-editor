import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
// const prefix = `monaco-editor/esm/vs` // 声明 MonacoEditor 静态文件打包前缀地址
// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
  },
  plugins: [
    vue(),
    //@ts-ignore
    monacoEditorPlugin.default({
      languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript']
    }),
    dts({ copyDtsFiles: true })
  ],
  server: {
    host: '0.0.0.0',
    port: 1980
  },
  build: {
    // Vite 模块打包模式 配置
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'vmo-monaco-editor',
      fileName: 'vmo-monaco-editor'
    },
    sourcemap: false,
    rollupOptions: {
      external: ['vue', 'monaco-editor', 'ramda'],
      output: {
        globals: {
          vue: 'vue',
          'monaco-editor': 'monaco-editor',
          ramda: 'ramda'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src'), // 用于开发的 src 文件夹
      '@type': resolve(__dirname, 'types'), // ts 描述文件夹
      '@comps': resolve(__dirname, 'components'), // 组件模块文件夹
      '@lib': resolve(__dirname, 'use.lib') // 文件模块文件夹
    }
  }
})
