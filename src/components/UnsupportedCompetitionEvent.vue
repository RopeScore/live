<template>
  <div
    class="border border-black bg-gray-300 flex items-center justify-center relative"
  >
    <span
      class="font-bold absolute top-2 left-2 text-gray-600"
    >
      {{ entry.id }}
    </span>

    <p class="text-center">
      Unsupported Competition Event:
      <code class="block">{{ entry.competitionEventId }}</code>
      cannot display live score
    </p>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { EntryFragment } from '../graphql/generated'

defineProps({
  entry: {
    type: Object as PropType<EntryFragment>,
    required: true
  }
})
</script>
