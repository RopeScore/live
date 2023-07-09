<template>
  <div class="mb-4 mx-auto container flex justify-between">
    <div>
      <text-button color="blue" @click="bc.postMessage('raise')">
        Raise
      </text-button>
      <text-button color="orange" @click="bc.postMessage('lower')">
        Lower
      </text-button>
    </div>
    <button-link to="/podium/live">
      Display
    </button-link>
  </div>

  <div class="grid grid-cols-3 gap-6">
    <div v-for="pos in positions" :key="pos">
      <h2
        class="text-center text-2xl font-bold"
        :class="{
          'mt-8': pos === '2nd',
          'mt-16': pos === '3rd'
        }"
      >
        {{ pos }}
      </h2>

      <div v-for="(flag, idx) of state[pos]" :key="idx + flag" class="grid grid-cols-4">
        <select-field
          v-model="state[pos][idx]"
          class="col-span-3"
          label="Country"
          :data-list="countriesList"
        />
        <text-button color="red" @click="state[pos].splice(idx, 1)">
          Delete
        </text-button>
      </div>

      <div class="grid grid-cols-4">
        <select-field
          :model-value="addNew[pos].value"
          class="col-span-3"
          label="Country"
          :data-list="countriesList"
          @update:model-value="addNewFn(pos, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'

import countries from '../assets/countries.json'
import { TextButton, SelectField, ButtonLink } from '@ropescore/components'
import { useHead } from '@vueuse/head'

useHead({
  title: 'Podium | RopeScore Live'
})

const bc = new BroadcastChannel('rs-podium')

const positions = ['2nd', '1st', '3rd'] as const
const state = useLocalStorage<Record<'1st' | '2nd' | '3rd', string[]>>('rs-podium', { '1st': [], '2nd': [], '3rd': [] })

const countriesList = countries.map(c => ({ text: c.name, value: c.code }))

const addNew = {
  '1st': ref<string | undefined>(undefined),
  '2nd': ref<string | undefined>(undefined),
  '3rd': ref<string | undefined>(undefined)
}

function addNewFn (pos: typeof positions[number], code: string) {
  if (!code) return

  addNew[pos].value = code
  state.value[pos].push(code)
  nextTick(() => {
    addNew[pos].value = undefined
  })
}
</script>
