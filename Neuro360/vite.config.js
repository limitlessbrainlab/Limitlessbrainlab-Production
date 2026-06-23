import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { compression } from 'vite-plugin-compression2'

// Unique per-build id — baked into the bundle AND emitted to dist/version.json so the
// running app can detect a new deployment at runtime and force logout + clean reload.
const BUILD_ID = String(Date.now())

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    // Emit /version.json carrying the same build id the bundle was built with.
    {
      name: 'emit-version-json',
      closeBundle() {
        try {
          fs.writeFileSync(path.resolve(__dirname, 'dist/version.json'), JSON.stringify({ buildId: BUILD_ID }))
        } catch (e) {
          console.warn('emit-version-json failed:', e.message)
        }
      },
    },
    // Gzip + Brotli pre-compressed assets — Render serves .br/.gz automatically
    compression({ algorithm: 'brotliCompress', exclude: /\.(png|jpg|jpeg|webp|gif|svg)$/ }),
    compression({ algorithm: 'gzip', exclude: /\.(png|jpg|jpeg|webp|gif|svg)$/ }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Strip console.log/warn/error from production bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — cached across all pages
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase — large SDK, changes rarely
          'vendor-supabase': ['@supabase/supabase-js'],
          // Stripe — only needed on payment pages
          'vendor-stripe': ['@stripe/stripe-js'],
          // UI libraries
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          // Data fetching
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
})
