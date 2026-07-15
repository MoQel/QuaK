import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The provider writes the HTML itself (it needs the CSP nonce and webview URIs),
// so this only has to emit predictable asset names it can point at.
export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        outDir: 'dist/webview',
        emptyOutDir: true,
        // Emit a real stylesheet instead of letting Vite inline the CSS and inject
        // a <style> tag at runtime: no flash of unstyled content, smaller bundle.
        cssCodeSplit: false,
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
