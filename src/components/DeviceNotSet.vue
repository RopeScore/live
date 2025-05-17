<template>
  <div
    class="border flex items-center justify-center relative"
    :class="{
      'border-black bg-gray-300 text-black': theme !== 'dark',
      'border-gray-600 bg-gray-800 text-white': theme === 'dark',
    }"
  >
    <div
      class="font-bold text-8xl absolute left-2"
      :class="{
        'text-gray-600': theme !== 'dark',
        'text-gray-400': theme === 'dark',

        'top-0': !row,
        'top-auto bottom-auto': row,
      }"
    >
      {{ pool ?? '' }}
    </div>

    <p class="text-center">
      No device linked to this pool
    </p>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import type { Theme } from '../hooks/theme'

defineProps({
  pool: {
    type: Number,
    default: undefined
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
