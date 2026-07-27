import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
<<<<<<< Updated upstream
=======
import path from "path"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
>>>>>>> Stashed changes

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
<<<<<<< Updated upstream
=======
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@services": path.resolve(__dirname, "./services"),
      "@contexts": path.resolve(__dirname, "./contexts"),
    },
  },
>>>>>>> Stashed changes
})
