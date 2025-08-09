import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { viteMockServe } from 'vite-plugin-mock'



export default defineConfig({
  plugins: [
    react(),
    viteMockServe({
      mockPath: "mock",
      localEnabled: true,
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分包策略
         manualChunks: (id) => {
           // React 相关库
           if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
             return 'react-vendor'
           }
           // UI 组件库
           if (id.includes('react-vant') || id.includes('@react-vant/icons')) {
             return 'ui-vendor'
           }
           // 状态管理和工具库
           if (id.includes('zustand') || id.includes('axios') || id.includes('js-cookie') || id.includes('jsonwebtoken')) {
             return 'utils-vendor'
           }
           // 其他第三方库
           if (id.includes('node_modules')) {
             return 'vendor'
           }
           // 页面组件
           if (id.includes('/pages/Home/')) {
             return 'pages-home'
           }
           if (id.includes('/pages/Chat/')) {
             return 'pages-chat'
           }
           if (id.includes('/pages/Account/')) {
             return 'pages-account'
           }
           if (id.includes('/pages/Publish/')) {
             return 'pages-publish'
           }
           if (id.includes('/pages/Detail/')) {
             return 'pages-detail'
           }
           // 公共组件
           if (id.includes('/components/')) {
             return 'components'
           }
           // 工具函数
           if (id.includes('/utils/') || id.includes('/hooks/') || id.includes('/lib/')) {
             return 'utils'
           }
           // 状态管理
           if (id.includes('/store/')) {
             return 'store'
           }
         },
        // 优化 chunk 文件名
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('pages/')) {
              return 'pages/[name]-[hash].js'
            }
            if (facadeModuleId.includes('components/')) {
              return 'components/[name]-[hash].js'
            }
          }
          return 'chunks/[name]-[hash].js'
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 优化构建性能
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 设置 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true
  },
  server: {
    proxy: {
      '/api/amap': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/amap/, ''),
        secure: true,
      },
      '/api/doubao': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/doubao/, ''),
        secure: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      },
    },
  },
})
