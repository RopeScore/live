<template>
  <div
    class="border border-black bg-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white flex items-center justify-center relative"
  >
    <div
      class="font-bold text-8xl absolute top-0 left-2 text-gray-600 dark:text-gray-400"
    >
      {{ pool }}
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
import { PropType } from 'vue'
import { EntryFragment } from '../graphql/generated'

defineProps({
  pool: {
    type: Number,
    required: true
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
  }
})
</script>
