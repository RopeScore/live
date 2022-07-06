<template>
  <div
    class="border border-black flex items-center justify-center relative"
    :class="{
      'bg-green-100': scoresheet?.__typename === 'MarkScoresheet' && scoresheet?.completedAt,
      'bg-gray-300': entry.didNotSkipAt
    }"
  >
    <div
      class="font-bold text-8xl absolute top-0 left-2 text-gray-600"
    >
      {{ entry.pool }}
    </div>
    <div
      class="font-bold text-4xl absolute top-2 right-2 max-w-[66%] overflow-hidden custom-wrap"
    >
      {{ entry.participant.name }}
    </div>

    <div class="font-semibold text-20xl tabular-nums w-full text-center font-mono">
      {{ tally?.step ?? 0 }}
    </div>

    <div class="absolute bottom-2 left-2 text-gray-500">
      <div>{{ scoresheet?.id }}</div>
      <div>{{ getAbbr(entry.competitionEventId) }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { EntryFragment, ScoresheetBaseFragment } from '../graphql/generated'
import { ScoreTally, getAbbr } from '../helpers'

defineProps({
  entry: {
    type: Object as PropType<EntryFragment>,
    required: true
  },
  scoresheet: {
    type: Object as PropType<ScoresheetBaseFragment | null>,
    default: null
  },
  tally: {
    type: Object as PropType<Readonly<ScoreTally> | null>,
    default: null
  }
})
</script>

<style scoped>
.custom-wrap {
  text-overflow: ellipsis;
}
</style>
