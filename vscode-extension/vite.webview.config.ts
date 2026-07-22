import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// KaTeX ships every glyph font in woff2, woff and ttf. The webview runs in
// Chromium, which always picks woff2 — the woff and ttf variants (~876 KB) are
// only dead weight in the vsix. Strip their @font-face sources before Vite
// resolves the url()s, so only the woff2 assets get emitted.
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

// The provider writes the HTML itself (it needs the CSP nonce and webview URIs),
// so this only has to emit predictable asset names it can point at.
export default defineConfig({
    plugins: [stripKatexLegacyFonts(), react(), tailwindcss()],
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
