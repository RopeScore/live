<template>
  <div class="container mx-auto">
    <div class="flex justify-end">
      <text-button :loading="sharesQuery.loading.value" @click="sharesQuery.refetch()">
        Refresh
      </text-button>
      <button-link to="/device-stream/live">
        Show Scores
      </button-link>
    </div>

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

    <h2 class="text-xl">
      Pool Backgrounds
    </h2>
    <div>
      <select-field
        :model-value="settings.poolBackgrounds?.system"
        label="Pool Backgrounds System"
        :data-list="['servo']"
        @update:model-value="setPoolBackgroundsSystem($event)"
      />
      <text-field
        v-if="settings.poolBackgrounds?.system === 'servo'"
        v-model="settings.poolBackgrounds.baseUrl"
        label="Servo Scoring Base URL"
        type="url"
      />
      <number-field
        v-if="settings.poolBackgrounds?.system === 'servo'"
        v-model="settings.poolBackgrounds.competitionId"
        label="Servo Scoring Competition ID"
        :min="0"
        :step="1"
      />
    </div>

    <h2 class="mt-4 text-xl">
      Pools
    </h2>
    <table class="w-full">
      <thead>
        <tr>
          <th>Pool</th>
          <th class="max-w-30">
            Label
          </th>
          <th>Device</th>
          <th>
            <text-button
              dense
              color="blue"
              :disabled="pools.length >= acceptedDevices.length"
              @click="pools.push({})"
            >
              Add Pool
            </text-button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(pool, idx) of pools" :key="idx">
          <td>{{ idx + 1 }}</td>
          <td>
            <number-field
              :model-value="pool.label"
              dense
              label="Pool Label"
              type="number"
              :step="1"
              :min="1"
              @update:model-value="pool.label = $event"
            />
          </td>
          <td>
            <select-field
              :model-value="pool.deviceId"
              dense
              label="Device ID"
              :data-list="acceptedDevices"
              @update:model-value="pool.deviceId = $event"
            />
          </td>
          <td>
            <text-button dense color="red" @click="pools.splice(idx, 1)">
              Remove Pool
            </text-button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div
    v-if="sharesQuery.error.value"
    class="p-2"
  >
    {{ sharesQuery.error.value }}
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useAuth } from '../hooks/auth'
import { useDeviceStreamPools } from '../hooks/stream-pools'
import { DeviceStreamShareStatus, useRequestStreamShareMutation, useUserStreamSharesQuery } from '../graphql/generated'
import { useHead } from '@vueuse/head'

import { TextButton, TextField, SelectField, ButtonLink, NumberField } from '@ropescore/components'
import IconLoading from 'virtual:icons/mdi/loading'

useHead({
  title: 'Device Stream'
})

const auth = useAuth()

const newName = ref('')
const newDeviceId = ref('')

const sharesQuery = useUserStreamSharesQuery({
  fetchPolicy: 'cache-and-network',
  pollInterval: 30_000,
  enabled: auth.isLoggedIn as unknown as boolean
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

const { pools, settings } = useDeviceStreamPools()

function setPoolBackgroundsSystem (system: string | undefined) {
  if (system === 'servo' && settings.value.poolBackgrounds?.system !== 'servo') {
    settings.value.poolBackgrounds = {
      system: 'servo',
      baseUrl: 'https://scoring.ijru.sport'
    }
  } else {
    settings.value.poolBackgrounds = null
  }
}

// Remove devices you no longer have access to from pools
sharesQuery.onResult(res => {
  if (res.data?.me?.__typename !== 'User') return
  const shares = res.data.me.streamShares.filter(s => s.status === DeviceStreamShareStatus.Accepted)
  const deviceIds = new Set(shares.map(v => v.device.id))

  for (const pool of pools.value) {
    if (pool.deviceId != null && !deviceIds.has(pool.deviceId)) pool.deviceId = undefined
  }
})

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
