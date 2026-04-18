import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            const normalizedId = id.replace(/\\/g, '/');

            if (normalizedId.includes('/recharts/')) {
              return 'charts-vendor';
            }

            if (normalizedId.includes('/i18next/') || normalizedId.includes('/react-i18next/')) {
              return 'i18n-vendor';
            }

            if (normalizedId.includes('/@tanstack/react-query/')) {
              return 'query-vendor';
            }

            if (normalizedId.includes('/axios/')) {
              return 'http-vendor';
            }

            if (normalizedId.includes('/zustand/')) {
              return 'state-vendor';
            }

            if (normalizedId.includes('/sonner/')) {
              return 'toast-vendor';
            }

            if (normalizedId.includes('/lucide-react/')) {
              return 'icons-vendor';
            }

            if (normalizedId.includes('/@base-ui/react/')) {
              return 'base-ui-vendor';
            }

            if (normalizedId.includes('/@floating-ui/')) {
              return 'floating-vendor';
            }

            if (
              normalizedId.includes('/react-router/') ||
              normalizedId.includes('/react-router-dom/') ||
              normalizedId.includes('/react-dom/') ||
              normalizedId.includes('/scheduler/') ||
              normalizedId.includes('/react/')
            ) {
              return 'react-core-vendor';
            }

            return 'vendor';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
