<template>
  <div class="grid grid-rows-1 bg-white dark:bg-black">
    <main class="grid custom-grid">
      <template
        v-for="(pool, idx) of pools"
        :key="pool.idx"
      >
        <device-not-set v-if="!pool.deviceId" :pool="pool.label || idx + 1" />
        <speed-live-score
          v-else-if="tallies[pool.deviceId]?.info == null || tallies[pool.deviceId]?.info?.judgeType === 'S' || tallies[pool.deviceId]?.info?.judgeType === 'Shj'"
          :pool="pool.label || idx + 1"
          :tally="tallies[pool.deviceId]?.tally"
          :device-id="pool.deviceId"
          :cols="cols"
          :bg-url="poolBgUrl(pool.label || idx + 1)"
        />
        <timing-live-score
          v-else-if="tallies[pool.deviceId]?.info?.judgeType === 'T'"
          :pool="pool.label || idx + 1"
          :tally="tallies[pool.deviceId]?.tally"
          :device-id="pool.deviceId"
          :cols="cols"
          :bg-url="poolBgUrl(pool.label || idx + 1)"
        />
        <unsupported-competition-event
          v-else
          :pool="pool.label || idx + 1"
          :competition-event-id="pool.deviceId ? tallies[pool.deviceId]?.info?.judgeType ?? '---' : '---'"
        />
      </template>

      <div v-show="pools.length === 0" class="bg-gray-300 flex items-center justify-center relative">
        <p class="text-center">
          No pools configured
        </p>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { type DeviceStreamJudgeInfo, type DeviceStreamMarkAddedSubscription, useDeviceStreamMarkAddedSubscription } from '../graphql/generated'
import { type ScoreTally, type Mark } from '../helpers'
import { useDeviceStreamPools } from '../hooks/stream-pools'
import { useHead } from '@vueuse/head'
import { useFetch, useTimeoutPoll } from '@vueuse/core'

import DeviceNotSet from '../components/DeviceNotSet.vue'
import SpeedLiveScore from '../components/SpeedLiveScore.vue'
import TimingLiveScore from '../components/TimingLiveScore.vue'
import UnsupportedCompetitionEvent from '../components/UnsupportedCompetitionEvent.vue'

useHead({
  title: '📺 Device Stream (Live)'
})

const { pools, settings } = useDeviceStreamPools()

const cols = computed(() => {
  const len = pools.value.length
  if (len === 0) return 1
  else if (len === 1) return 1
  else if (len <= 4) return 2
  else if (len <= 6) return 3
  else if (len <= 8) return 4
  else if (len <= 9) return 3
  else if (len <= 12) return 6
  else return 5
})

const tallies = reactive<Record<string, { tally: ScoreTally, lastSequence: number, completed: boolean, info?: DeviceStreamJudgeInfo }>>({})

const deviceIds = computed(() => pools.value.map(p => p.deviceId).filter(id => typeof id === 'string'))

const markStreamSubscription = useDeviceStreamMarkAddedSubscription({
  deviceIds: deviceIds as unknown as string[]
}, {
  enabled: computed(() => deviceIds.value.length > 0) as unknown as boolean
})
const markStreamSubscriptionAlt = useDeviceStreamMarkAddedSubscription({
  deviceIds: deviceIds as unknown as string[]
}, {
  enabled: computed(() => deviceIds.value.length > 0) as unknown as boolean,
  clientId: 'alternate'
})

function markStreamWatcher (res: DeviceStreamMarkAddedSubscription | null | undefined) {
  if (!res) return
  const deviceId = res.deviceStreamMarkAdded.device.id
  const sequence = res.deviceStreamMarkAdded.sequence
  const tally = res.deviceStreamMarkAdded.tally as ScoreTally
  const mark = res.deviceStreamMarkAdded.mark as Mark
  const info = res.deviceStreamMarkAdded.info

  let tallyInfo = tallies[deviceId]
  if (!tallyInfo) {
    tallyInfo = {
      tally: reactive<ScoreTally>({}),
      lastSequence: 0,
      completed: false,
      ...(info != null ? { info } : {})
    }
    tallies[deviceId] = tallyInfo
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

const poolBackgrounds = ref<Array<{ poolLabel: number, bgUrl?: string }>>([])

function poolBgUrl (poolLabel: number) {
  return poolBackgrounds.value.find(pb => `${pb.poolLabel}` === `${poolLabel}`)?.bgUrl
}

const servoPollUrl = ref<string>('')

interface ServoHeatPoolInfo {
  PROGRAM: 'ON' | ''
  Station: number
  HeatNumber: string
  Event: string
  Team: string
  TeamCountryCode: string
  TeamCountryName: string
  TeamCountryFlagUrl: string
  [nameKey: `Part${number}`]: string
  [lastNameKey: `Part${number}_Last`]: string
}

const servoCurrentHeatFetch = useFetch(servoPollUrl, {
  headers: {
    accept: 'application/json'
  }
}, {
  immediate: false
}).get().json<ServoHeatPoolInfo[]>()

watch(servoCurrentHeatFetch.data, heatInfo => {
  if (heatInfo == null) {
    poolBackgrounds.value = []
    return
  }
  poolBackgrounds.value = heatInfo.map(hi => ({
    poolLabel: hi.Station,
    bgUrl: hi.TeamCountryFlagUrl ?? (hi.TeamCountryCode ? `/flags/${hi.TeamCountryCode.toLocaleLowerCase()}.svg` : undefined)
  }))
})

const servoPoll = useTimeoutPoll(() => {
  servoCurrentHeatFetch.execute()
}, 10_000, { immediate: false })

watch(() => settings.value.poolBackgrounds, poolBackgrounds => {
  // start by just disabling all polling
  servoPoll.pause()

  if (poolBackgrounds?.system === 'servo' && poolBackgrounds.competitionId != null) {
    let url
    try {
      url = new URL(`/api/v1/competitions/${poolBackgrounds.competitionId}/info/current`, poolBackgrounds.baseUrl)
    } catch {
      return
    }
    servoPollUrl.value = url.href
    servoPoll.resume()
  }
}, { immediate: true })
</script>

<style scoped>
.custom-grid {
  grid-template-columns: repeat(v-bind(cols), minmax(0, 1fr));
}
</style>
