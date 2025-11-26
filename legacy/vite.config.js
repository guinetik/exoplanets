import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const dev = process.env.NODE_ENV === 'development';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [react()],
});
