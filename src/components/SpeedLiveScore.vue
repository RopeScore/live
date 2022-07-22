<template>
  <div
    class="border border-black flex items-center justify-center relative"
    :class="{
      'bg-green-100': scoresheet?.__typename === 'MarkScoresheet' && scoresheet?.completedAt,
      'bg-gray-300': entry?.didNotSkipAt
    }"
  >
    <div
      class="font-bold text-8xl absolute top-0 left-2 text-gray-600"
    >
      {{ pool }}
    </div>
    <div
      v-if="entry"
      class="font-bold text-4xl absolute top-2 right-2 max-w-[66%] overflow-hidden custom-wrap"
    >
      {{ entry.participant.name }}
    </div>

    <div class="font-semibold tabular-nums w-full text-center font-mono custom-size">
      {{ tally?.step ?? 0 }}
    </div>

    <div class="absolute bottom-2 left-2 text-gray-500">
      <div v-if="deviceId">
        {{ deviceId }}
      </div>
      <div v-if="scoresheet">
        {{ scoresheet.id }}
      </div>
      <div v-if="entry">
        {{ getAbbr(entry.competitionEventId) }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, PropType, toRef } from 'vue'
import { EntryFragment, MarkScoresheetFragment, ScoresheetBaseFragment } from '../graphql/generated'
import { ScoreTally, getAbbr } from '../helpers'

const props = defineProps({
  pool: {
    type: Number,
    required: true
  },
  entry: {
    type: Object as PropType<EntryFragment>,
    default: () => null
  },
  scoresheet: {
    type: Object as PropType<Pick<MarkScoresheetFragment & ScoresheetBaseFragment, 'id' | '__typename' | 'completedAt'> | null>,
    default: () => null
  },
  deviceId: {
    type: String,
    default: null
  },
  tally: {
    type: Object as PropType<Readonly<ScoreTally> | null>,
    default: null
  },
  cols: {
    type: Number,
    default: null
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
</style>
