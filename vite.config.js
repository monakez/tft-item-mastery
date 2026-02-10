import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    checker({
      eslint: {
        // For ESLint 9+, you don't need the file extensions or glob here
        // if your eslint.config.js is set up correctly.
        lintCommand: 'eslint .',
        useFlatConfig: true, // Force flat config mode
      },
    }),
  ],
  build: {
    target: 'es2022',
  },
});
