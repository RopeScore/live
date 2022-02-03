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
      <code class="block">{{ entry.competitionEventLookupCode }}</code>
      cannot display live score
    </p>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { FullEntryFragment } from '../graphql/generated'

defineProps({
  entry: {
    type: Object as PropType<FullEntryFragment>,
    required: true
  }
})
</script>
