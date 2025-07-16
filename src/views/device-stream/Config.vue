<template>
  <div class="container mx-auto flex justify-end">
    <text-button :loading="sharesQuery.loading.value" @click="sharesQuery.refetch()">
      Refresh
    </text-button>
  </div>

  <section class="container mx-auto mb-4">
    <h2 class="text-xl">
      Pool Info
    </h2>
    <div>
      <select-field
        :model-value="settings.heatInfo?.system"
        label="Pool Info System"
        :data-list="HEAT_SYSTEMS"
        @update:model-value="setCurrentHeatInfoSystem($event as HeatSystem)"
      />
      <template v-if="settings.heatInfo?.system === 'servo'">
        <text-field
          v-model="settings.heatInfo.baseUrl"
          label="Servo Scoring Base URL"
          type="url"
        />
        <number-field
          v-model="settings.heatInfo.competitionId"
          label="Servo Scoring Competition ID"
          :min="0"
          :step="1"
        />
      </template>

      <template v-else-if="settings.heatInfo?.system === 'ropescore'">
        <select-field
          v-model:model-value="settings.heatInfo.groupId"
          label="Group"
          :data-list="groupItems"
          :disabled="groupsQuery.loading.value"
        />
      </template>
    </div>
  </section>

  <p v-if="settings.heatInfo?.system == null">
    Please select a pool info system above (or none to use device shares)
  </p>

  <template v-else>
    <section v-if="settings.heatInfo?.system === 'none'" class="container mx-auto">
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
          <tr>
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
          </tr>
        </tfoot>
      </table>
      <form id="request-share" @submit.prevent="requestShare.mutate({ deviceId: newDeviceId })" />
    </section>

    <section>
      <div class="container mx-auto flex justify-between items-baseline">
        <h2 class="mt-4 text-xl">
          Screens and Pools
        </h2>
        <div>
          <text-button color="blue" @click="addScreen('grid')">
            New Grid Screen
          </text-button>
          <text-button color="blue" @click="addScreen('ranked-list')">
            New Ranked List Screen
          </text-button>
        </div>
      </div>
      <div v-for="screen, screenId of settings.screens ?? {}" :key="screenId" class="p-4 border-b">
        <div class="container mx-auto flex justify-between items-baseline mt-6">
          <h3 class="text-lg font-bold">
            {{ screen.type === 'ranked-list' ? 'Ranked List' : 'Grid' }} Screen {{ screenId }}
          </h3>
          <div>
            <button-link :to="`/device-stream/display?screen-id=${screenId}&theme=${theme}&key-color=${keyColor}`" target="_blank">
              Show Scores
            </button-link>
            <text-button color="red" @click="removeScreen(screenId)">
              Remove Screen
            </text-button>
          </div>
        </div>

        <template v-if="screen.type === 'ranked-list'">
          <fieldset class="container mx-auto grid grid-cols-2 gap-2">
            <checkbox-field v-model:model-value="screen.topNOnly" label="Only Show top N pools" />
            <number-field v-model:model-value="screen.topN" label="N pools to show" :min="1" :step="1" :max="screen.pools?.length ?? 1" />
          </fieldset>

          <div
            class="container mx-auto"
          >
            <div
              v-for="pool of screen.pools ?? []"
              :key="pool.id"
              class="grid items-end gap-2 p-4"
              :class="{
                'grid-cols-[1fr_max-content]': settings.heatInfo?.system !== 'none',
                'grid-cols-[1fr_1fr_max-content]': settings.heatInfo?.system === 'none',
              }"
            >
              <number-field
                :model-value="pool.label"
                label="Pool #"
                type="number"
                :step="1"
                :min="1"
                @update:model-value="pool.label = $event"
              />
              <select-field
                v-if="settings.heatInfo?.system === 'none'"
                :model-value="pool.deviceId"
                label="Device ID"
                :data-list="acceptedDevices"
                @update:model-value="pool.deviceId = ($event as string)"
              />
              <div>
                <text-button color="red" class="mt-2" @click="removePool(screenId, pool.id)">
                  Delete Pool
                </text-button>
              </div>
            </div>
          </div>
          <div class="flex justify-center">
            <text-button color="blue" @click="addPool(screenId)">
              <icon-plus class="inline-block -mt-1" />
              Add Pool
            </text-button>
          </div>
        </template>
        <template v-else>
          <fieldset class="container mx-auto grid grid-cols-2 gap-2">
            <number-field :model-value="screen.rows" label="Rows" :min="0" :step="1" @update:model-value="changeRows(screenId, $event)" />
            <number-field :model-value="screen.cols" label="Columns" :min="0" :step="1" @update:model-value="changeCols(screenId, $event)" />
          </fieldset>

          <fieldset class="container mx-auto grid grid-cols-2 gap-2">
            <checkbox-field v-model:model-value="screen.hideClock" label="Hide Clock" />
            <checkbox-field v-model:model-value="screen.hideCurrentHeat" label="Hide Current Heat" />
          </fieldset>

          <div class="grid custom-grid mt-4" :style="{ '--cols': screen.cols, '--rows': screen.rows }">
            <template v-for="row of screen.rows ?? 0" :key="row">
              <template v-for="col of screen.cols ?? 0" :key="col">
                <div
                  v-if="screen.pools?.[`${row}:${col}`]"
                  class="p-1 flex flex-col justify-between"
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
                    v-if="settings.heatInfo?.system === 'none'"
                    :model-value="screen.pools[`${row}:${col}`].deviceId"
                    label="Device ID"
                    :data-list="acceptedDevices"
                    @update:model-value="screen.pools[`${row}:${col}`].deviceId = ($event as string)"
                  />
                  <text-button color="red" class="mt-2" @click="removePool(screenId, screen.pools[`${row}:${col}`].id)">
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
        </template>
      </div>
    </section>
  </template>

  <div
    v-if="sharesQuery.error.value"
    class="p-2"
  >
    {{ sharesQuery.error.value }}
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { HEAT_SYSTEMS, useDeviceStreamPools, type HeatSystem } from './use-device-stream-pools'
import { DeviceStreamShareStatus, useGroupsQuery, useRequestStreamShareMutation, useUserStreamSharesQuery } from '../../graphql/generated'
import { useHead } from '@vueuse/head'

import { TextButton, TextField, SelectField, ButtonLink, NumberField, CheckboxField, type DataListItem } from '@ropescore/components'
import IconLoading from 'virtual:icons/mdi/loading'
import IconPlus from 'virtual:icons/mdi/plus'
import useFirebaseAuth from '../../hooks/firebase-auth'
import { useTheme, useKeyColor } from '../../hooks/theme'

useHead({
  title: 'Device Stream'
})

const auth = useFirebaseAuth()

const newDeviceId = ref('')
const theme = useTheme()
const keyColor = useKeyColor()

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

const groupsQuery = useGroupsQuery(() => ({
  fetchPolicy: 'cache-and-network',
  pollInterval: 30_000,
  enabled: auth.isAuthenticated.value
}))
const groups = computed(() => groupsQuery.result.value?.groups.filter(group => !group.completedAt) ?? [])
const groupItems = computed(() => groups.value.map(g => ({ text: g.name, value: g.id }) as DataListItem))

const settings = useDeviceStreamPools()

function setCurrentHeatInfoSystem (system: HeatSystem | undefined) {
  if (settings.value.heatInfo?.system === system) return

  if (system === 'servo') {
    settings.value.heatInfo = {
      system: 'servo',
      baseUrl: 'https://scoring.ijru.sport'
    }
  } else if (system != null) {
    settings.value.heatInfo = {
      system
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

function addScreen (type: 'grid' | 'ranked-list') {
  settings.value.screens ??= {}
  settings.value.screens[crypto.randomUUID()] = type === 'grid'
    ? { type, cols: 2, rows: 2, pools: {} }
    : { type, pools: [] }
}
function removeScreen (screenId: string) {
  if (settings.value.screens?.[screenId] != null) delete settings.value.screens?.[screenId]
}

function changeCols (screenId: string, cols: number) {
  if (cols == null || Number.isNaN(cols)) return
  const screen = settings.value.screens?.[screenId]
  if (screen == null) return
  if (screen.type !== 'grid') return
  screen.cols = cols
  if (screen.pools == null) return
  for (const poolId of (Object.keys(screen.pools) as Array<keyof typeof screen.pools>)) {
    const [, col] = poolId.split(':').map(n => parseInt(n, 10))
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (col > cols) delete screen.pools[poolId]
  }
}
function changeRows (screenId: string, rows: number) {
  if (rows == null || Number.isNaN(rows)) return
  const screen = settings.value.screens?.[screenId]
  if (screen == null) return
  if (screen.type !== 'grid') return
  screen.rows = rows
  if (screen.pools == null) return
  for (const poolId of (Object.keys(screen.pools ?? {}) as Array<keyof typeof screen.pools>)) {
    const [row] = poolId.split(':').map(n => parseInt(n, 10))
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (row > rows) delete screen.pools[poolId]
  }
}

function addPool (screenId: string, ...id: ([] | [row: number, col: number])) {
  const screen = settings.value.screens?.[screenId]
  if (screen == null) return

  if (screen.type === 'grid') {
    screen.pools ??= {}
    screen.pools[`${id[0]}:${id[1]}` as `${number}:${number}`] = { id: crypto.randomUUID() }
  } else {
    screen.pools ??= []
    screen.pools.push({ id: crypto.randomUUID() })
  }
}

function removePool (screenId: string, id: string) {
  const screen = settings.value.screens?.[screenId]
  if (screen?.pools == null) return
  if (screen.type === 'grid') {
    const poolId = Object.entries(screen.pools).find(([, pool]) => pool.id === id)?.[0] as keyof typeof screen.pools
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    if (poolId != null && screen.pools[poolId]) delete screen.pools[poolId]
  } else {
    const poolId = id
    const poolIdx = screen.pools.findIndex(pool => pool.id === poolId)
    if (poolIdx !== -1) screen.pools.splice(poolIdx, 1)
  }
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
