<template>
  <div v-if="auth.isLoggedIn.value" class="grid grid-rows-1">
    <main class="grid custom-grid">
      <template
        v-for="(pool, idx) of pools"
        :key="pool.idx"
      >
        <speed-live-score
          v-if="pool.deviceId"
          :pool="idx + 1"
          :tally="tallies[pool.deviceId]?.tally"
          :device-id="pool.deviceId"
          :cols="cols"
        />
        <device-not-set v-else :pool="idx + 1" />
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
import { processMark, ScoreTally, DeviceStreamMark } from '../helpers'
import { useAuth } from '../hooks/auth'

import SpeedLiveScore from '../components/SpeedLiveScore.vue'
import { useStreamPools } from '../hooks/stream-pools'
import DeviceNotSet from '../components/DeviceNotSet.vue'

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

const tallies = reactive<Record<string, { tally: ScoreTally, marks: Map<number, DeviceStreamMark>, completed: boolean }>>({})

const deviceIds = computed(() => pools.value.map(p => p.deviceId).filter(id => typeof id === 'string'))

const markStreamSubscription = useDeviceStreamMarkAddedSubscription({
  deviceIds: deviceIds as unknown as string[]
}, {
  enabled: computed(() => deviceIds.value.length > 0) as unknown as boolean
})

watch(
  markStreamSubscription.result,
  res => {
    const mark = res?.deviceStreamMarkAdded as DeviceStreamMark

    if (!mark) return

    let tallyInfo = tallies[mark.deviceId]
    if (!tallyInfo) {
      tallyInfo = {
        tally: reactive<ScoreTally>({}),
        marks: new Map(),
        completed: false
      }
      tallies[mark.deviceId] = tallyInfo
    }

    if (mark.schema === 'clear') {
      tallies[mark.deviceId] = {
        tally: reactive<ScoreTally>({}),
        marks: new Map(),
        completed: false
      }
    } else {
      processMark(mark, tallyInfo.tally, tallyInfo.marks)
    }
  }
)
</script>

<style scoped>
.custom-grid {
  grid-template-columns: repeat(v-bind(cols), minmax(0, 1fr));
}
</style>
