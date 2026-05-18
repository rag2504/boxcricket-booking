import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  server: {
    host: "::",
    port: 8080,
    // Optional same-origin API during dev: set VITE_API_URL=/api in .env.local
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    {
      name: 'jsxdev-fix',
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          `<head>
    <script>
      window.jsxDEV = function() { return null; };
    </script>`
        );
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
