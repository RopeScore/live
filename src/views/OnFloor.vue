<template>
  <div v-if="auth.isLoggedIn.value" class="grid grid-rows-[3.5rem,auto]">
    <header class="bg-gray-100 flex justify-between items-center px-4 sticky top-0 z-1000">
      <div class="flex items-baseline mb-2">
        <text-field type="number" label="Heat" :model-value="heat" @update:model-value="heat = $event" />
        <text-button :loading="entriesQuery.loading.value" @click="loadHeat(heat)">
          Load
        </text-button>
      </div>
    </header>

    <main class="container mt-12 p-2">
      <table class="w-full">
        <tbody>
          <tr v-for="entry of entries" :key="entry.id" :class="{ 'bg-gray-300': !!entry.didNotSkipAt }" class="bg-white">
            <td v-if="hasPools" class="w-10">{{ entry.pool }}</td>
            <td class="font-bold">{{ entry.participantName }}</td>
            <td class="w-30"><span v-if="entry.didNotSkipAt">Did Not Skip</span></td>
          </tr>
        </tbody>
      </table>
    </main>
  </div>
  <template v-else-if="auth.loading.value">
    Connecting
  </template>
  <template v-else>
    You are not logged in, <router-link to="/groups">
      Go back
    </router-link>
  </template>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useHeatEntriesQuery } from '../graphql/generated'
import { useRoute } from 'vue-router'
import { useResult } from '@vue/apollo-composable'
import { CompetitionEventType, getCompetitionEventType } from '../helpers'
import { useAuth } from '../hooks/auth'

import { TextField, TextButton } from '@ropescore/components'
import SpeedLiveScore from '../components/SpeedLiveScore.vue'
import UnsupportedCompetitionEvent from '../components/UnsupportedCompetitionEvent.vue'

const auth = useAuth()
const route = useRoute()

const heat = ref<number>(1)

const selectedHeat = ref<number>(heat.value)

const entriesQuery = useHeatEntriesQuery({
  groupId: route.params.groupId as string,
  heat: selectedHeat as unknown as number
}, {
  pollInterval: 15_000,
  fetchPolicy: 'cache-and-network'
})

function loadHeat (heat: number) {
  if (selectedHeat.value !== heat) {
    selectedHeat.value = heat
  } else {
    entriesQuery.refetch()
  }
}

const entries = useResult(entriesQuery.result, [], res => {
  return [...res.group.entriesByHeat].sort((a, b) => {
    if (typeof a.pool === 'number' && typeof b.pool === 'number') return a.pool - b.pool
    else if (typeof a.pool === 'number') return -1
    else if (typeof b.pool === 'number') return 1
    else return a.id.localeCompare(b.id)
  })
})

const hasPools = computed(() => {
  return entries.value.some(e => typeof e.pool === 'number')
})
</script>
