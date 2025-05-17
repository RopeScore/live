<template>
  <div
    v-if="screen == null"
    class="flex justify-center items-center"
    :class="{
      'bg-white text-black': theme !== 'dark',
      'bg-black text-white': theme === 'dark',
    }"
  >
    This screen cannot be found.
  </div>
  <div
    v-else-if="screen?.type === 'grid'"
    class="grid grid-rows-1"
    :class="{
      'bg-green-500': keyColor === 'green',
      'bg-blue-500': keyColor === 'blue',
      'bg-white': keyColor === 'theme' && theme !== 'dark',
      'bg-black': keyColor === 'theme' && theme === 'dark',

      'text-black': theme !== 'dark',
      'text-white': theme === 'dark',
    }"
  >
    <div
      v-if="freeCorner !== 'none'"
      class="absolute flex flex-col"
      :class="{
        'top-4 right-4 items-end': freeCorner === 'top-right',
        'bottom-4 right-4 items-end': freeCorner === 'bottom-right',
        'top-4 left-4 items-start': freeCorner === 'top-left',
        'bottom-4 left-4 items-start': freeCorner === 'bottom-left'
      }"
    >
      <div v-if="!screen?.hideClock" class="font-bold text-8xl">
        {{ clock }}
      </div>
      <div v-if="!screen?.hideCurrentHeat && heatInfo.currentHeat.value">
        <span class="text-5xl">heat&nbsp;</span>
        <span class="text-8xl font-bold">{{ heatInfo.currentHeat.value }}</span>
      </div>
    </div>

    <main v-if="!Array.isArray(pools)" class="grid custom-grid">
      <template v-for="row of screen?.rows ?? 0" :key="row">
        <template v-for="col of screen?.cols ?? 0" :key="col">
          <div v-if="pools[`${row}:${col}`] == null" />
          <template v-else>
            <device-not-set v-if="settings.heatInfo?.system !== 'ropescore' && !pools[`${row}:${col}`].deviceId" :pool="pools[`${row}:${col}`].label" :theme="theme" />
            <unsupported-competition-event
              v-else-if="tallies[getTallyId(extendedInfo[pools[`${row}:${col}`].id])!]?.shownScore === 'unsupported'"
              :pool="pools[`${row}:${col}`].label"
              :info="extendedInfo[pools[`${row}:${col}`].id]"
              :theme="theme"
            />
            <live-score
              v-else
              :pool="pools[`${row}:${col}`].label"
              :score="tallies[getTallyId(extendedInfo[pools[`${row}:${col}`].id])!]?.shownScore as number"
              :info="extendedInfo[pools[`${row}:${col}`].id]"
              :cols="cols"
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

  <div
    v-else-if="screen?.type === 'ranked-list'"
    :class="{
      'bg-green-500': keyColor === 'green',
      'bg-blue-500': keyColor === 'blue',
      'bg-white': keyColor === 'theme' && theme !== 'dark',
      'bg-black': keyColor === 'theme' && theme === 'dark',

      'text-black': theme !== 'dark',
      'text-white': theme === 'dark',
    }"
  >
    <transition-group name="pools" tag="main" class="grid custom-grid h-full">
      <template v-for="pool of rankedPools" :key="pool.id">
        <device-not-set v-if="settings.heatInfo?.system !== 'ropescore' && !pool.deviceId" :pool="pool.label" :theme="theme" row />
        <unsupported-competition-event
          v-else-if="tallies[getTallyId(extendedInfo[pool.id])!]?.shownScore === 'unsupported'"
          :pool="pool.label"
          :info="extendedInfo[pool.id]"
          :theme="theme"
          row
        />
        <live-score
          v-else
          :pool="pool.label"
          :score="tallies[getTallyId(extendedInfo[pool.id])!]?.shownScore as number"
          :info="extendedInfo[pool.id]"
          :cols="cols"
          :theme="theme"
          row
        />
      </template>
    </transition-group>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch, type Ref, type UnwrapRef } from 'vue'
import { type DeviceStreamJudgeInfo, type DeviceStreamMarkAddedSubscription, type StreamMarkAddedSubscription, useDeviceStreamMarkAddedSubscription, useStreamMarkAddedSubscription } from '../../graphql/generated'
import { type ScoreTally, type Mark } from '../../helpers'
import { useDeviceStreamPools, type StreamPool } from './use-device-stream-pools'
import { useHead } from '@vueuse/head'
import { useRouteQuery } from '@vueuse/router'
import { useKeyColor, useTheme } from '../../hooks/theme'
import { useDateFormat, useThrottleFn, useTimestamp } from '@vueuse/core'
import * as Sentry from '@sentry/vue'

import DeviceNotSet from '../../components/DeviceNotSet.vue'
import LiveScore from '../../components/LiveScore.vue'
import UnsupportedCompetitionEvent from '../../components/UnsupportedCompetitionEvent.vue'
import { useHeatInfo } from '../../hooks/heat-info'

useHead({
  title: '📺 Device Stream (Live)'
})

const keyColor = useKeyColor()

const settings = useDeviceStreamPools()
const screenId = useRouteQuery<string>('screen-id')
const theme = useTheme()
const clock = useDateFormat(useTimestamp({ interval: 300 }), 'HH:mm')

const screen = computed(() => screenId.value == null ? null : settings.value.screens?.[screenId.value])
const cols = computed(() => screen.value?.type !== 'grid' || screen.value?.rows === 0 ? 1 : screen.value?.cols ?? 1)
const rows = computed(() => {
  if (screen.value?.type === 'grid') return screen.value?.rows === 0 ? 1 : screen.value?.rows ?? 1
  else return rankedPools.value.length
})
const pools = computed(() => screen.value?.type === 'grid' ? screen.value?.pools ?? {} : screen.value?.pools ?? [])

const tallies = reactive<Record<string, { tally: Ref<ScoreTally>, lastSequence: number, info?: DeviceStreamJudgeInfo, shownScore: number | 'unsupported' }>>({})
const deviceIds = computed(() => Object.values(pools.value).map(p => p.deviceId).filter(id => typeof id === 'string'))

const hic = ref(settings.value.heatInfo)
watch(() => settings.value.heatInfo, newHeatInfo => { hic.value = newHeatInfo })

const heatInfo = useHeatInfo(hic)

const freeCorner = computed(() => {
  if (screen.value?.type === 'grid' && !Array.isArray(pools.value)) {
    if (pools.value[`1:${cols.value}`] == null) return 'top-right'
    if (pools.value[`${rows.value}:${cols.value}`] == null) return 'bottom-right'
    if (pools.value['1:1'] == null) return 'top-left'
    if (pools.value[`${rows.value}:1`] == null) return 'bottom-left'
    else return 'top-right'
  } else return 'none'
})

const rankedPools = ref<StreamPool[]>([])
watch(() => [screen.value?.type, screen.value?.pools] as const, ([type, pools]) => {
  if (type === 'ranked-list' && Array.isArray(pools)) rankedPools.value = [...pools]
  else rankedPools.value = []
}, { immediate: true })
const sortRankedPools = useThrottleFn(() => {
  rankedPools.value.sort((a, b) => {
    const scoreA = tallies[getTallyId(extendedInfo.value[a.id])!]?.shownScore
    const scoreB = tallies[getTallyId(extendedInfo.value[b.id])!]?.shownScore

    if (typeof scoreA === 'number' && typeof scoreB === 'number') {
      if (scoreA === scoreB) return 0
      else if (extendedInfo.value[a.id].judgeType === 'T') return scoreA - scoreB
      else return scoreB - scoreA
    } else {
      if (scoreA === scoreB) return (a.label ?? Infinity) - (b.label ?? Infinity)
      else if (typeof scoreA !== 'number') return 1
      else if (typeof scoreB !== 'number') return -1
      else return 0
    }
  })
}, 250, true)

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
      shownScore: 0,
    }
    tallies[tallyId] = tallyInfo
  }

  if (info != null) tallyInfo.info = info

  if (sequence >= tallyInfo.lastSequence) {
    tallyInfo.tally.value = tally
    tallyInfo.lastSequence = sequence

    if (info?.judgeType == null || ['S', 'Shj'].includes(info.judgeType)) {
      tallyInfo.shownScore = tally.step ?? 0
    } else if (info.judgeType === 'T') {
      tallyInfo.shownScore = tally.seconds ?? 0
    } else {
      tallyInfo.shownScore = 'unsupported'
    }
  }
  if (mark.schema === 'clear') {
    tallyInfo.lastSequence = 0
  }

  if (screen.value?.type === 'ranked-list') void sortRankedPools()
}

watch(markStreamSubscription.result, markStreamWatcher)
watch(markStreamSubscriptionAlt.result, markStreamWatcher)
watch(markStreamSubscriptionRs.result, markStreamWatcher)
watch(markStreamSubscriptionRsAlt.result, markStreamWatcher)

const extendedInfo = computed(() => {
  const poolsArr = Array.isArray(pools.value) ? pools.value : Object.values(pools.value)
  return Object.fromEntries(poolsArr.map(pool => [pool.id, {
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
  }]))
})

function getTallyId (exInfo: UnwrapRef<typeof extendedInfo>[string]) {
  return exInfo.rsScoresheetId ?? exInfo.deviceId
}
</script>

<style scoped>
.custom-grid {
  grid-template-columns: repeat(v-bind(cols), minmax(0, 1fr));
  grid-template-rows: repeat(v-bind(rows), minmax(0, 1fr));
}

.pools-move {
  transition: all 0.25s ease;
}
</style>
