<template>
  <div
    class="fixed bottom-0 right-0 left-0 top-0"
    :class="{
      'bg-green-500': keyColor === 'green',
      'bg-blue-500': keyColor === 'blue',
      'bg-white': keyColor === 'theme' && theme !== 'dark',
      'bg-black': keyColor === 'theme' && theme === 'dark'
    }"
  >
    <div class="fixed bottom-0 right-0 left-0">
      <div
        v-if="entries.length >= 1"
        class="flex flex-row flex-nowrap items-center w-max min-w-125 p-4 pr-8 mb-6 custom--clip"
        :class="{
          'bg-gray-200 text-dark-600': theme === 'light',
          'bg-gray-700 text-light-600': theme === 'dark',
          'bg-svgf-blue text-white': theme === 'swedish-gymnastics',

          'pr-8': entries.length === 1,
          'pr-12': entries.length > 1,
        }"
      >
        <div class="px-4">
          <img
            v-if="theme === 'swedish-gymnastics'"
            alt=""
            :src="SvGFLogo"
            class="h-16"
          >
        </div>

        <div v-if="entries.length === 1" class="flex flex-col">
          <div class="italic" :class="{ 'text-svgf-yellow': theme === 'swedish-gymnastics' }">
            Heat {{ currentHeat }}&ndash;{{ entries[0].category.name }}
          </div>
          <div class="text-2xl">
            <span class="font-bold">{{ entries[0].participant.name }}</span>
            <span v-if="entries[0].participant.club">&ndash;{{ entries[0].participant.club }}</span>
          </div>
          <div v-if="entries[0].participant.__typename === 'Team'">
            {{ formatList(entries[0].participant.members) }}
          </div>
        </div>

        <div v-else class="flex flex-col">
          <div class="italic" :class="{ 'text-svgf-yellow': theme === 'swedish-gymnastics' }">
            Heat {{ currentHeat }}
          </div>
          <div class="grid grid-cols-[3ch_auto_auto_auto] gap-2 items-baseline">
            <template v-for="entry of entries" :key="entry.id">
              <span>{{ entry.pool }}</span>
              <span
                class="font-bold text-s"
                :class="{ 'line-through': entry.didNotSkipAt }"
              >
                {{ entry.participant.name }}
              </span>
              <span
                :class="{ 'line-through': entry.didNotSkipAt }"
              >
                {{ entry.participant.club ?? '' }}
              </span>
              <span v-if="entry.participant.__typename === 'Team'" class="text-xs">
                {{ formatList(entry.participant.members) }}
              </span>
              <span v-else />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useGroupInfoQuery, useHeatChangedSubscription, useHeatEntriesQuery } from '../../graphql/generated'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { formatList } from '../../helpers'
import { useKeyColor, useTheme } from '../../hooks/theme'

import SvGFLogo from '../../assets/svgf-icon-svenskgymnastik-white.svg'

useHead({
  title: '📺 Competition (On Floor)'
})

const route = useRoute()

const groupInfo = useGroupInfoQuery({
  groupId: route.params.groupId as string
})
const heatChangeSubscription = useHeatChangedSubscription({
  groupId: route.params.groupId as string
})

const keyColor = useKeyColor()
const theme = useTheme()

watch(heatChangeSubscription.result, () => { void groupInfo.refetch() })

const currentHeat = computed(() => groupInfo.result.value?.group?.currentHeat ?? 1)

const entriesQuery = useHeatEntriesQuery({
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
</script>

<style scoped>
.custom--clip {
  clip-path: polygon(0 0, 100% 0, calc(100% - 2rem) 100%, 0% 100%);
}
</style>
