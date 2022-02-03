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

    <main
      class="grid"
      :class="{
        'grid-cols-3': cols === 3,
        'grid-cols-2': cols === 2,
        'grid-cols-1': cols === 1
      }"
    >
      <template
        v-for="entry of entries"
        :key="entry.id"
      >
        <speed-live-score
          v-if="getCompetitionEventType(entry.competitionEventLookupCode) === CompetitionEventType.Speed"
          :entry="entry"
          :scoresheet="primaryScoresheets[entry.id]"
          :tally="tallies[primaryScoresheets[entry.id]?.id]?.tally"
        />
        <unsupported-competition-event v-else :entry="entry" />
      </template>
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
import { ref, computed, reactive, watch } from 'vue'
import { BaseScoresheetFragment, useHeatEntriesQuery, useStreamMarkAddedSubscription } from '../graphql/generated'
import { useRoute } from 'vue-router'
import { useResult } from '@vue/apollo-composable'
import { CompetitionEventType, filterLatestScoresheets, getCompetitionEventType, Mark, processMark, ScoreTally, StreamMark } from '../helpers'
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

const cols = computed(() => {
  if (entries.value.length % 3 === 0) return 3
  else if (entries.value.length % 2 === 0) return 2
  else if (entries.value.length === 1) return 1
  else return 3
})

const scoresheetIds = useResult(entriesQuery.result, [], res => {
  return res.group.entriesByHeat.flatMap(ent => {
    return filterLatestScoresheets(ent.scoresheets)
      .filter(scsh => scsh.options?.live === true && !scsh.completedAt)
      .map(scsh => scsh.id)
  })
})

const primaryScoresheets = useResult(entriesQuery.result, {} as Record<string, BaseScoresheetFragment>, res => {
  return Object.fromEntries(res.group.entriesByHeat.map(ent => {
    return [
      ent.id,
      filterLatestScoresheets(ent.scoresheets)
        .filter(scsh => scsh.options?.live === true)[0]
    ]
  }))
})

const tallies = reactive<Record<string, { tally: ScoreTally, marks: Map<number, StreamMark>, completed: boolean }>>({})

watch(primaryScoresheets, scshs => {
  for (const scsh of Object.values(scshs)) {
    if (!scsh) continue
    if (scsh?.completedAt) {
      const tallyInfo = {
        tally: reactive<ScoreTally>({}),
        marks: new Map(),
        completed: true
      }
      tallies[scsh.id] = tallyInfo

      for (const mark of scsh.marks ?? []) {
        processMark(mark as Mark, tallyInfo.tally, tallyInfo.marks)
      }
    }
  }
})

const markStreamSubscription = useStreamMarkAddedSubscription({
  scoresheetIds: scoresheetIds as unknown as string[]
}, {
  enabled: computed(() => scoresheetIds.value.length > 0) as unknown as boolean
})

watch(
  markStreamSubscription.result,
  res => {
    const mark = res?.streamMarkAdded as StreamMark

    if (!mark) return

    let tallyInfo = tallies[mark.scoresheetId]
    if (!tallyInfo) {
      tallyInfo = {
        tally: reactive<ScoreTally>({}),
        marks: new Map(),
        completed: false
      }
      tallies[mark.scoresheetId] = tallyInfo
    }

    // if (tallyInfo.completed) return

    processMark(mark, tallyInfo.tally, tallyInfo.marks)
  }
)
</script>
