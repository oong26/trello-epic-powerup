import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        connector: 'index.html',
        related: 'related.html',
        picker: 'picker.html',
      },
    },
  },
})