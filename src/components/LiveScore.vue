<template>
  <div
    class="score-container border items-center justify-center relative overflow-hidden relative"
    :class="{
      'border-black bg-white text-black': theme !== 'dark',
      'border-gray-600 bg-black text-white dark': theme === 'dark',

      'bg-green-100': theme !== 'dark' && info?.submitted,
      'bg-green-900': theme === 'dark' && info?.submitted,
      'bg-gray-300': theme !== 'dark' && info?.didNotSkip,
      'bg-dark-500': theme === 'dark' && info?.didNotSkip,

      'flex': !row,
      'grid grid-cols-[min-content_1fr_min-content] gap-4': row
    }"
  >
    <div
      v-if="info.bgUrl"
      class="absolute"
      :class="{
        'bottom-0 right-0 left-0 max-h-[75%]': !row,
        'top-0 bottom-0 left-0 h-full': row,
      }"
    >
      <img :src="info.bgUrl" alt=" " class="h-full">
      <div class="absolute inset-0" :class="{ 'flag-bg-bottom': !row, 'flag-bg-left' : row }" />
    </div>
    <div class="absolute inset-0" :class="{ 'full-bg-bottom': !row, 'full-bg-left': row }" />

    <div
      class="font-bold"
      :class="{
        'text-gray-600': theme !== 'dark',
        'text-gray-400': theme === 'dark',

        'top-0 absolute left-2 text-8xl': !row,
        'w-[3ch] z-1 pl-4 text-6xl': row,
      }"
    >
      {{ pool ?? '' }}
    </div>

    <div
      class="overflow-hidden custom-wrap text-balance"
      :class="{
        'absolute top-2 right-2 text-end max-w-[66%] ': !row,
        'z-1': row,
      }"
    >
      <div
        v-if="info.names != null && info.names.length > 0"
        class="font-bold"
        :class="{ 'text-4xl': !row, 'whitespace-nowrap text-3xl': row }"
      >
        {{ formatList(info.names) }}
      </div>
      <div
        v-if="info.teamName != null"
        :class="{ 'text-4xl': !row, 'whitespace-nowrap text-3xl': row }"
      >
        {{ info.teamName }}
      </div>
    </div>

    <div
      v-if="!info?.didNotSkip"
      class="z-1 font-semibold tabular-nums w-full font-mono"
      :class="{
        'custom-size text-center': !row,
        'text-6xl text-end pr-4 min-w-[3ch]': row,
      }"
    >
      {{ score ?? 0 }}
    </div>

    <div
      class="debug absolute col-start-2 text-gray-500"
      :class="{ 'top-2 inset-x-auto': !row, 'justify-self-center self-end': row }"
    >
      <div v-if="info.deviceId">
        {{ info.deviceId }}
      </div>
      <div v-if="info.rsScoresheetId">
        {{ info.rsScoresheetId }}
      </div>
      <div v-if="info.competitionEventId">
        {{ getAbbr(info.competitionEventId) }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType, toRef } from 'vue'
import { formatList, getAbbr } from '../helpers'
import type { Theme } from '../hooks/theme'
import type { HeatInfo } from '../hooks/heat-info'
import type { DeviceStreamJudgeInfo } from '../graphql/generated'

const props = defineProps({
  pool: {
    type: Number,
    default: undefined
  },
  info: {
    type: Object as PropType<Partial<HeatInfo & DeviceStreamJudgeInfo>>,
    default: null
  },
  score: {
    type: Number,
    default: null
  },
  cols: {
    type: Number,
    default: null
  },
  theme: {
    type: String as PropType<Theme>,
    required: true
  },
  row: {
    type: Boolean,
    default: false,
  },
})

const cols = toRef(props, 'cols')
const fontSize = computed(() => {
  if (!cols.value) return '20rem'
  return `${100 / (cols.value * 2)}vw`
})
</script>

<style scoped>
.custom-wrap {
  text-overflow: ellipsis;
}

.custom-size {
  --val: v-bind(fontSize);
  font-size: var(--val, 20rem);
  line-height: 1;
}

.score-container .debug {
  @apply hidden;
}
.score-container:hover .debug {
  @apply block;
}
</style>

<style src="./flag-bg.css"></style>
