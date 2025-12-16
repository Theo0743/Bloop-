import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // écoute sur toutes les interfaces réseau
    port: 5173, // tu peux changer le port si tu veux
  },
})
