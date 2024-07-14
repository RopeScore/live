<template>
  <div
    class="grid grid-cols-1 min-h-[100vh] w-full"
    :class="{
      'grid-rows-[3.5rem_auto_4rem_2rem] xl:grid-rows-[3.5rem_auto_2rem_2rem]': !fullscreen,
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

      <nav class="flex-row-reverse hidden lg:flex">
        <button-link v-for="menuItem of menuItems" :key="menuItem.title" :to="menuItem.path">
          {{ menuItem.title }}
        </button-link>
      </nav>
      <dialog-button ref="menuDialog" label="Menu">
        <div class="flex flex-col gap-6">
          <button-link
            v-for="menuItem of menuItems"
            :key="menuItem.title"
            :to="menuItem.path"
          >
            {{ menuItem.title }}
          </button-link>
        </div>
      </dialog-button>
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
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@vueuse/head'
import { useTheme } from './hooks/theme'

import { ButtonLink, DialogButton } from '@ropescore/components'
import SystemSettingsFooter from './components/SystemSettingsFooter.vue'

useHead({
  titleTemplate: title => !title ? 'RopeScore Live' : `${title} | RopeScore Live`
})

const route = useRoute()
const router = useRouter()

const menuItems = computed(() => router.getRoutes().filter(route => route.meta?.menu != null).map(route => ({ title: route.meta.menu, path: route.path, order: (route.meta.menuOrder ?? Infinity) as number })).sort((a, b) => a.order - b.order))
const menuDialog = ref<typeof DialogButton>()

const fullscreen = computed(() => {
  return !!route.meta.fullscreen
})

const theme = useTheme()

const version = (import.meta.env.VITE_COMMIT_REF ?? 'dev').toString().substring(0, 7)

router.afterEach(() => {
  menuDialog.value?.close()
})
</script>
