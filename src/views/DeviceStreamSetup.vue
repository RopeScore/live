<template>
  <div>
    <div
      v-if="auth.loading.value"
      class="flex justify-center items-center text-2xl"
    >
      Loading
    </div>
  </div>

  <div v-if="auth.token.value" class="container mx-auto">
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
            <text-field
              :model-value="pool.label"
              dense
              label="Pool Label"
              type="number"
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

  <div v-if="!auth.token.value">
    <h1 class="font-semibold text-2xl mt-4">
      Register
    </h1>
    <text-field v-model="newName" label="System name" />

    <div
      class="border-l border-l-4 py-2 px-4 mt-2 bg-blue-100 border-l-blue-300"
    >
      Note that live scoring will send and store data in the cloud,
      Swantzter is the data controller for this and can be reached on
      <a
        class="text-blue-700 hover:text-blue-900 underline"
        href="mailto:privacy@swantzter.se"
        target="_blank"
      >privacy@swantzter.se</a>.
      Please make sure you have read the (short and simple!) privacy policy
      available on
      <a
        class="text-blue-700 hover:text-blue-900 underline"
        href="https://ropescore.com/privacy"
        target="_blank"
      >https://ropescore.com/privacy</a>
    </div>

    <text-button @click="auth.register({ name: newName })">
      Register
    </text-button>
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

import { TextButton, TextField, SelectField, ButtonLink } from '@ropescore/components'
import IconLoading from 'virtual:icons/mdi/loading'

useHead({
  title: 'Device Stream | RopeScore Live'
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
