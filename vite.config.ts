import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Deployment base is passed on the CLI (`vite build --base=/bondgame/`), so dev runs at `/`.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
