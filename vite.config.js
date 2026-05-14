import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Repository-Name auf GitHub Pages. Falls du das Repo umbenennst,
// hier anpassen — der Pfad muss zur URL passen
// (z.B. https://<user>.github.io/prayer-times/).
const REPO_NAME = 'prayer-times'

// https://vite.dev/config/
export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [react()],
})
