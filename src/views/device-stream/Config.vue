<template>
  <div class="container mx-auto flex justify-end">
    <text-button :loading="sharesQuery.loading.value" @click="sharesQuery.refetch()">
      Refresh
    </text-button>
  </div>

  <section class="container mx-auto">
    <h2 class="text-xl">
      Device Shares
    </h2>
    <table class="w-full">
      <thead>
        <tr>
          <th>Device ID</th>
          <th>Device Name</th>
          <th>Battery</th>
          <th class="relative">
            Last Battery Status
            <span v-if="sharesQuery.loading.value" class="absolute right-1 top-1">
              <icon-loading class="animate-spin" />
            </span>
          </th>
          <th>Request Status</th>
          <th>Expires</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="share of shares" :key="share.id">
          <td>{{ share.device.id }}</td>
          <td>{{ share.device.name }}</td>
          <td
            v-if="share.device.battery"
            class="min-w-[10ch] text-right"
            :class="{
              'bg-green-300': share.device.battery.batteryLevel > 30,
              'bg-orange-200': share.device.battery.batteryLevel <= 30 && share.device.battery.batteryLevel > 15,
              'bg-red-200': share.device.battery.batteryLevel <= 15,
            }"
          >
            {{ share.device.battery.batteryLevel }} %
          </td>
          <td v-else class="bg-gray-200" />

          <td v-if="share.device.battery" :class="{ 'bg-orange-200': tooLongAgo(share.device.battery.updatedAt) }">
            <relative-time :datetime="toISO(share.device.battery.updatedAt)">
              {{ toISO(share.device.battery.updatedAt) }}
            </relative-time>
            <span v-if="!share.device.battery.automatic"> (manual)</span>
          </td>
          <td v-else class="bg-gray-200">
            never
          </td>
          <td
            :class="{
              'bg-orange-300': share.status === DeviceStreamShareStatus.Pending,
              'bg-green-300': share.status === DeviceStreamShareStatus.Accepted
            }"
          >
            {{ share.status }}
          </td>
          <td :class="{ 'bg-orange-200': expiresSoon(share.expiresAt) }">
            <relative-time :datetime="toISO(share.expiresAt)">
              {{ toISO(share.expiresAt) }}
            </relative-time>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <td colspan="4">
          <text-field v-model="newDeviceId" form="request-share" label="Device ID" dense />
        </td>
        <td colspan="2">
          <text-button
            color="blue"
            dense
            :loading="requestShare.loading.value"
            form="request-share"
          >
            Request Share
          </text-button>
        </td>
      </tfoot>
    </table>
    <form id="request-share" @submit.prevent="requestShare.mutate({ deviceId: newDeviceId })" />
  </section>

  <section class="container mx-auto">
    <h2 class="text-xl">
      Pool Backgrounds
    </h2>
    <div>
      <select-field
        :model-value="settings.heatInfo?.system"
        label="Pool Backgrounds System"
        :data-list="['servo']"
        @update:model-value="setCurrentHeatInfoSystem($event as string)"
      />
      <text-field
        v-if="settings.heatInfo?.system === 'servo'"
        v-model="settings.heatInfo.baseUrl"
        label="Servo Scoring Base URL"
        type="url"
      />
      <number-field
        v-if="settings.heatInfo?.system === 'servo'"
        v-model="settings.heatInfo.competitionId"
        label="Servo Scoring Competition ID"
        :min="0"
        :step="1"
      />
    </div>
  </section>

  <section>
    <div class="container mx-auto flex justify-between items-baseline">
      <h2 class="mt-4 text-xl">
        Screens and Pools
      </h2>
      <text-button color="blue" @click="addScreen">
        New Screen
      </text-button>
    </div>
    <div v-for="screen, screenId of settings.screens ?? {}" :key="screenId">
      <div class="container mx-auto flex justify-between items-baseline mt-6">
        <h3 class="text-lg font-bold">
          Screen {{ screenId }}
        </h3>
        <div>
          <button-link :to="`/device-stream/display?screen-id=${screenId}&theme=${theme}`" target="_blank">
            Show Scores
          </button-link>
          <text-button color="red" @click="removeScreen(screenId)">
            Remove Screen
          </text-button>
        </div>
      </div>

      <fieldset class="container mx-auto grid grid-cols-2 gap-2">
        <number-field :model-value="screen.rows" label="Rows" :min="0" :step="1" @update:model-value="changeRows(screenId, $event)" />
        <number-field :model-value="screen.cols" label="Columns" :min="0" :step="1" @update:model-value="changeCols(screenId, $event)" />
      </fieldset>

      <div class="grid custom-grid mt-4" :style="{ '--cols': screen.cols, '--rows': screen.rows }">
        <template v-for="row of screen.rows ?? 0" :key="row">
          <template v-for="col of screen.cols ?? 0" :key="col">
            <div
              v-if="screen.pools?.[`${row}:${col}`]"
              class="p-1"
              :class="{
                'border-b': row !== screen.rows,
                'border-r': col !== screen.cols,
              }"
            >
              <number-field
                :model-value="screen.pools[`${row}:${col}`].label"
                label="Pool #"
                type="number"
                :step="1"
                :min="1"
                @update:model-value="screen.pools[`${row}:${col}`].label = $event"
              />
              <select-field
                :model-value="screen.pools[`${row}:${col}`].deviceId"
                label="Device ID"
                :data-list="acceptedDevices"
                @update:model-value="screen.pools[`${row}:${col}`].deviceId = ($event as string)"
              />
              <text-button color="red" class="mt-2" @click="removePool(screenId, row, col)">
                Disable Pool
              </text-button>
            </div>
            <div
              v-else
              class="p-1 flex flex-row justify-center items-center bg-gray-100"
              :class="{
                'border-b': row !== screen.rows,
                'border-r': col !== screen.cols,
              }"
            >
              <text-button color="blue" @click="addPool(screenId, row, col)">
                <icon-plus class="inline-block -mt-1" />
                Enable Pool
              </text-button>
            </div>
          </template>
        </template>
      </div>
    </div>
  </section>

  <div
    v-if="sharesQuery.error.value"
    class="p-2"
  >
    {{ sharesQuery.error.value }}
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useDeviceStreamPools } from './use-device-stream-pools'
import { DeviceStreamShareStatus, useRequestStreamShareMutation, useUserStreamSharesQuery } from '../../graphql/generated'
import { useHead } from '@vueuse/head'

import { TextButton, TextField, SelectField, ButtonLink, NumberField } from '@ropescore/components'
import IconLoading from 'virtual:icons/mdi/loading'
import IconPlus from 'virtual:icons/mdi/plus'
import useFirebaseAuth from '../../hooks/firebase-auth'
import { useTheme } from '../../hooks/theme'

useHead({
  title: 'Device Stream'
})

const auth = useFirebaseAuth()

const newDeviceId = ref('')
const theme = useTheme()

const sharesQuery = useUserStreamSharesQuery({
  fetchPolicy: 'cache-and-network',
  pollInterval: 30_000,
  enabled: auth.isAuthenticated as unknown as boolean
})
const shares = computed(() => sharesQuery.result.value?.me?.__typename === 'User' ? sharesQuery.result.value.me.streamShares : [])

const acceptedDevices = computed(() => shares.value.filter(s => s.status === DeviceStreamShareStatus.Accepted).map(s => ({ text: `${s.device.id} ${s.device.name ? `(${s.device.name})` : ''}`, value: s.device.id })))

const requestShare = useRequestStreamShareMutation({
  refetchQueries: ['UserStreamShares'],
  awaitRefetchQueries: true
})
requestShare.onDone(() => {
  newDeviceId.value = ''
})

const settings = useDeviceStreamPools()

function setCurrentHeatInfoSystem (system: string | undefined) {
  if (system === 'servo' && settings.value.heatInfo?.system !== 'servo') {
    settings.value.heatInfo = {
      system: 'servo',
      baseUrl: 'https://scoring.ijru.sport'
    }
  } else {
    settings.value.heatInfo = undefined
  }
}

// Remove devices you no longer have access to from pools
sharesQuery.onResult(res => {
  if (res.data?.me?.__typename !== 'User') return
  const shares = res.data.me.streamShares.filter(s => s.status === DeviceStreamShareStatus.Accepted)
  const deviceIds = new Set(shares.map(v => v.device.id))

  for (const screen of Object.values(settings.value.screens ?? {})) {
    for (const pool of Object.values(screen.pools ?? {})) {
      if (pool.deviceId != null && !deviceIds.has(pool.deviceId)) pool.deviceId = undefined
    }
  }
})

function addScreen () {
  settings.value.screens ??= {}
  settings.value.screens[crypto.randomUUID()] = { cols: 2, rows: 2, pools: {} }
}
function removeScreen (screenId: string) {
  if (settings.value.screens?.[screenId] != null) delete settings.value.screens?.[screenId]
}

function changeCols (screenId: string, cols: number) {
  if (cols == null || Number.isNaN(cols)) return
  const screen = settings.value.screens?.[screenId]
  if (screen == null) return
  screen.cols = cols
  if (screen.pools == null) return
  for (const poolId of (Object.keys(screen.pools) as Array<keyof typeof screen.pools>)) {
    const [row, col] = poolId.split(':').map(n => parseInt(n, 10))
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (col > cols) delete screen.pools[poolId]
  }
}
function changeRows (screenId: string, rows: number) {
  if (rows == null || Number.isNaN(rows)) return
  const screen = settings.value.screens?.[screenId]
  if (screen == null) return
  screen.rows = rows
  if (screen.pools == null) return
  for (const poolId of (Object.keys(screen.pools ?? {}) as Array<keyof typeof screen.pools>)) {
    const [row, col] = poolId.split(':').map(n => parseInt(n, 10))
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (row > rows) delete screen.pools[poolId]
  }
}

function addPool (screenId: string, row: number, col: number) {
  const screen = settings.value.screens?.[screenId]
  if (screen == null) return
  screen.pools ??= {}
  screen.pools[`${row}:${col}`] = {}
}
function removePool (screenId: string, row: number, col: number) {
  const screen = settings.value.screens?.[screenId]
  if (screen?.pools == null) return
  const poolId = `${row}:${col}` as const
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  if (screen.pools[poolId]) delete screen.pools[poolId]
}

function toISO (ts: number | Date) {
  return new Date(ts).toISOString()
}

function tooLongAgo (ts: number) {
  return ts < Date.now() - (1000 * 60 * 30) // 30 min
}

function expiresSoon (ts: number) {
  return ts < Date.now() + (1000 * 60 * 60) // 1h
}
</script>

<style scoped>
.custom-grid {
  grid-template-rows: repeat(var(--rows, 0), minmax(10rem, 1fr));
  grid-template-columns: repeat(var(--cols, 0), minmax(0, 1fr));
}
</style>
