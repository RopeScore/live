<template>
  <div class="grid grid-rows-[6rem_auto] bg-white dark:bg-gray-900">
    <header class="dark:text-black text-white bg-gray-900 dark:bg-gray-300 px-4 py-2 flex flex-col justify-center">
      <h1>{{ competitionEvent?.name ?? '' }}</h1>
      <h2>{{ currentCategory?.name ?? '' }}</h2>

      <span class="absolute top-2 right-4 dark:text-gray-600 text-gray-400">{{ currentResultIdx + 1 }} / {{ resultsToCycle.length }}</span>
    </header>
    <div v-if="resultsToCycle.length === 0" class="flex justify-center items-center text-center text-black dark:text-white">
      <h1>No results available yet</h1>
    </div>
    <div
      v-else
      class="grid grid-cols-result items-center grid-rows-11 text-black dark:text-white"
    >
      <template v-if="currentCategory?.type === CategoryType.Team">
        <div class="font-bold px-4 text-2xl">
          Team Name
        </div>
        <div class="font-bold px-4 text-2xl">
          Team Members
        </div>
      </template>
      <div v-else class="font-bold px-4 text-2xl">
        Name
      </div>
      <div class="font-bold px-4 text-2xl">
        Club
      </div>

      <div
        v-for="header in primaryTableHeaders"
        :key="header.key"
        class="text-right px-4 font-bold text-2xl"
        :class="`text-${header.color}-500`"
      >
        {{ header.text }}
      </div>

      <!-- Main: Top N: name, club, (members?), and "main" score(s) + rank -->
      <template v-for="entryRes, idx of currentResult?.rankedResult.results.slice(0, 10)" :key="`${currentCategory.id}:${entryRes.meta.participantId}`">
        <div class="text-2xl px-4 h-full flex items-center" :class="{ 'bg-light-600': idx % 2 === 1, 'dark:bg-gray-700': idx % 2 === 1 }">
          {{ getParticipant(entryRes.meta.participantId)?.name }}
        </div>
        <div v-if="currentCategory?.type === CategoryType.Team" class="text-lg px-4 h-full flex items-center" :class="{ 'bg-light-600': idx % 2 === 1, 'dark:bg-gray-700': idx % 2 === 1 }">
          {{ formatList((getParticipant(entryRes.meta.participantId) as TeamFragment).members) }}
        </div>
        <div class="text-2xl px-4 h-full flex items-center" :class="{ 'bg-light-600': idx % 2 === 1, 'dark:bg-gray-700': idx % 2 === 1 }">
          {{ getParticipant(entryRes.meta.participantId)?.club }}
        </div>

        <div
          v-for="header in primaryTableHeaders"
          :key="header.key"
          class="text-right text-4xl h-full flex items-center justify-end px-4"
          :class="[`text-${header.color}-500`, { 'bg-light-600': idx % 2 === 1, 'dark:bg-gray-700': idx % 2 === 1 }]"
        >
          {{ getScore(header, entryRes as EntryResult) }}
        </div>
        <!-- Footer: recently added - if they didn't place in top N -->
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { useRouteParams, useRouteQuery } from '@vueuse/router'
import { useLeaderboardQuery, useHeatChangedSubscription, CategoryType, type TeamFragment, ResultVersionType } from '../graphql/generated'
import { computed, ref, watch } from 'vue'
import { parseCompetitionEventDefinition, type EntryResult, type TableHeader, type OverallResult } from '@ropescore/rulesets'
import { useTimeoutFn } from '@vueuse/core'
import { useCompetitionEvent } from '../hooks/ruleset'
import { formatList } from '../helpers'

useHead({
  title: '📺 Competition (Leaderboard)'
})

const groupId = useRouteParams<string>('groupId')
const maxVisibility = useRouteQuery<ResultVersionType | undefined>('max-visibility')

const leaderboardQuery = useLeaderboardQuery({
  groupId: groupId as unknown as string,
  maxVisibility: maxVisibility as unknown as ResultVersionType | undefined
})
const heatChangeSubscription = useHeatChangedSubscription({
  groupId: groupId as unknown as string
})

watch(heatChangeSubscription.result, result => {
  leaderboardQuery.refetch()
})

const categories = computed(() => leaderboardQuery.result.value?.group?.categories ?? [])
const rankedResults = computed(() =>
  categories.value.flatMap(c =>
    c.rankedResults.map(rr =>
      ({
        categoryId: c.id,
        rankedResult: rr
      })
    )
  )
    .filter(rr => parseCompetitionEventDefinition(rr.rankedResult.competitionEventId).type !== 'oa')
    .filter((el, idx, arr) => arr.findIndex(rr => rr.categoryId === el.categoryId && rr.rankedResult.competitionEventId === el.rankedResult.competitionEventId) === idx)
    .sort((a, b) => {
      return b.rankedResult.maxEntryLockedAt - a.rankedResult.maxEntryLockedAt
    })
)

const selectedResult = ref<string>()
const currentResultIdx = computed(() => rankedResults.value.findIndex(rr => rr.rankedResult.id === selectedResult.value))
const currentResult = computed(() => rankedResults.value[currentResultIdx.value])
const currentCompetitionEvent = computed(() => currentResult.value?.rankedResult.competitionEventId)
const currentCategory = computed(() => categories.value.find(c => c.id === currentResult.value?.categoryId))

const competitionEvent = useCompetitionEvent(currentCompetitionEvent)

const resultsToCycle = ref<string[]>([])
const seenResults = ref(new Set<string>())
watch(rankedResults, newRankedResults => {
  const diff = []
  const newIds = new Set(newRankedResults.map(rr => rr.rankedResult.id))

  for (const id of newIds.values()) {
    if (!seenResults.value.has(id)) diff.push(id)
    seenResults.value.add(id)
  }

  if (diff.length > 0) {
    if (selectedResult.value == null || !diff.includes(selectedResult.value)) {
      selectedResult.value = diff[0]
    }
    resultsToCycle.value = diff
  }
})

useTimeoutFn(() => {
  const idx = selectedResult.value == null ? -1 : resultsToCycle.value.indexOf(selectedResult.value)
  if (resultsToCycle.value[idx + 1] == null) selectedResult.value = resultsToCycle.value[0]
  else selectedResult.value = resultsToCycle.value[idx + 1]
}, 15_000)

// TODO: apply config
const resultTable = computed(() => competitionEvent.value?.resultTable({}) ?? { headers: [], groups: [] })
const primaryTableHeaders = computed(() => resultTable.value.headers.filter(c => !!c.primary))
const scoreCols = computed(() => primaryTableHeaders.value.length || 1)
const infoCols = computed(() => currentCategory.value?.type === CategoryType.Team ? 3 : 2)

function getParticipant (participantId: string | number) {
  return (currentCategory.value?.participants ?? []).find(p => p.id === participantId)
}

function getScore (header: TableHeader, result: EntryResult | OverallResult) {
  let score: number
  if (header.component && 'componentResults' in result) score = result.componentResults[header.component].result[header.key]
  else score = result.result[header.key]
  return header.formatter?.(score) ?? score ?? ''
}
</script>

<style scoped>
.grid-cols-result {
  grid-template-columns: repeat(v-bind(infoCols), 1fr) repeat(v-bind(scoreCols), 15ch);
}
</style>
