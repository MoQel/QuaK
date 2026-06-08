import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vitest/config";
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), wasm(), topLevelAwait()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("monaco-editor")) return "monaco";
          if (id.includes("qulacs-wasm")) return "qulacs";
          if (id.includes("recharts")) return "charts";
          if (id.includes("dockview")) return "dockview";
          if (id.includes("@chakra-ui") || id.includes("@radix-ui")) return "ui";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
      // Allow Shared Buffer Array for multithreading
      headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Content-Security-Policy': "worker-src 'self' blob:; child-src 'self' blob:;"
      },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
    worker: {
      format: 'es',
       plugins: () => [
           wasm(),
           topLevelAwait()
       ]
    },
    preview: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Content-Security-Policy': "worker-src 'self' blob:; child-src 'self' blob:;"
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        server: {
            deps: {
                inline: ['qulacs-wasm']
            }
        }
    },
})
