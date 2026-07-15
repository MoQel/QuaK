import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The provider writes the HTML itself (it needs the CSP nonce and webview URIs),
// so this only has to emit predictable asset names it can point at.
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist/webview',
        emptyOutDir: true,
        rollupOptions: {
            input: 'src/webview/main.tsx',
            output: {
                format: 'iife',
                entryFileNames: 'webview.js',
                assetFileNames: 'webview.[ext]',
            },
        },
    },
});
