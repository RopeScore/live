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
      <div v-if="heatInfo.currentHeat.value">
        <span class="text-5xl">heat&nbsp;</span>
        <span class="text-8xl font-bold">{{ heatInfo.currentHeat.value }}</span>
      </div>
    </div>

    <main class="grid custom-grid">
      <template v-for="row of screen?.rows ?? 0" :key="row">
        <template v-for="col of screen?.cols ?? 0" :key="col">
          <div v-if="pools[`${row}:${col}`] == null" />
          <template v-else>
            <device-not-set v-if="settings.heatInfo?.system !== 'ropescore' && !pools[`${row}:${col}`].deviceId" :pool="pools[`${row}:${col}`].label" :theme="theme" />
            <speed-live-score
              v-else-if="extendedInfo(row, col)?.judgeType == null || ['S', 'Shj'].includes(extendedInfo(row, col)?.judgeType as string)"
              :pool="pools[`${row}:${col}`].label"
              :tally="tallies[extendedInfo(row, col)?.rsScoresheetId ?? extendedInfo(row, col)?.deviceId!]?.tally.value"
              :info="extendedInfo(row, col)"
              :cols="cols"
              :theme="theme"
            />
            <timing-live-score
              v-else-if="extendedInfo(row, col)?.judgeType === 'T'"
              :pool="pools[`${row}:${col}`].label"
              :tally="tallies[extendedInfo(row, col)?.rsScoresheetId ?? extendedInfo(row, col)?.deviceId!]?.tally.value"
              :info="extendedInfo(row, col)"
              :cols="cols"
              :theme="theme"
            />
            <unsupported-competition-event
              v-else
              :pool="pools[`${row}:${col}`].label"
              :info="extendedInfo(row, col)"
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
import { computed, reactive, ref, watch, type Ref } from 'vue'
import { type DeviceStreamJudgeInfo, type DeviceStreamMarkAddedSubscription, type StreamMarkAddedSubscription, useDeviceStreamMarkAddedSubscription, useStreamMarkAddedSubscription } from '../../graphql/generated'
import { type ScoreTally, type Mark } from '../../helpers'
import { useDeviceStreamPools } from './use-device-stream-pools'
import { useHead } from '@vueuse/head'
import { useRouteQuery } from '@vueuse/router'
import { useTheme } from '../../hooks/theme'
import { useDateFormat, useTimestamp } from '@vueuse/core'
import * as Sentry from '@sentry/vue'

import DeviceNotSet from '../../components/DeviceNotSet.vue'
import SpeedLiveScore from '../../components/SpeedLiveScore.vue'
import TimingLiveScore from '../../components/TimingLiveScore.vue'
import UnsupportedCompetitionEvent from '../../components/UnsupportedCompetitionEvent.vue'
import { useHeatInfo, type HeatInfo } from '../../hooks/heat-info'

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

const tallies = reactive<Record<string, { tally: Ref<ScoreTally>, lastSequence: number, info?: DeviceStreamJudgeInfo }>>({})
const deviceIds = computed(() => Object.values(pools.value).map(p => p.deviceId).filter(id => typeof id === 'string'))

const hic = ref(settings.value.heatInfo)
watch(() => settings.value.heatInfo, newHeatInfo => { hic.value = newHeatInfo })

const heatInfo = useHeatInfo(hic)

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
  enabled: computed(() => deviceIds.value.length > 0 && settings.value.heatInfo?.system !== 'ropescore'),
})
const markStreamSubscriptionAlt = useDeviceStreamMarkAddedSubscription({
  deviceIds: deviceIds as unknown as string[]
}, {
  enabled: computed(() => deviceIds.value.length > 0 && settings.value.heatInfo?.system !== 'ropescore'),
  clientId: 'alternate'
})

const scoresheetIdVars = computed(() => ({
  scoresheetIds: Object.values(heatInfo.pools.value).map(hi => hi.rsScoresheetId).filter(id => id != null)
}))
const markStreamSubscriptionRs = useStreamMarkAddedSubscription(scoresheetIdVars, {
  enabled: computed(() => scoresheetIdVars.value.scoresheetIds.length > 0 && settings.value.heatInfo?.system === 'ropescore'),
})
const markStreamSubscriptionRsAlt = useStreamMarkAddedSubscription(scoresheetIdVars, {
  enabled: computed(() => scoresheetIdVars.value.scoresheetIds.length > 0 && settings.value.heatInfo?.system === 'ropescore'),
  clientId: 'alternate'
})

function markStreamWatcher (res: DeviceStreamMarkAddedSubscription | StreamMarkAddedSubscription | null | undefined) {
  if (!res) return
  let tallyId, sequence, tally, mark, info
  if ('deviceStreamMarkAdded' in res) {
    tallyId = res.deviceStreamMarkAdded.device.id
    sequence = res.deviceStreamMarkAdded.sequence
    tally = res.deviceStreamMarkAdded.tally as ScoreTally
    mark = res.deviceStreamMarkAdded.mark as Mark
    info = res.deviceStreamMarkAdded.info
  } else {
    tallyId = res.streamMarkAdded.scoresheet.id
    sequence = res.streamMarkAdded.sequence
    tally = res.streamMarkAdded.tally as ScoreTally
    mark = res.streamMarkAdded.mark as Mark
  }

  Sentry.setMeasurement('stream_mark_delay', Date.now() - mark.timestamp, 'millisecond')

  let tallyInfo = tallies[tallyId]
  if (!tallyInfo) {
    tallyInfo = {
      tally: ref<ScoreTally>({}),
      lastSequence: 0,
    }
    tallies[tallyId] = tallyInfo
  }

  if (info != null) tallyInfo.info = info

  if (sequence >= tallyInfo.lastSequence) {
    tallyInfo.tally.value = tally
    tallyInfo.lastSequence = sequence
  }
  if (mark.schema === 'clear') {
    tallyInfo.lastSequence = 0
  }
}

watch(markStreamSubscription.result, markStreamWatcher)
watch(markStreamSubscriptionAlt.result, markStreamWatcher)
watch(markStreamSubscriptionRs.result, markStreamWatcher)
watch(markStreamSubscriptionRsAlt.result, markStreamWatcher)

function extendedInfo (row: number, col: number): Partial<(HeatInfo & DeviceStreamJudgeInfo)> | undefined {
  const pool = pools.value[`${row}:${col}`]
  if (pool == null) return undefined
  return {
    ...pool,
    poolLabel: `${pool.label ?? ''}`,
    ...(pool.deviceId && tallies[pool.deviceId]?.info
      ? tallies[pool.deviceId]?.info
      : {}
    ),
    ...(pool.label != null && heatInfo.pools.value[`${pool.label}`] != null
      ? heatInfo.pools.value[pool.label]
      : {}
    )
  }
}
</script>

<style scoped>
.custom-grid {
  grid-template-columns: repeat(v-bind(cols), minmax(0, 1fr));
  grid-template-rows: repeat(v-bind(rows), minmax(0, 1fr));
}
</style>
