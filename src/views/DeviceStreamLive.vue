<template>
  <div v-if="auth.isLoggedIn.value" class="grid grid-rows-1 bg-white dark:bg-black">
    <main class="grid custom-grid">
      <template
        v-for="(pool, idx) of pools"
        :key="pool.idx"
      >
        <speed-live-score
          v-if="pool.deviceId"
          :pool="pool.label || idx + 1"
          :tally="tallies[pool.deviceId]?.tally"
          :device-id="pool.deviceId"
          :cols="cols"
        />
        <device-not-set v-else :pool="pool.label || idx + 1" />
      </template>

      <div v-show="pools.length === 0" class="bg-gray-300 flex items-center justify-center relative">
        <p class="text-center">
          No pools configured
        </p>
      </div>
    </main>
  </div>
  <template v-else-if="auth.loading.value">
    Connecting
  </template>
  <template v-else>
    You are not logged in, <router-link to="/device-stream">
      Go back
    </router-link>
  </template>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import { useDeviceStreamMarkAddedSubscription } from '../graphql/generated'
import { processMark, ScoreTally, Mark } from '../helpers'
import { useAuth } from '../hooks/auth'

import SpeedLiveScore from '../components/SpeedLiveScore.vue'
import { useStreamPools } from '../hooks/stream-pools'
import DeviceNotSet from '../components/DeviceNotSet.vue'
import { useHead } from '@vueuse/head'

useHead({
  title: 'Device Stream (Live) | RopeScore Live'
})

const auth = useAuth()
const pools = useStreamPools()

const cols = computed(() => {
  const len = pools.value.length
  if (len === 0) return 1
  else if (len === 1) return 1
  else if (len <= 4) return 2
  else if (len <= 6) return 3
  else if (len <= 8) return 4
  else if (len <= 9) return 3
  else if (len <= 12) return 4
  else return 5
})

const tallies = reactive<Record<string, { tally: ScoreTally, lastSequence: number, completed: boolean }>>({})

const deviceIds = computed(() => pools.value.map(p => p.deviceId).filter(id => typeof id === 'string'))

const markStreamSubscription = useDeviceStreamMarkAddedSubscription({
  deviceIds: deviceIds as unknown as string[]
}, {
  enabled: computed(() => deviceIds.value.length > 0) as unknown as boolean
})

watch(
  markStreamSubscription.result,
  res => {
    if (!res) return
    const deviceId = res.deviceStreamMarkAdded.device.id
    const sequence = res.deviceStreamMarkAdded.sequence
    const tally = res.deviceStreamMarkAdded.tally as ScoreTally

    let tallyInfo = tallies[deviceId]
    if (!tallyInfo) {
      tallyInfo = {
        tally: reactive<ScoreTally>({}),
        lastSequence: 0,
        completed: false
      }
      tallies[deviceId] = tallyInfo
    }

    if (sequence >= tallyInfo.lastSequence) {
      tallyInfo.tally = reactive(tally)
      tallyInfo.lastSequence = sequence
    }
  }
)
</script>

<style scoped>
.custom-grid {
  grid-template-columns: repeat(v-bind(cols), minmax(0, 1fr));
}
</style>
