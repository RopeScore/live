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
        <span v-if="heatInfo.currentHeat" class="text-8xl font-bold">{{ heatInfo.currentHeat }}</span>
      </div>
      <div
        v-if="entryCount === 1"
        class="text-5xl"
        :class="{
          'text-gray-500': theme !== 'dark',
          'text-gray-400': theme === 'dark'
        }"
      >
        #{{ firstEntry?.entryId ?? '' }}
      </div>
    </div>

    <transition v-if="entryCount === 1" name="entry">
      <div
        :key="firstEntry?.entryId"
        class="grid w-full gap-6 items-center justify-around"
        :class="{
          'grid-cols-[2fr_3fr]': settings.showFlags,
          'grid-cols-[max-content]': !settings.showFlags,
        }"
      >
        <div v-if="settings.showFlags" class="justify-self-end w-full max-w-100">
          <img
            v-if="firstEntry?.bgUrl"
            class="border-2"
            :class="{
              'border-gray-800': theme !== 'dark',
              'border-gray-400': theme === 'dark'
            }"
            alt=""
            :src="firstEntry?.bgUrl"
          >
        </div>
        <div class="text-6xl">
          <p
            class="pb-4"
            :class="{
              'text-gray-500': theme !== 'dark',
              'text-gray-400': theme === 'dark'
            }"
          >
            Station {{ firstEntry?._servo?.Station }} &mdash; {{ firstEntry?._servo?.DivisionName }} {{ firstEntry?._servo?.AgeGroupName?.replace(/\s?\(.*$/, '') }} {{ firstEntry?._servo?.GenderName }}
          </p>
          <p class="pb-4">
            {{ firstEntry?._servo?.Event }}
          </p>
          <div
            v-if="(['team-name', 'athletes-and-team-name'] as Array<string | undefined>).includes(settings.mode) && !!firstEntry?.teamName"
            class="font-bold pb-4"
          >
            {{ firstEntry?.teamName }}
          </div>
          <div
            v-if="([undefined, 'athlete-names', 'athletes-and-team-name'] as Array<string | undefined>).includes(settings.mode)"
            :class="{
              'font-bold': settings.mode !== 'athletes-and-team-name',
              'text-8xl': !((firstEntry?._servo?.Part2?.trim()?.length ?? 0) > 0 || (firstEntry?._servo?.Part3?.trim()?.length ?? 0) > 0 || (firstEntry?._servo?.Part4?.trim()?.length ?? 0) > 0 || (firstEntry?._servo?.Part5?.trim()?.length ?? 0) > 0)
            }"
          >
            <p v-for="name of getServoHeatNameList(firstEntry?._servo!)" :key="name" class="pb-4">
              {{ name }}
            </p>
          </div>
          <p>{{ firstEntry?._servo?.TeamCountryName }}</p>
        </div>
      </div>
    </transition>

    <div
      v-else-if="entryCount > 1"
      :style="`--cols: ${grid.cols}; --rows: ${grid.rows};`"
      class="grid max-w-full overflow-hidden w-full grid-rows-[repeat(calc(var(--rows)+1),1fr)] items-center justify-around gap-y-4"
      :class="{
        'grid-cols-[repeat(var(--cols),10rem_1fr)]': settings.showFlags,
        'grid-cols-[repeat(var(--cols),0_1fr)]': !settings.showFlags,
      }"
    >
      <p class="col-span-[calc(var(--cols)*2)] text-center font-bold text-6xl">
        {{ firstEntry?._servo?.Event }}
      </p>

      <template v-for="heat of heatInfo.pools.value" :key="heat._servo?.Station">
        <div
          v-if="settings.showFlags"
          :style="`--station-col: ${stationToPos(heat._servo?.Station!).col}; --station-row: ${stationToPos(heat._servo?.Station!).row}`"
          class="flex h-full items-center justify-end col-start-[var(--station-col,1)] row-start-[calc(var(--station-row,1)+1)] place-self-stretch p-2"
          :class="{
            'bg-black text-white': theme === 'dark',
            'bg-white text-black': theme !== 'dark'
          }"
        >
          <img
            v-if="heat.bgUrl"
            class="border-2"
            :class="{
              'border-gray-800': theme !== 'dark',
              'border-gray-400': theme === 'dark'
            }"
            alt=""
            :src="heat.bgUrl"
          >
        </div>
        <div
          :style="`--station-col: ${stationToPos(heat._servo?.Station!).col}; --station-row: ${stationToPos(heat._servo?.Station!).row}`"
          class="col-start-[calc(var(--station-col,1)+1)] row-start-[calc(var(--station-row,1)+1)] place-self-stretch text-4xl p-6"
          :class="{
            'bg-black text-white': theme === 'dark',
            'bg-white text-black': theme !== 'dark'
          }"
        >
          <p
            :class="{
              'text-gray-500': theme !== 'dark',
              'text-gray-400': theme === 'dark'
            }"
          >
            Station {{ heat._servo?.Station }} &mdash; {{ heat._servo?.DivisionName }} {{ heat._servo?.AgeGroupName?.replace(/\s?\(.*$/, '') }} {{ heat._servo?.GenderName }}
          </p>
          <p
            v-if="(['team-name', 'athletes-and-team-name'] as Array<string | undefined>).includes(settings.mode) && !!firstEntry?.teamName"
            class="font-bold"
          >
            {{ heat.teamName }}
          </p>
          <p
            v-if="([undefined, 'athlete-names', 'athletes-and-team-name'] as Array<string | undefined>).includes(settings.mode)"
            :class="{ 'font-bold': settings.mode !== 'athletes-and-team-name' }"
          >
            {{ formatList(getServoHeatNameList(heat._servo!, { mode: 'first' })) }}
          </p>
          <p class="">
            {{ heat._servo?.TeamCountryName }}
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
import { getServoHeatNameList, useHeatInfo } from '../../hooks/heat-info'
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

const entryCount = computed(() => {
  const infos = Object.values(heatInfo.pools.value)
  return infos.length
})

const firstEntry = computed(() => {
  const infos = Object.values(heatInfo.pools.value)
  if (infos.length > 0) return infos[0]
  else return undefined
})

const grid = computed(() => {
  const maxStation = Math.max(...Object.keys(heatInfo.pools.value).map(pl => parseFloat(pl)))
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

.entry-enter-active,
.entry-leave-active {
  transition: opacity .5s ease, transform .5s ease;
}

.entry-leave-active {
  @apply absolute inset-auto;
}

.entry-enter-from {
  @apply opacity-0 scale-0;
}

.entry-leave-to {
  @apply opacity-0 scale-400;
}
</style>
