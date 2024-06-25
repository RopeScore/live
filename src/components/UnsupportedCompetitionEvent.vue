<template>
  <div
    class="border flex items-center justify-center relative"
    :class="{
      'border-black bg-gray-300 text-black': theme !== 'dark',
      'border-gray-600 bg-gray-800 text-white': theme === 'dark',
    }"
  >
    <div
      class="font-bold text-8xl absolute top-0 left-2"
      :class="{
        'text-gray-600': theme !== 'dark',
        'text-gray-400': theme === 'dark',
      }"
    >
      {{ pool ?? '' }}
    </div>

    <p class="text-center">
      Unsupported Competition Event:
      <code class="block">{{ entry?.competitionEventId ?? competitionEventId }}</code>
      cannot display live score
    </p>

    <div class="absolute bottom-2 left-2 text-gray-500">
      <div v-if="entry">
        {{ entry.id }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue'
import { type EntryFragment } from '../graphql/generated'
import type { Theme } from '../hooks/theme'

defineProps({
  pool: {
    type: Number,
    default: undefined
  },
  entry: {
    type: Object as PropType<EntryFragment>,
    required: false,
    default: () => ({})
  },
  competitionEventId: {
    type: String,
    required: false,
    default: null
  },
  theme: {
    type: String as PropType<Theme>,
    required: true
  }
})
</script>
