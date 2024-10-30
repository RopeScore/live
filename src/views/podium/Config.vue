<template>
  <div class="mb-4 mx-auto container flex justify-between">
    <div>
      <text-button color="blue" @click="bc.postMessage('raise')">
        Raise
      </text-button>
      <text-button color="orange" @click="bc.postMessage('lower')">
        Lower
      </text-button>
      <text-button @click="bc.postMessage('update-title')">
        Title
      </text-button>
    </div>
    <button-link :to="`/podium/display?theme=${theme}`">
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

      <div v-for="(flag, idx) of state[pos]" :key="idx + flag" class="grid grid-cols-[auto_max-content] items-baseline">
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

      <div class="grid grid-cols-1">
        <select-field
          :model-value="addNew[pos].value"
          class="col-span-3"
          label="Country"
          :data-list="countriesList"
          @update:model-value="addNewFn(pos, $event as string)"
        />
      </div>
    </div>
  </div>

  <div class="mx-auto container grid grid-cols-[max-content] items-center justify-center mt-8">
    <div>
      <p class="font-semibold pt-4">
        Title
      </p>
      <checkbox-field
        :model-value="settings.withTitle"
        label="Add title"
        @update:model-value="setWithTitle($event)"
      />
      <text-field
        v-if="settings.withTitle"
        v-model="settings.title"
        label="Title"
      />
    </div>
    <div class="self-center">
      <photo-picker
        v-model="settings.background"
        label="Background image"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import countries from '../../assets/countries.json'
import { TextButton, SelectField, ButtonLink, CheckboxField, TextField } from '@ropescore/components'
import { useHead } from '@vueuse/head'
import { usePodium } from './use-podium'
import PhotoPicker from '../../components/PhotoPicker.vue'
import { useTheme } from '../../hooks/theme'

useHead({
  title: 'Podium'
})

const bc = new BroadcastChannel('rs-podium')

const positions = ['2nd', '1st', '3rd'] as const
const { podium: state, settings } = usePodium()
const theme = useTheme()

const countriesList = countries.map(c => ({ text: c.name, value: c.code }))

const addNew = {
  '1st': ref<string | undefined>(),
  '2nd': ref<string | undefined>(),
  '3rd': ref<string | undefined>()
}

async function addNewFn (pos: typeof positions[number], code: string) {
  if (!code) return

  addNew[pos].value = code
  state.value[pos].push(code)
  await nextTick(() => {
    addNew[pos].value = undefined
  })
}

function setWithTitle (withTitle: boolean) {
  settings.value.withTitle = withTitle
  if (!withTitle) settings.value.title = undefined
}
</script>
