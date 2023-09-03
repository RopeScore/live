<template>
  <div class="grid grid-rows-1 bg-white dark:bg-black">
    <main class="grid custom-grid">
      <template
        v-for="entry of entries"
        :key="entry.id"
      >
        <speed-live-score
          v-if="getCompetitionEventType(entry.competitionEventId) === CompetitionEventType.Speed"
          :pool="entry.pool!"
          :entry="entry"
          :scoresheet="(primaryScoresheets[entry.id] as MarkScoresheetFragment & ScoresheetBaseFragment)"
          :tally="tallies[primaryScoresheets[entry.id]?.id]?.tally"
          :cols="cols"
        />
        <unsupported-competition-event v-else :entry="entry" :pool="entry.pool!" />
      </template>

      <div v-show="entries.length === 0 && !entriesQuery.loading.value" class="bg-gray-300 flex items-center justify-center relative">
        <p class="text-center">
          Empty heat loaded
        </p>
      </div>
    </main>

    <div class="fixed bottom-2 right-2">
      {{ currentHeat }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, watch, ref } from 'vue'
import { useHeatEntriesScoresheetsQuery, useStreamMarkAddedSubscription, useGroupInfoQuery, useHeatChangedSubscription, useScoresheetChangedSubscription, type MarkScoresheetFragment, type ScoresheetBaseFragment, type StreamMarkAddedSubscription } from '../graphql/generated'
import { useRoute } from 'vue-router'
import { CompetitionEventType, filterLatestScoresheets, getCompetitionEventType, type Mark, processMark, type ScoreTally } from '../helpers'
import { useAuth } from '../hooks/auth'

import SpeedLiveScore from '../components/SpeedLiveScore.vue'
import UnsupportedCompetitionEvent from '../components/UnsupportedCompetitionEvent.vue'
import { useHead } from '@vueuse/head'

useHead({
  title: '📺 Competition (Live)'
})

const route = useRoute()

const groupInfo = useGroupInfoQuery({
  groupId: route.params.groupId as string
})
const heatChangeSubscription = useHeatChangedSubscription({
  groupId: route.params.groupId as string
})

const currentHeat = ref(1)
watch(groupInfo.result, result => {
  if (typeof result?.group?.currentHeat === 'number') currentHeat.value = result?.group?.currentHeat
})
watch(heatChangeSubscription.result, result => {
  if (typeof result?.heatChanged === 'number') currentHeat.value = result?.heatChanged
})

const entriesQuery = useHeatEntriesScoresheetsQuery({
  groupId: route.params.groupId as string,
  heat: currentHeat as unknown as number
}, {
  pollInterval: 15_000,
  fetchPolicy: 'cache-and-network'
})

const entries = computed(() => {
  return [...(entriesQuery.result.value?.group?.entriesByHeat ?? [])].sort((a, b) => {
    if (typeof a.pool === 'number' && typeof b.pool === 'number') return a.pool - b.pool
    else if (typeof a.pool === 'number') return -1
    else if (typeof b.pool === 'number') return 1
    else return a.id.localeCompare(b.id)
  })
})

const cols = computed(() => {
  const len = entries.value.length
  if (len === 0) return 1
  else if (len === 1) return 1
  else if (len <= 4) return 2
  else if (len <= 6) return 3
  else if (len <= 8) return 4
  else if (len <= 9) return 3
  else if (len <= 12) return 6
  else return 5
})

const scoresheetChangedSubscription = useScoresheetChangedSubscription({
  entryIds: computed(() => entries.value.map(e => e.id)) as unknown as string[]
})

watch(scoresheetChangedSubscription.result, () => {
  entriesQuery.refetch()
})

const scoresheetIds = computed(() => {
  return entriesQuery.result.value?.group?.entriesByHeat.flatMap(ent => {
    return filterLatestScoresheets(ent.scoresheets)
      .filter(scsh => scsh.__typename === 'MarkScoresheet' && scsh.options?.live === true && !scsh.completedAt)
      .map(scsh => scsh.id)
  }) ?? []
})

const primaryScoresheets = computed(() => {
  return Object.fromEntries((entriesQuery.result.value?.group?.entriesByHeat ?? []).map(ent => {
    return [
      ent.id,
      filterLatestScoresheets(ent.scoresheets)
        .filter(scsh => scsh.options?.live === true)[0]
    ]
  }))
})

const tallies = reactive<Record<string, { tally: ScoreTally, lastSequence: number, completed: boolean }>>({})

watch(primaryScoresheets, scshs => {
  for (const scsh of Object.values(scshs)) {
    if (!scsh || scsh.__typename !== 'MarkScoresheet') continue
    if (scsh?.completedAt) {
      const tallyInfo = {
        tally: reactive<ScoreTally>({}),
        lastSequence: 0,
        completed: true
      }
      tallies[scsh.id] = tallyInfo

      const marks = new Map()
      for (const mark of scsh.marks ?? []) {
        processMark(mark as Mark, tallyInfo.tally, marks)
      }
    }
  }
})

const markStreamSubscription = useStreamMarkAddedSubscription({
  scoresheetIds: scoresheetIds as unknown as string[]
}, {
  enabled: computed(() => scoresheetIds.value.length > 0) as unknown as boolean
})
const markStreamSubscriptionAlt = useStreamMarkAddedSubscription({
  scoresheetIds: scoresheetIds as unknown as string[]
}, {
  enabled: computed(() => scoresheetIds.value.length > 0) as unknown as boolean,
  clientId: 'alternate'
})

function markStreamWatcher (res: StreamMarkAddedSubscription | null | undefined) {
  if (!res) return
  const scoresheetId = res.streamMarkAdded.scoresheet.id
  const sequence = res.streamMarkAdded.sequence
  const tally = res.streamMarkAdded.tally as ScoreTally
  const mark = res.streamMarkAdded.mark as Mark

  let tallyInfo = tallies[scoresheetId]
  if (!tallyInfo) {
    tallyInfo = {
      tally: reactive<ScoreTally>({}),
      lastSequence: 0,
      completed: false
    }
    tallies[scoresheetId] = tallyInfo
  }

  if (sequence >= tallyInfo.lastSequence) {
    tallyInfo.tally = reactive(tally)
    tallyInfo.lastSequence = sequence
  }
  if (mark.schema === 'clear') {
    tallyInfo.lastSequence = 0
  }
}

watch(markStreamSubscription.result, markStreamWatcher)
watch(markStreamSubscriptionAlt.result, markStreamWatcher)
</script>

<style scoped>
.custom-grid {
  grid-template-columns: repeat(v-bind(cols), minmax(0, 1fr));
}
</style>
