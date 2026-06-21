import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Hoặc plugin react bạn đang dùng

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Cấu hình proxy cho các request API
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      // Cấu hình proxy cho các request tải ảnh static công cộng
      '/uploads': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
});