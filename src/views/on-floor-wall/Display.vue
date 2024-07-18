<template>
  <main
    class="flex items-center justify-center gap-6 px-8 py-6 max-w-[100vw]"
    :class="{
      'dark bg-black text-white': theme === 'dark',
      'bg-white text-black': theme !== 'dark'
    }"
  >
    <div class="absolute top-4 right-4 flex flex-col items-end">
      <div class="font-bold text-8xl">
        {{ clock }}
      </div>
      <div>
        <span class="text-5xl">heat&nbsp;</span>
        <span v-if="heatInfos" class="text-8xl font-bold">{{ heatInfos[0].HeatNumber }}</span>
      </div>
      <div
        v-if="heatInfos?.length === 1"
        class="text-5xl"
        :class="{
          'text-gray-500': theme !== 'dark',
          'text-gray-400': theme === 'dark'
        }"
      >
        #{{ heatInfos[0].EntryNumber ?? '3030' }}
      </div>
    </div>

    <div v-if="heatInfos?.length === 1" class="grid w-full grid-cols-[2fr_3fr] gap-6 items-center justify-around">
      <img
        class="w-full max-w-100 border-2 justify-self-end"
        :class="{
          'border-gray-800': theme !== 'dark',
          'border-gray-400': theme === 'dark'
        }"
        alt=""
        :src="flagUrl(heatInfos[0])"
      >
      <div class="text-6xl">
        <p
          class="pb-4"
          :class="{
            'text-gray-500': theme !== 'dark',
            'text-gray-400': theme === 'dark'
          }"
        >
          Station {{ heatInfos[0].Station }} &mdash; {{ heatInfos[0].DivisionName }} {{ heatInfos[0].AgeGroupName?.replace(/\s?\(.*$/, '') }} {{ heatInfos[0].GenderName }}
        </p>
        <p class="pb-4">
          {{ heatInfos[0].Event }}
        </p>
        <div
          v-if="heatInfos[0].Event !== 'Team Show Freestyle'"
          class="font-bold"
          :class="{
            'text-8xl': !((heatInfos[0].Part2?.trim()?.length ?? 0) > 0 || (heatInfos[0].Part3?.trim()?.length ?? 0) > 0 || (heatInfos[0].Part4?.trim()?.length ?? 0) > 0 || (heatInfos[0].Part5?.trim()?.length ?? 0) > 0)
          }"
        >
          <p v-for="name of getHeatNameList(heatInfos[0])" :key="name" class="pb-4">
            {{ name }}
          </p>
        </div>
        <p>{{ heatInfos[0].TeamCountryName }}</p>
      </div>
    </div>

    <div
      v-else-if="heatInfos != null && heatInfos.length > 1"
      :style="`--cols: ${grid.cols}; --rows: ${grid.rows};`"
      class="grid max-w-full overflow-hidden w-full grid-cols-[repeat(var(--cols),10rem_1fr)] grid-rows-[repeat(calc(var(--rows)+1),1fr)] items-center justify-around gap-y-4"
    >
      <p class="col-span-[calc(var(--cols)*2)] text-center font-bold text-6xl">
        {{ heatInfos[0].Event }}
      </p>

      <template v-for="heat of heatInfos" :key="heat.Station">
        <div
          :style="`--station-col: ${stationToPos(heat.Station).col}; --station-row: ${stationToPos(heat.Station).row}`"
          class="flex h-full items-center justify-end col-start-[var(--station-col,1)] row-start-[calc(var(--station-row,1)+1)] bg-white p-2"
        >
          <img
            class="border-2"
            :class="{
              'border-gray-800': theme !== 'dark',
              'border-gray-400': theme === 'dark'
            }"
            alt=""
            :src="flagUrl(heat)"
          >
        </div>
        <div
          :style="`--station-col: ${stationToPos(heat.Station).col}; --station-row: ${stationToPos(heat.Station).row}`"
          class="col-start-[calc(var(--station-col,1)+1)] row-start-[calc(var(--station-row,1)+1)] text-4xl bg-white p-6"
        >
          <p
            :class="{
              'text-gray-500': theme !== 'dark',
              'text-gray-400': theme === 'dark'
            }"
          >
            Station {{ heat.Station }} &mdash; {{ heat.DivisionName }} {{ heat.AgeGroupName?.replace(/\s?\(.*$/, '') }} {{ heat.GenderName }}
          </p>
          <p class="font-bold">
            {{ formatList(getHeatNameList(heat, { mode: 'first' })) }}
          </p>
          <p class="">
            {{ heat.TeamCountryName }}
          </p>
        </div>
      </template>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useHead } from '@vueuse/head'
import { formatList, getOpfsImgUrl } from '../../helpers'
import { useTheme } from '../../hooks/theme'
import { useOnFloorWallSettings } from './use-on-floor-wall'
import { getHeatNameList, useHeatInfo, type ServoHeatInfo } from '../../hooks/heat-info'
import { useDateFormat, useTimestamp } from '@vueuse/core'

useHead({
  title: '📺 On Floor Wall (Live)'
})

const theme = useTheme()
const settings = useOnFloorWallSettings()

const bgUrlVar = ref('')
watch(() => settings.value.background, async newBg => {
  bgUrlVar.value = newBg ? `url(${await getOpfsImgUrl(newBg)})` : ''
}, { immediate: true })

const hic = ref(settings.value.heatInfo)
watch(() => settings.value.heatInfo, newHeatInfo => { hic.value = newHeatInfo })

const heatInfo = useHeatInfo(hic)

function flagUrl (hi: ServoHeatInfo) {
  return hi.TeamCountryFlagUrl || (hi.TeamCountryCode ? `/flags/${hi.TeamCountryCode.toLocaleLowerCase()}.svg` : undefined)
}

const heatInfos = heatInfo.data

const grid = computed(() => {
  const maxStation = Math.max(...((heatInfos.value ?? [] as ServoHeatInfo[]).map(hi => hi.Station)))
  console.log(maxStation)
  let cols = 1
  let rows = 1

  if (maxStation === 2) {
    cols = 2
  } else if (maxStation === 3) {
    rows = 3
  } else if (maxStation === 4) {
    cols = 2
    rows = 2
  } else if (maxStation <= 8) {
    cols = 2
    rows = Math.ceil(maxStation / 2)
  } else {
    cols = 3
    rows = Math.ceil(maxStation / 3)
  }

  return { cols, rows }
})

function stationToPos (station: number) {
  for (let col = 1; col <= grid.value.cols; col++) {
    for (let row = 1; row <= grid.value.rows; row++) {
      if (((col - 1) * grid.value.rows) + row === station) {
        return { col: ((col - 1) * 2) + 1, row }
      }
    }
  }
  return { col: 1, row: 1 }
}

const clock = useDateFormat(useTimestamp({ interval: 300 }), 'HH:mm')
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
