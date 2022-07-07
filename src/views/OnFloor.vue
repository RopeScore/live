<template>
  <div v-if="auth.isLoggedIn.value" class="fixed bottom-0 right-0 left-0">
    <table class="w-full">
      <thead>
        <tr class="bg-white">
          <th v-if="hasPools">
            Pool
          </th>
          <th>
            Participant
          </th>
          <th>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry of entries" :key="entry.id" :class="{ 'bg-gray-300': !!entry.didNotSkipAt, 'bg-white': !entry.didNotSkipAt }">
          <td v-if="hasPools" class="w-10">
            {{ entry.pool }}
          </td>
          <td class="font-bold">
            {{ entry.participant.name }}
          </td>
          <td class="w-30">
            <span v-if="entry.didNotSkipAt">Did Not Skip</span>
          </td>
        </tr>
      </tbody>
    </table>
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
import { computed, watch } from 'vue'
import { useGroupInfoQuery, useHeatChangedSubscription, useHeatEntriesQuery } from '../graphql/generated'
import { useRoute } from 'vue-router'
import { useAuth } from '../hooks/auth'

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

const hasPools = computed(() => {
  return entries.value.length > 1 && entries.value.some(e => typeof e.pool === 'number')
})
</script>
