// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  
  server: {
    host: true, 
    // PROXY CONFIGURATION
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    }
  },

  resolve: {
    alias: {
      'three': resolve(__dirname, './node_modules/three')
    }
  },

  // PERFORMANCE & BUILD OPTIMIZATION
  build: {
    target: 'esnext', // Modern JS (smaller bundles, faster parsing on client)
    chunkSizeWarningLimit: 1000, // Suppress warnings for large 3D engine chunks
    
    rollupOptions: {
      output: {
        // Optimization #26: Hashed filenames for aggressive long-term caching
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',

        // Optimization #6: Granular Chunking
        manualChunks: {
          // 1. Core React Vendor (Stable, rarely changes)
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'zustand'],
          
          // 2. UI Vendor (Animations & Utilities)
          'ui-vendor': ['framer-motion', 'clsx', 'tailwind-merge'],
          
          // 3. 3D Engine Core (The heaviest part)
          'three-core': ['three', '@react-three/fiber', '@react-three/drei'],
          
          // 4. XR Specific (Isolated so non-AR users don't parse it)
          'three-xr': ['@react-three/xr'],
          
          // 5. Networking (Isolated for offline players)
          'networking': ['socket.io-client', 'uuid']
        }
      }
    }
  }
})