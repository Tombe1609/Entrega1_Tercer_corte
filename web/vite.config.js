import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // La web llama directamente a la API: CORS controla el acceso desde cada origen permitido.
  server: { host: '127.0.0.1', port: 5173 },
  build: {
    // Express servirá esta carpeta en producción para que web y API compartan origen.
    outDir: '../public',
    emptyOutDir: true,
  },
});
