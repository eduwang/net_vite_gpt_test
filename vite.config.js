import { resolve } from 'path'
import { defineConfig } from 'vite'


export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        exercise: resolve(__dirname, 'main_exercise.html'),
        exercise35: resolve(__dirname, 'main_exercise_35.html'),
        exerciseAssistants: resolve(__dirname, 'main_exerciseAssistants.html'),
        assistantsTest: resolve(__dirname, 'assistantsTest.html'),
        multiCharacterChat: resolve(__dirname, 'multiCharacterChat.html'),
        mainPrototype: resolve(__dirname, 'mainPrototype.html'),
      },
    },
  },
})
