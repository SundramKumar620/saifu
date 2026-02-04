import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs'

// Plugin to copy extension files after build
const copyExtensionFiles = () => ({
  name: 'copy-extension-files',
  closeBundle() {
    const distDir = resolve(__dirname, 'dist')

    // Copy manifest.json to dist
    copyFileSync(
      resolve(__dirname, 'public/manifest.json'),
      resolve(distDir, 'manifest.json')
    )

    // Copy icons
    const iconsDir = resolve(distDir, 'icons')
    if (!existsSync(iconsDir)) {
      mkdirSync(iconsDir, { recursive: true })
    }
    ;['icon16.png', 'icon48.png', 'icon128.png'].forEach(icon => {
      const src = resolve(__dirname, `public/icons/${icon}`)
      if (existsSync(src)) {
        copyFileSync(src, resolve(iconsDir, icon))
      }
    })

    // Copy logo.svg
    const logoSrc = resolve(__dirname, 'public/logo.svg')
    if (existsSync(logoSrc)) {
      copyFileSync(logoSrc, resolve(distDir, 'logo.svg'))
    }

    console.log('✅ Extension files copied to dist/')
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        approval: resolve(__dirname, 'approval.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    outDir: 'dist',
    emptyDirBeforeWrite: true,
  },
  // For extension compatibility
  define: {
    'process.env': {},
    global: 'globalThis',
  }
})

