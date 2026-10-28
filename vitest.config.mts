import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

const serverOnlyMock = new URL('./vitest.mock-server-only.ts', import.meta.url).pathname;

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      'server-only': serverOnlyMock,
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**', 'src/app/api/**', 'src/components/**'],
      exclude: ['**/*.test.*', '**/types.ts', '**/*.d.ts'],
    },
    projects: [
      {
        plugins: [tsconfigPaths()],
        resolve: {
          alias: {
            'server-only': serverOnlyMock,
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/lib/**/*.test.ts', 'src/app/**/*.test.ts'],
        },
      },
      {
        plugins: [tsconfigPaths(), react()],
        resolve: {
          alias: {
            'server-only': serverOnlyMock,
          },
        },
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/components/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
      {
        plugins: [tsconfigPaths()],
        resolve: {
          alias: {
            'server-only': serverOnlyMock,
          },
        },
        test: {
          name: 'db',
          environment: 'node',
          include: ['src/lib/db/__rls__/**/*.test.ts'],
        },
      },
    ],
  },
});
