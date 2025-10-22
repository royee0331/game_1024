import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: path.resolve(__dirname, 'tests/engine.setup.ts')
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '../shared/src')
    }
  }
});
