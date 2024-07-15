<template>
  <main
    class="flex items-center justify-center gap-6 px-8 py-6 max-w-[100vw]"
    :class="{
      'dark bg-black text-white': theme === 'dark',
      'bg-white text-black': theme !== 'dark'
    }"
  >
    <div
      :style="`--cols: ${grid.cols}; --rows: ${grid.rows};`"
      class="grid max-w-full overflow-hidden w-full grid-cols-[repeat(var(--cols),10rem_1fr)] grid-rows-[repeat(calc(var(--rows)+1),1fr)] items-center justify-around gap-y-4"
    >
      <div class="col-span-[calc(var(--cols)*2)] text-center font-bold text-6xl">
        <h1 class="text-center font-bold text-6xl">
          {{ titles.title }}
        </h1>
        <h2 class="text-center font-bold text-4xl">
          {{ titles.subTitle }}
        </h2>
      </div>

      <template v-for="qualifier, idx of qualifiers" :key="qualifier.id">
        <div
          :style="`--station-col: ${idxToPos(idx).col}; --station-row: ${idxToPos(idx).row}`"
          class="flex h-full items-center justify-end col-start-[var(--station-col,1)] row-start-[calc(var(--station-row,1)+1)] bg-white p-2"
        >
          <img
            v-if="qualifier.countryCode != null"
            class="border-2"
            :class="{
              'border-gray-800': theme !== 'dark',
              'border-gray-400': theme === 'dark'
            }"
            alt=""
            :src="`/flags/${qualifier.countryCode}.svg`"
          >
        </div>
        <div
          :style="`--station-col: ${idxToPos(idx).col}; --station-row: ${idxToPos(idx).row}`"
          class="col-start-[calc(var(--station-col,1)+1)] row-start-[calc(var(--station-row,1)+1)] text-4xl bg-white p-6"
        >
          <p class="font-bold">
            {{ formatList(qualifier.names) }}
          </p>
          <p v-if="qualifier.countryCode != null">
            {{ countryNames[qualifier.countryCode] }}
          </p>
        </div>
      </template>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { useHead } from '@vueuse/head'
import countries from '../../assets/countries.json'
import { useTheme } from '../../hooks/theme'
import { useQualifiers, type Qualifier, type QualifiersSettings } from './use-qualifiers'
import { computed, ref, watch } from 'vue'
import { formatList, getOpfsImgUrl } from '../../helpers'


useHead({
  title: '📺 Qualifiers (Live)'
})

const bc = new BroadcastChannel('rs-qualifiers')

const theme = useTheme()
const { settings } = useQualifiers()
const qualifiers = ref<Qualifier[]>([])
const titles = ref<Pick<QualifiersSettings, 'title' | 'subTitle'>>({})

const countryNames = Object.fromEntries(countries.map(c => [c.code, c.name]))

const bgUrlVar = ref('')
watch(() => settings.value.background, async newBg => {
  bgUrlVar.value = newBg ? `url(${await getOpfsImgUrl(newBg)})` : ''
}, { immediate: true })

bc.addEventListener('message', evt => {
  if (evt.data === 'show') {
    const qs = localStorage.getItem('rs-qualifiers')
    const st = localStorage.getItem('rs-qualifiers-settings')
    qualifiers.value = qs ? JSON.parse(qs) : null
    titles.value = st ? JSON.parse(st) : null
  } else if (evt.data === 'hide') {
    qualifiers.value = []
    titles.value = {}
  }
})

const grid = computed(() => {
  let cols = 1
  let rows = 1

  if (qualifiers.value.length === 2) {
    cols = 2
  } else if (qualifiers.value.length === 3) {
    rows = 3
  } else if (qualifiers.value.length === 4) {
    cols = 2
    rows = 2
  } else if (qualifiers.value.length <= 8) {
    cols = 2
    rows = Math.ceil(qualifiers.value.length / 2)
  } else {
    cols = 3
    rows = Math.ceil(qualifiers.value.length / 3)
  }

  return { cols, rows }
})

function idxToPos (idx: number) {
  for (let col = 0; col < grid.value.cols; col++) {
    for (let row = 0; row < grid.value.rows; row++) {
      if ((col * grid.value.rows) + row === idx) {
        return { col: (col * 2) + 1, row: row + 1 }
      }
    }
  }
  return { col: 1, row: 1 }
}
</script>

<style scoped>
main {
  --bgUrl: v-bind(bgUrlVar);
  background: var(--bgUrl, white);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

main.dark {
  background: var(--bgUrl, black);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
