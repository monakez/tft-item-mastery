// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Убираем плагин React!
  plugins: [],
  build: {
    target: 'es2022'
  }
});
