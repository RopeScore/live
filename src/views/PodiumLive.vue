<template>
  <main
    class="flex flex-col"
    :class="{
      'dark bg-black text-white': theme === 'dark',
      'text-black': theme !== 'dark'
    }"
  >
    <div v-if="settings.withTitle" class="col-span-3 text-4xl text-center font-semibold px-8 pt-6">
      {{ title || '&nbsp;' }}
    </div>
    <div class="grid grid-cols-3 gap-6 px-8 py-6">
      <div
        v-for="pos in positions"
        :key="pos"
        :class="{
          'mt-32': pos === '2nd',
          'mt-64': pos === '3rd'
        }"
      >
        <h2 class="text-8xl font-bold text-center mb-4">
          {{ pos }}
        </h2>

        <div
          class="grid gap-4 items-start justify-center custom-cols transition-all ease-in-out custom-duration"
          :class="{
            'mt-[100vh]': !raised
          }"
          :style="`--cols:${state?.[pos].length ?? 1}`"
        >
          <img
            v-for="(flag, idx) of state?.[pos] ?? []"
            :key="idx + flag"
            class="w-full border-2"
            :class="{
              'border-gray-800': theme !== 'dark',
              'border-gray-400': theme === 'dark'
            }"
            :alt="flag"
            :src="`/flags/${flag}.svg`"
          >
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useHead } from '@vueuse/head'
import { usePodium, type PodiumSettings } from '../hooks/podium'
import { getOpfsImgUrl } from '../helpers'
import { useTheme } from '../hooks/theme'

useHead({
  title: '📺 Podium (Live)'
})

const bc = new BroadcastChannel('rs-podium')

const positions = ['2nd', '1st', '3rd'] as const

const theme = useTheme()

const state = ref<Record<'1st' | '2nd' | '3rd', string[]>>()
const title = ref<string>()
const raised = ref(false)
const { settings } = usePodium()

bc.addEventListener('message', evt => {
  if (evt.data === 'raise') {
    const ls = localStorage.getItem('rs-podium')
    state.value = ls ? JSON.parse(ls) : null
    raised.value = true
  } else if (evt.data === 'lower') {
    raised.value = false
  }

  if (evt.data === 'raise' || evt.data === 'update-title') {
    const st = localStorage.getItem('rs-podium-settings')
    const parsed: PodiumSettings | null = st ? JSON.parse(st) : null
    title.value = parsed?.title
  }
})

const bgUrlVar = ref('')
watch(() => settings.value.background, async newBg => {
  bgUrlVar.value = newBg ? `url(${await getOpfsImgUrl(newBg)})` : ''
}, { immediate: true })
</script>

<style scoped>
.custom-cols {
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
}

.custom-duration {
  transition-duration: 10s;
}

main {
  --bgUrl: v-bind(bgUrlVar);
  background: linear-gradient(0deg, rgba(255,255,255,.3) 0%, rgba(255,255,255,.8) 50%, rgba(255,255,255,1) 100%), var(--bgUrl, white);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

main.dark {
  background: linear-gradient(0deg, rgba(0,0,0,.3) 0%, rgba(0,0,0,.8) 50%, rgba(0,0,0,1) 100%), var(--bgUrl, black);
}
</style>
