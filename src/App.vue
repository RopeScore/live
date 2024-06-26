<template>
  <div
    class="grid grid-cols-1 min-h-[100vh] w-full"
    :class="{
      'grid-rows-[3.5rem_auto_2rem_2rem]': !fullscreen,
      'grid-rows-1': fullscreen,
      'h-[100vh]': fullscreen,
      'overflow-y-hidden': fullscreen,

      'font-svgf': fullscreen && theme === 'swedish-gymnastics'
    }"
  >
    <header v-if="!fullscreen" class="bg-gray-100 flex justify-between items-center px-4 sticky top-0 z-1000">
      <router-link to="/">
        <span class="text-2xl font-semibold">RopeScore Live</span>
      </router-link>

      <nav>
        <text-button @click="_theme = _theme === 'light' ? 'dark' : 'light'">
          Theme ({{ _theme === 'light' ? 'L' : (_theme === 'dark' ? 'D' : '?') }})
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

    <system-settings-footer v-if="!fullscreen" />
    <footer
      v-if="!fullscreen"
      class="flex justify-between items-center px-4"
      :class="{
        'bg-gray-100 text-black': theme === 'light',
        'bg-gray-700 text-white': theme === 'dark',
        'bg-svgf-blue text-white': theme === 'swedish-gymnastics',
      }"
    >
      <span>&copy; Swantzter 2018-2024</span>
      <span>{{ version }}</span>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { useRawTheme, useTheme } from './hooks/theme'

import { ButtonLink, TextButton } from '@ropescore/components'
import SystemSettingsFooter from './components/SystemSettingsFooter.vue'

useHead({
  titleTemplate: title => !title ? 'RopeScore Live' : `${title} | RopeScore Live`
})

const route = useRoute()

const fullscreen = computed(() => {
  return !!route.meta.fullscreen
})

const _theme = useRawTheme()
const theme = useTheme()

const version = (import.meta.env.VITE_COMMIT_REF ?? 'dev').toString().substring(0, 7)
</script>
