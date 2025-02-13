<template>
  <div
    class="grid grid-rows-1"
    :class="{
      'bg-white text-black': theme !== 'dark',
      'bg-black text-white': theme === 'dark',
    }"
  >
    <div
      class="absolute flex flex-col"
      :class="{
        'top-4 right-4 items-end': freeCorner === 'top-right',
        'bottom-4 right-4 items-end': freeCorner === 'bottom-right',
        'top-4 left-4 items-start': freeCorner === 'top-left',
        'bottom-4 left-4 items-start': freeCorner === 'bottom-left'
      }"
    >
      <div class="font-bold text-8xl">
        {{ clock }}
      </div>
      <div v-if="heatInfo.data.value?.[0]?.HeatNumber">
        <span class="text-5xl">heat&nbsp;</span>
        <span class="text-8xl font-bold">{{ heatInfo.data.value[0].HeatNumber }}</span>
      </div>
    </div>

    <main class="grid custom-grid">
      <template v-for="row of screen?.rows ?? 0" :key="row">
        <template v-for="col of screen?.cols ?? 0" :key="col">
          <div v-if="pools[`${row}:${col}`] == null" />
          <template v-else>
            <device-not-set v-if="!pools[`${row}:${col}`].deviceId" :pool="pools[`${row}:${col}`].label" :theme="theme" />
            <speed-live-score
              v-else-if="tallies[pools[`${row}:${col}`].deviceId!]?.info == null || tallies[pools[`${row}:${col}`].deviceId!]?.info?.judgeType === 'S' || tallies[pools[`${row}:${col}`].deviceId!]?.info?.judgeType === 'Shj'"
              :pool="pools[`${row}:${col}`].label"
              :tally="tallies[pools[`${row}:${col}`].deviceId!]?.tally"
              :device-id="pools[`${row}:${col}`].deviceId"
              :cols="cols"
              :bg-url="poolBgUrl(pools[`${row}:${col}`].label)"
              :names="poolNames(pools[`${row}:${col}`].label)"
              :theme="theme"
            />
            <timing-live-score
              v-else-if="tallies[pools[`${row}:${col}`].deviceId!]?.info?.judgeType === 'T'"
              :pool="pools[`${row}:${col}`].label"
              :tally="tallies[pools[`${row}:${col}`].deviceId!]?.tally"
              :device-id="pools[`${row}:${col}`].deviceId"
              :cols="cols"
              :bg-url="poolBgUrl(pools[`${row}:${col}`].label)"
              :theme="theme"
            />
            <unsupported-competition-event
              v-else
              :pool="pools[`${row}:${col}`].label"
              :competition-event-id="pools[`${row}:${col}`].deviceId ? tallies[pools[`${row}:${col}`].deviceId!]?.info?.judgeType ?? '---' : '---'"
              :theme="theme"
            />
          </template>
        </template>
      </template>

      <div
        v-if="screen != null && ((screen?.cols ?? 0) === 0 || (screen?.rows ?? 0) === 0)"
        class="flex items-center justify-center relative"
        :class="{
          'bg-gray-300 text-black': theme !== 'dark',
          'bg-gray-800 text-white': theme === 'dark'
        }"
      >
        <p class="text-center">
          No pools configured
        </p>
      </div>

      <div
        v-if="screen == null"
        class="flex items-center justify-center relative"
        :class="{
          'bg-gray-300 text-black': theme !== 'dark',
          'bg-gray-800 text-white': theme === 'dark'
        }"
      >
        <p class="text-center">
          Screen does not exist, close this display
        </p>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { type DeviceStreamJudgeInfo, type DeviceStreamMarkAddedSubscription, useDeviceStreamMarkAddedSubscription } from '../../graphql/generated'
import { type ScoreTally, type Mark, formatList } from '../../helpers'
import { useDeviceStreamPools } from './use-device-stream-pools'
import { useHead } from '@vueuse/head'
import { useRouteQuery } from '@vueuse/router'
import { useTheme } from '../../hooks/theme'
import { useDateFormat, useTimestamp } from '@vueuse/core'
import { metrics } from '@sentry/vue'

import DeviceNotSet from '../../components/DeviceNotSet.vue'
import SpeedLiveScore from '../../components/SpeedLiveScore.vue'
import TimingLiveScore from '../../components/TimingLiveScore.vue'
import UnsupportedCompetitionEvent from '../../components/UnsupportedCompetitionEvent.vue'
import { getHeatNameList, useHeatInfo } from '../../hooks/heat-info'

useHead({
  title: '📺 Device Stream (Live)'
})

const settings = useDeviceStreamPools()
const screenId = useRouteQuery<string>('screen-id')
const theme = useTheme()
const clock = useDateFormat(useTimestamp({ interval: 300 }), 'HH:mm')

const screen = computed(() => screenId.value == null ? null : settings.value.screens?.[screenId.value])
const cols = computed(() => screen.value?.rows === 0 ? 1 : screen.value?.cols ?? 1)
const rows = computed(() => screen.value?.cols === 0 ? 1 : screen.value?.rows ?? 1)
const pools = computed(() => screen.value?.pools ?? {})

const tallies = reactive<Record<string, { tally: ScoreTally, lastSequence: number, completed: boolean, info?: DeviceStreamJudgeInfo }>>({})
const deviceIds = computed(() => Object.values(pools.value).map(p => p.deviceId).filter(id => typeof id === 'string'))

const freeCorner = computed(() => {
  if (pools.value[`1:${cols.value}`] == null) return 'top-right'
  if (pools.value[`${rows.value}:${cols.value}`] == null) return 'bottom-right'
  if (pools.value['1:1'] == null) return 'top-left'
  if (pools.value[`${rows.value}:1`] == null) return 'bottom-left'
  else return 'top-right'
})

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

  metrics.distribution('stream_mark_delay', Date.now() - mark.timestamp, {
    unit: 'millisecond'
  })

  let tallyInfo = tallies[deviceId]
  if (!tallyInfo) {
    tallyInfo = {
      tally: reactive<ScoreTally>({}),
      lastSequence: 0,
      completed: false
    }
    tallies[deviceId] = tallyInfo
  }

  if (info != null) tallyInfo.info = info

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

const poolBackgrounds = ref<Array<{ poolLabel: number, bgUrl?: string, names: string[] }>>([])

function poolBgUrl (poolLabel: number | undefined) {
  if (poolLabel == null) return undefined
  return poolBackgrounds.value.find(pb => `${pb.poolLabel}` === `${poolLabel}`)?.bgUrl
}

function poolNames (poolLabel: number | undefined) {
  if (poolLabel == null) return undefined
  return formatList(poolBackgrounds.value.find(pb => `${pb.poolLabel}` === `${poolLabel}`)?.names ?? [])
}

const hic = ref(settings.value.heatInfo)
watch(() => settings.value.heatInfo, newHeatInfo => { hic.value = newHeatInfo })

const heatInfo = useHeatInfo(hic)

watch(heatInfo.data, heatInfo => {
  if (heatInfo == null) {
    poolBackgrounds.value = []
    return
  }
  poolBackgrounds.value = heatInfo.map(hi => {
    return {
      poolLabel: hi.Station,
      bgUrl: hi.TeamCountryFlagUrl || (hi.TeamCountryCode ? `/flags/${hi.TeamCountryCode.toLocaleLowerCase()}.svg` : undefined),
      names: getHeatNameList(hi, { mode: 'first' })
    }
  })
})
</script>

<style scoped>
.custom-grid {
  grid-template-columns: repeat(v-bind(cols), minmax(0, 1fr));
  grid-template-rows: repeat(v-bind(rows), minmax(0, 1fr));
}
</style>
