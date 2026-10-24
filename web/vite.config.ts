import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Giao diện gọi API cùng nguồn qua /api; khi phát triển, Vite chuyển tiếp tới server Node (npm run start:api).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8787' },
  },
});
