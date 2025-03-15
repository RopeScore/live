<template>
  <div
    class="score-container border flex items-center justify-center relative overflow-hidden"
    :class="{
      'border-black bg-white text-black': theme !== 'dark',
      'border-gray-600 bg-black text-white dark': theme === 'dark',

      'bg-green-100': theme !== 'dark' && info?.submitted,
      'bg-green-900': theme === 'dark' && info?.submitted,
      'bg-gray-300': theme !== 'dark' && info?.didNotSkip,
      'bg-dark-500': theme === 'dark' && info?.didNotSkip
    }"
  >
    <div v-if="info.bgUrl" class="absolute bottom-0 right-0 left-0 max-h-[75%]">
      <img :src="info.bgUrl" alt=" ">
      <div class="absolute inset-0 flag-bg" />
    </div>
    <div class="absolute inset-0 full-bg" />

    <div
      class="font-bold text-8xl absolute top-0 left-2"
      :class="{
        'text-gray-600': theme !== 'dark',
        'text-gray-400': theme === 'dark',
      }"
    >
      {{ pool ?? '' }}
    </div>
    <div
      v-if="info.names != null && info.names.length > 0"
      class="font-bold text-4xl absolute top-2 right-2 max-w-[66%] overflow-hidden custom-wrap text-balance text-right"
    >
      {{ formatList(info.names) }}
    </div>

    <div v-if="!info?.didNotSkip" class="z-1 font-semibold tabular-nums w-full text-center font-mono custom-size">
      {{ tally?.step ?? 0 }}
    </div>

    <div class="debug absolute top-2 right-2 text-gray-500">
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
import { type ScoreTally, formatList, getAbbr } from '../helpers'
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
  tally: {
    type: Object as PropType<Readonly<ScoreTally> | null>,
    default: null
  },
  cols: {
    type: Number,
    default: null
  },
  theme: {
    type: String as PropType<Theme>,
    required: true
  }
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
