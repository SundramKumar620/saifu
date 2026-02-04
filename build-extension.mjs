// Build script for extension-specific files
// These need to be built separately from the React app

import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = resolve(__dirname, 'dist');

// Ensure dist directory exists
if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
}

async function buildExtensionScripts() {
    console.log('🔨 Building extension scripts...');

    // Build background service worker
    await build({
        entryPoints: [resolve(__dirname, 'src/extension/background.js')],
        bundle: true,
        outfile: resolve(distDir, 'background.js'),
        format: 'esm',
        platform: 'browser',
        target: 'chrome100',
        minify: false,
        sourcemap: false,
        define: {
            'process.env.NODE_ENV': '"production"',
        },
    });
    console.log('✅ background.js built');

    // Build content script
    await build({
        entryPoints: [resolve(__dirname, 'src/extension/contentScript.js')],
        bundle: true,
        outfile: resolve(distDir, 'contentScript.js'),
        format: 'iife',
        platform: 'browser',
        target: 'chrome100',
        minify: false,
        sourcemap: false,
    });
    console.log('✅ contentScript.js built');

    // Build inpage script (injected into web pages)
    await build({
        entryPoints: [resolve(__dirname, 'src/extension/inpage.js')],
        bundle: true,
        outfile: resolve(distDir, 'inpage.js'),
        format: 'iife',
        platform: 'browser',
        target: 'chrome100',
        minify: false,
        sourcemap: false,
    });
    console.log('✅ inpage.js built');

    console.log('🎉 All extension scripts built successfully!');
}

buildExtensionScripts().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});
