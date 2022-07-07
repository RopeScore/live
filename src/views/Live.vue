<template>
  <div v-if="auth.isLoggedIn.value" class="grid grid-rows-1">
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
          v-if="getCompetitionEventType(entry.competitionEventId) === CompetitionEventType.Speed"
          :entry="entry"
          :scoresheet="primaryScoresheets[entry.id]"
          :tally="tallies[primaryScoresheets[entry.id]?.id]?.tally"
        />
        <unsupported-competition-event v-else :entry="entry" />
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
import { computed, reactive, watch } from 'vue'
import { useHeatEntriesScoresheetsQuery, useStreamMarkAddedSubscription, useGroupInfoQuery, useHeatChangedSubscription, useScoresheetChangedSubscription, MarkScoresheetFragment } from '../graphql/generated'
import { useRoute } from 'vue-router'
import { CompetitionEventType, filterLatestScoresheets, getCompetitionEventType, Mark, processMark, ScoreTally, StreamMark } from '../helpers'
import { useAuth } from '../hooks/auth'

import SpeedLiveScore from '../components/SpeedLiveScore.vue'
import UnsupportedCompetitionEvent from '../components/UnsupportedCompetitionEvent.vue'

const auth = useAuth()
const route = useRoute()

const groupInfo = useGroupInfoQuery({
  groupId: route.params.groupId as string
})
const heatChangeSubscription = useHeatChangedSubscription({
  groupId: route.params.groupId as string
})

watch(heatChangeSubscription.result, () => groupInfo.refetch())

const currentHeat = computed(() => groupInfo.result.value?.group?.currentHeat ?? 1)

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
  const pools = entries.value.length
  if (pools === 0) return 1
  else if (pools === 3) return 2
  else if (pools % 3 === 0) return 3
  else if (pools % 2 === 0) return 2
  else if (pools === 1) return 1
  else return 3
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

const tallies = reactive<Record<string, { tally: ScoreTally, marks: Map<number, StreamMark>, completed: boolean }>>({})

watch(primaryScoresheets, scshs => {
  for (const scsh of Object.values(scshs)) {
    if (!scsh || scsh.__typename !== 'MarkScoresheet') continue
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
