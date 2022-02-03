<template>
  <div
    class="border border-black flex items-center justify-center relative"
    :class="{
      'bg-green-100': scoresheet?.completedAt,
      'bg-gray-300': entry.didNotSkipAt
    }"
  >
    <div
      class="font-bold text-8xl absolute top-0 left-2 text-gray-600"
    >
      {{ entry.pool }}
    </div>
    <div
      class="absolute top-0 right-2 text-gray-300"
    >
      {{ entry.id }}
      <br>{{ scoresheet?.id }}
    </div>

    <div class="font-semibold text-20xl tabular-nums w-full text-center font-mono">
      {{ tally?.step ?? 0 }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { BaseScoresheetFragment, FullEntryFragment } from '../graphql/generated'
import { ScoreTally } from '../helpers'

defineProps({
  entry: {
    type: Object as PropType<FullEntryFragment>,
    required: true
  },
  scoresheet: {
    type: Object as PropType<BaseScoresheetFragment | null>,
    default: null
  },
  tally: {
    type: Object as PropType<Readonly<ScoreTally> | null>,
    default: null
  }
})
</script>
