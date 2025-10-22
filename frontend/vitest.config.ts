import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ],
    exclude: ['tests/interaction/**'],
    passWithNoTests: true
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../packages/core/src'),
      '@shared': path.resolve(__dirname, '../packages/shared/src'),
      '@ui-telemetry': path.resolve(__dirname, '../packages/ui-telemetry/src')
    }
  }
});
