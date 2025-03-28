import { resolve } from 'path'
import { defineConfig } from 'vite'


export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        exercise: resolve(__dirname, 'main_exercise.html'),
        exercise35: resolve(__dirname, 'main_exercise_35.html'),
      },
    },
  },
})
