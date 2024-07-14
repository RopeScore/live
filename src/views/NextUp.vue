<template>
  <div
    class="grid grid-rows-[2fr_5fr]"
    :class="{
      'bg-white': theme !== 'dark',
      'bg-black': theme === 'dark',
    }"
  >
    <div
      :class="{
        'bg-green-100': theme === 'light',
        'bg-green-500': theme === 'dark',
        'bg-svgf-blue': theme === 'swedish-gymnastics',
      }"
    >
      <div class="container mx-auto flex items-center h-full p-y-8">
        <div class="min-w-full overflow-x-auto grid grid-cols-[3rem_auto] gap-2">
          <div
            class="sticky right-2 flex items-center justify-end font-bold text-2xl"
            :class="{
              'text-svgf-yellow': theme === 'swedish-gymnastics'
            }"
          >
            {{ currentHeat }}
          </div>
          <div :style="`--cols: ${entries[currentHeat]?.length ?? '1'}`" class="grid grid-rows-1 grid-cols-var gap-2">
            <entry-info-card
              v-for="entry of entries[currentHeat]"
              :key="entry.id"
              :entry="entry"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="container mx-auto flex items-center h-full p-y-8">
      <div class="min-w-full overflow-x-auto grid grid-cols-[3rem_auto] gap-8">
        <template v-for="heat of nextThree" :key="heat">
          <div
            class="sticky right-2 flex items-center justify-end font-bold text-2xl"
            :class="{ 'text-white': theme === 'dark' }"
          >
            {{ heat }}
          </div>
          <div :style="`--cols: ${entries[heat]?.length ?? '1'}`" class="grid grid-rows-1 grid-cols-var gap-2">
            <entry-info-card
              v-for="entry of entries[heat]"
              :key="entry.id"
              :entry="entry"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useGroupEntriesQuery, useGroupInfoQuery, useHeatChangedSubscription } from '../graphql/generated'
import { useRoute } from 'vue-router'
import EntryInfoCard from '../components/EntryInfoCard.vue'
import { useHead } from '@vueuse/head'
import { useTheme } from '../hooks/theme'

useHead({
  title: '📺 Competition (Next Up)'
})

const route = useRoute()

const groupInfo = useGroupInfoQuery({
  groupId: route.params.groupId as string
}, {
  pollInterval: 30_000,
  fetchPolicy: 'cache-and-network'
})
const heatChangeSubscription = useHeatChangedSubscription({
  groupId: route.params.groupId as string
})

watch(heatChangeSubscription.result, () => { groupInfo.refetch() })

const currentHeat = computed(() => groupInfo.result.value?.group?.currentHeat ?? 1)
const theme = useTheme()

const entriesQuery = useGroupEntriesQuery({
  groupId: route.params.groupId as string
}, {
  pollInterval: 60_000,
  fetchPolicy: 'cache-and-network'
})

const entries = computed(() => {
  const ents = [...(entriesQuery.result.value?.group?.entries ?? [])].filter(e => typeof e.heat === 'number')
  ents.sort((a, b) => a.heat! - b.heat!)
  const heats: Record<number, typeof ents> = {}
  for (const ent of ents) {
    heats[ent.heat!] ??= []
    heats[ent.heat!].push(ent)
  }
  for (const heat in heats) {
    heats[heat].sort((a, b) => {
      if (typeof a.pool === 'number' && typeof b.pool === 'number') return a.pool - b.pool
      else if (typeof a.pool === 'number') return -1
      else if (typeof b.pool === 'number') return 1
      else return a.id.localeCompare(b.id)
    })
  }

  return heats
})
const heats = computed(() => {
  const existing = [...new Set([...(entriesQuery.result.value?.group?.entries ?? [])].filter(e => typeof e.heat === 'number').map(e => e.heat)) as Set<number>]
  existing.sort((a, b) => a - b)
  return existing
})

const nextThree = computed(() => {
  return [heatPlusN(1), heatPlusN(2), heatPlusN(3)].filter(n => typeof n === 'number') as number[]
})

function heatPlusN (n: number) {
  const heatIdx = heats.value.indexOf(currentHeat.value)
  if (heatIdx === -1) return undefined
  return heats.value[heatIdx + n]
}
</script>

<style scoped>
.grid-cols-var {
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
}
</style>
