<template>
  <div class="grid grid-rows-[6rem_auto] bg-white dark:bg-black">
    <header class="dark:text-black text-white bg-gray-900 dark:bg-gray-100 px-4 py-2 flex flex-col justify-center">
      <h1>{{ competitionEvent?.name ?? '' }}</h1>
      <h2>{{ currentCategory?.name ?? '' }}</h2>
    </header>
    <div
      class="grid items-center px-4 grid-rows-10 text-black dark:text-white gap-2"
      :class="{
        'grid-cols-[1fr_1fr_1fr_15ch_10ch]': currentCategory?.type === CategoryType.Team,
        'grid-cols-[1fr_1fr_15ch_10ch]': currentCategory?.type !== CategoryType.Team
      }"
    >
      <template v-if="currentCategory?.type === CategoryType.Team">
        <div class="font-bold text-2xl">
          Team Name
        </div>
        <div class="font-bold text-2xl">
          Team Members
        </div>
      </template>
      <div v-else class="font-bold text-2xl">
        Name
      </div>
      <div class="font-bold text-2xl">
        Club
      </div>

      <div
        v-for="header in resultTable.headers.slice(resultTable.headers.length - 2)"
        :key="header.key"
        class="text-right font-bold text-2xl"
        :class="`text-${header.color}-500`"
      >
        {{ header.text }}
      </div>

      <!-- Main: Top N: name, club, (members?), and "main" score(s) + rank -->
      <template v-for="entryRes of currentResult?.rankedResult.results.slice(0, 9)" :key="`${currentCategory.id}:${entryRes.meta.participantId}`">
        <div class="text-2xl">
          {{ getParticipant(entryRes.meta.participantId)?.name }}
        </div>
        <div v-if="currentCategory?.type === CategoryType.Team" class="text-lg">
          {{ formatList((getParticipant(entryRes.meta.participantId) as TeamFragment).members) }}
        </div>
        <div class="text-2xl">
          {{ getParticipant(entryRes.meta.participantId)?.club }}
        </div>

        <div
          v-for="header in resultTable.headers.slice(resultTable.headers.length - 2)"
          :key="header.key"
          class="text-right text-4xl"
          :class="`text-${header.color}-500`"
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
import { useRouteParams } from '@vueuse/router'
import { useLeaderboardQuery, useHeatChangedSubscription, CategoryType, type TeamFragment } from '../graphql/generated'
import { computed, ref, watch } from 'vue'
import { parseCompetitionEventDefinition, type EntryResult, type TableHeader, type OverallResult } from '@ropescore/rulesets'
import { useTimeoutFn } from '@vueuse/core'
import { useCompetitionEvent } from '../hooks/ruleset'
import { formatList } from '../helpers'

useHead({
  title: '📺 Competition (Leaderboard)'
})

const groupId = useRouteParams<string>('groupId')

const leaderboardQuery = useLeaderboardQuery({
  groupId: groupId as unknown as string
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
const currentResult = computed(() => {
  return rankedResults.value.find(rr => rr.rankedResult.id === selectedResult.value)
})
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
