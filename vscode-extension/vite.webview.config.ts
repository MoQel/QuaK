import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// The VSCode webview runs in Chromium, so KaTeX only needs woff2 fonts.
function stripKatexLegacyFonts(): Plugin {
    return {
        name: 'strip-katex-legacy-fonts',
        enforce: 'pre',
        transform(code, id) {
            if (!id.includes('katex') || !id.endsWith('.css')) return null;
            const stripped = code.replaceAll(
                /,\s*url\([^)]*\.woff\)\s*format\("woff"\)\s*,\s*url\([^)]*\.ttf\)\s*format\("truetype"\)/g,
                '',
            );
            return stripped === code ? null : stripped;
        },
    };
}

// The provider writes the HTML itself, so Vite emits fixed asset names.
export default defineConfig({
    plugins: [stripKatexLegacyFonts(), react(), tailwindcss()],
    build: {
        outDir: 'dist/webview',
        emptyOutDir: true,
        // Emit a real stylesheet instead of injecting CSS at runtime.
        cssCodeSplit: false,
        // No data: URIs — the webview CSP allows fonts from its own source only, so an
        // inlined face is refused and its glyphs fall back.
        assetsInlineLimit: 0,
        rollupOptions: {
            input: 'src/webview/main.tsx',
            output: {
                format: 'es',
                entryFileNames: 'webview.js',
                chunkFileNames: 'webview-[name]-[hash].js',
                assetFileNames: 'webview.[ext]',
                manualChunks(id) {
                    if (id.includes('node_modules/react')) return 'react';
                    if (id.includes('node_modules/katex') || id.includes('node_modules/react-katex')) return 'katex';
                    if (id.includes('node_modules/lucide-react')) return 'icons';
                    if (id.includes('node_modules/@radix-ui')) return 'ui';
                    return undefined;
                },
            },
        },
    },
});
