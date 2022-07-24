<template>
  <div
    class="grid grid-cols-1 min-h-[100vh] w-full"
    :class="{
      'grid-rows-[3.5rem,auto,2rem]': !fullscreen,
      'grid-rows-1': fullscreen,
      dark: darkMode === 'dark'
    }"
  >
    <header v-if="!fullscreen" class="col-span-2 bg-gray-100 flex justify-between items-center px-4 sticky top-0 z-1000">
      <router-link to="/">
        <span class="text-2xl font-semibold">RopeScore Live</span>
      </router-link>

      <nav>
        <text-button @click="darkMode = darkMode === 'light' ? 'dark' : 'light'">
          Theme ({{ darkMode === 'light' ? 'L' : 'D' }})
        </text-button>
        <button-link to="/podium">
          Podium
        </button-link>
        <button-link to="/device-stream">
          Device Stream
        </button-link>
        <button-link to="/groups">
          Groups
        </button-link>
        <button-link to="/">
          Dashboard
        </button-link>
      </nav>
    </header>
    <main v-if="!fullscreen" class="px-2 py-4">
      <router-view />
    </main>
    <router-view v-else />
    <footer v-if="!fullscreen" class="flex col-span-2 justify-between items-center bg-gray-100 dark:bg-gray-700 dark:text-white px-4">
      <span>&copy; Swantzter 2018-2022</span>
      <span>{{ version }}</span>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'

import { ButtonLink, TextButton } from '@ropescore/components'

const route = useRoute()

const fullscreen = computed(() => {
  return !!route.meta.fullscreen
})

const darkMode = useLocalStorage<'light' | 'dark'>('rs-theme', 'light')

const version = (import.meta.env.VITE_COMMIT_REF ?? 'dev').toString().substring(0, 7)
</script>
