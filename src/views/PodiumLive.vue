<template>
  <main class="bg-white dark:bg-black grid grid-cols-3 gap-6 px-8 py-6">
    <div
      v-for="pos in positions"
      :key="pos"
      :class="{
        'mt-32': pos === '2nd',
        'mt-64': pos === '3rd'
      }"
    >
      <h2
        class="text-black dark:text-white text-8xl font-bold text-center mb-4"
      >
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
          class="w-full border-2 border-gray-800 dark:border-gray-400"
          :alt="flag"
          :src="`/flags/${flag}.svg`"
        >
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useHead } from '@vueuse/head'

useHead({
  title: 'Podium (Live) | RopeScore Live'
})

const bc = new BroadcastChannel('rs-podium')

const positions = ['2nd', '1st', '3rd'] as const

const state = ref<Record<'1st' | '2nd' | '3rd', string[]>>()
const raised = ref(false)

bc.addEventListener('message', evt => {
  if (evt.data === 'raise') {
    const ls = localStorage.getItem('rs-podium')
    state.value = ls ? JSON.parse(ls) : null
    raised.value = true
  } else if (evt.data === 'lower') {
    raised.value = false
  }
})
</script>

<style scoped>
.custom-cols {
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
}

.custom-duration {
  transition-duration: 10s;
}
</style>
