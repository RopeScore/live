<template>
  <div v-if="entry" class="border rounded relative p-2 text-center" :class="{ 'bg-gray-300': !!entry.didNotSkipAt, 'bg-white': !entry.didNotSkipAt }">
    <div class="uppercase">
      {{ getAbbr(entry.competitionEventId) }}
    </div>
    <div class="text-2xl" :class="{ 'line-through': !!entry.didNotSkipAt }">
      {{ entry.participant.name }}
    </div>
    <div class="mb-1">
      {{ entry.participant.club }}<span class="text-transparent">.</span>
    </div>
    <div>{{ entry.category.name }}</div>
    <div>Pool: <span class="font-bold">{{ entry.pool }}</span></div>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import { type EntryFragment } from '../graphql/generated'
import { getAbbr } from '../helpers'

defineProps({
  entry: {
    type: Object as PropType<EntryFragment>,
    default: () => null
  }
})
</script>
