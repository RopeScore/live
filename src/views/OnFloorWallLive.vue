<template>
  <main
    class="flex items-center justify-center gap-6 px-8 py-6"
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
    </div>
    <template v-if="heatInfos?.length === 1">
      <div class="grid w-full grid-cols-[2fr_3fr] gap-6 items-center justify-around">
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
            #{{ heatInfos[0].EntryNumber }}: {{ heatInfos[0].Event }}
          </p>
          <div
            class="font-bold"
            :class="{
              'text-8xl': !((heatInfos[0].Part2?.trim()?.length ?? 0) > 0 || (heatInfos[0].Part3?.trim()?.length ?? 0) > 0 || (heatInfos[0].Part4?.trim()?.length ?? 0) > 0 || (heatInfos[0].Part5?.trim()?.length ?? 0) > 0)
            }"
          >
            <p class="pb-4">
              {{ heatInfos[0].Part1 }}
            </p>
            <p v-if="heatInfos[0].Part2?.trim()?.length > 0" class="pb-4">
              {{ heatInfos[0].Part2 }}
            </p>
            <p v-if="heatInfos[0].Part3?.trim()?.length > 0" class="pb-4">
              {{ heatInfos[0].Part3 }}
            </p>
            <p v-if="heatInfos[0].Part4?.trim()?.length > 0" class="pb-4">
              {{ heatInfos[0].Part4 }}
            </p>
            <p v-if="heatInfos[0].Part5?.trim()?.length > 0" class="pb-4">
              {{ heatInfos[0].Part5 }}
            </p>
          </div>
          <p class="">
            {{ heatInfos[0].TeamCountryName }}
          </p>
        </div>
      </div>
    </template>
  </main>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useHead } from '@vueuse/head'
import { getOpfsImgUrl } from '../helpers'
import { useTheme } from '../hooks/theme'
import { useOnFloorWallSettings } from '../hooks/on-floor-wall'
import { useHeatInfo, type ServoHeatPoolInfo } from '../hooks/heat-info'
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

function flagUrl (hi: ServoHeatPoolInfo) {
  return hi.TeamCountryFlagUrl || (hi.TeamCountryCode ? `/flags/${hi.TeamCountryCode.toLocaleLowerCase()}.svg` : undefined)
}

const heatInfos = heatInfo.data

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
