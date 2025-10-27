import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../packages/core/src'),
      '@shared': path.resolve(__dirname, '../packages/shared/src'),
      '@ui-telemetry': path.resolve(__dirname, '../packages/ui-telemetry/src')
    }
  },
  server: {
    port: 5173
  }
});
