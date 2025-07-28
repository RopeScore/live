<template>
  <div
    class="@container score-container items-center justify-center relative overflow-hidden relative"
    :class="{
      'text-black': theme !== 'dark',
      'border-black bg-white': !row && theme !== 'dark',
      'text-white dark': theme === 'dark',
      'border-gray-600 bg-black': !row && theme === 'dark',

      'bg-green-100': theme !== 'dark' && info?.submitted,
      'bg-green-900': theme === 'dark' && info?.submitted,
      'bg-gray-300': theme !== 'dark' && info?.didNotSkip,
      'bg-dark-500': theme === 'dark' && info?.didNotSkip,

      'flex border': !row,
      'grid grid-rows-2 grid-cols-[calc(10cqh/3*4)_min-content_1fr] gap-4': row
    }"
  >
    <div v-if="row" class="absolute inset-0 full-bg-left" />
    <div
      v-if="info.bgUrl"
      :class="{
        'absolute bottom-0 right-0 left-0 max-h-[66%]': !row,
        'row-span-2 col-start-1 row-start-1 h-full relative': row,
      }"
    >
      <img :src="info.bgUrl" alt=" " class="h-full w-full">
      <div class="absolute inset-0" :class="{ 'flag-bg-bottom': !row, 'flag-bg-left' : row }" />
    </div>
    <div v-if="!row" class="absolute inset-0 full-bg-bottom" />

    <div
      v-if="row"
      class="absolute font-bold"
      :class="{
        'top-0 left-2 text-8xl': !row,
        'left-2 top-0 text-[3.5cqh]': row,
      }"
    >
      {{ rank ?? '' }}
    </div>

    <div
      class="font-bold absolute"
      :class="{
        'text-gray-600': theme !== 'dark',
        'text-gray-400': theme === 'dark',

        'top-0 left-2 text-[7cqmax]': !row,
        'left-2 bottom-0 text-[3.5cqh]': row,
      }"
    >
      {{ row ? 'S' : '' }}{{ pool ?? '' }}
    </div>

    <div
      class="overflow-hidden custom-wrap text-balance"
      :class="{
        'absolute top-2 right-2 text-end max-w-[66%] ': !row,
        'z-1 row-start-1 row-span-2 col-start-3 max-w-[100%]': row,
      }"
    >
      <div
        v-if="(['team-name', 'athletes-and-team-name'] as Array<string | undefined>).includes(nameMode) && info.teamName != null"
        class="font-bold"
        :class="{ 'text-[2.5cqmax] leading-tight': !row, 'truncate text-[2.5cqmax]': row }"
      >
        {{ info.teamName }}
      </div>
      <div
        v-if="([undefined, 'athlete-names', 'athletes-and-team-name'] as Array<string | undefined>).includes(nameMode) && info.names != null && info.names.length > 0"
        class="text-ellipsis"
        :class="{ 'font-bold': nameMode !== 'athletes-and-team-name', 'line-clamp-2 text-[1.5cqmax] leading-tight': !row, 'truncate leading-tight text-[2.5cqmax]': row }"
      >
        {{ formatList(info.names) }}
      </div>

      <div
        v-if="info.delegationName != null && nameMode !== 'none'"
        :class="{ 'text-[2.5cqmax] leading-tight': !row, 'truncate leading-tight text-[2.5cqmax]': row }"
      >
        {{ info.delegationName }}
      </div>
    </div>

    <div
      v-if="!info?.didNotSkip"
      class="z-1 font-semibold tabular-nums w-full font-mono"
      :class="{
        'leading-none text-center': !row,
        'text-[20cqmax]': !row && score < 100,
        'text-[15cqmax]': !row && score >= 100,
        'row-start-1 col-start-2 row-span-2 min-w-[3ch] text-right text-[8cqh]': row,
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
import { type PropType } from 'vue'
import { formatList, getAbbr } from '../helpers'
import type { Theme } from '../hooks/theme'
import type { HeatInfo } from '../hooks/heat-info'
import type { DeviceStreamJudgeInfo } from '../graphql/generated'
import type { DeviceStreamNameMode } from '../views/device-stream/use-device-stream-pools'

defineProps({
  pool: {
    type: Number,
    default: undefined
  },
  info: {
    type: Object as PropType<Partial<HeatInfo & DeviceStreamJudgeInfo>>,
    default: null
  },
  nameMode: {
    type: String as PropType<DeviceStreamNameMode>,
    default: 'athlete-names'
  },
  score: {
    type: Number,
    default: null
  },
  rank: {
    type: String,
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
</script>

<style scoped>
.custom-wrap {
  text-overflow: ellipsis;
}

.score-container .debug {
  @apply hidden;
}
.score-container:hover .debug {
  @apply block;
}
</style>

<style src="./flag-bg.css"></style>
