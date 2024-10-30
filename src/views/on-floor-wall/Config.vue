<template>
  <div class="mb-4 mx-auto container flex justify-between">
    <div />
    <button-link
      :to="`/on-floor-wall/display?theme=${theme}`"
      :disabled="settings.heatInfo?.system == null || settings.heatInfo?.competitionId == null"
    >
      Display
    </button-link>
  </div>

  <section class="container mx-auto">
    <h2 class="text-xl">
      Heat Info
    </h2>
    <div>
      <select-field
        :model-value="settings.heatInfo?.system"
        label="Heat Info System"
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

  <section class="mx-auto container flex justify-center mt-8">
    <div>
      <photo-picker
        v-model="settings.background"
        label="Background image"
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { SelectField, NumberField, TextField, ButtonLink } from '@ropescore/components'
import { useHead } from '@vueuse/head'
import PhotoPicker from '../../components/PhotoPicker.vue'
import { useTheme } from '../../hooks/theme'
import { useOnFloorWallSettings } from './use-on-floor-wall'

useHead({
  title: 'On Floor Wall'
})

const theme = useTheme()
const settings = useOnFloorWallSettings()

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
</script>
