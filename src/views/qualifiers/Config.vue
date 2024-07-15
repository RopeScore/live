<template>
  <div class="mb-4 mx-auto container flex justify-between">
    <div>
      <text-button color="blue" @click="bc.postMessage('show')">
        Show
      </text-button>
      <text-button color="orange" @click="bc.postMessage('hide')">
        Hide
      </text-button>
    </div>
    <button-link
      :to="`/qualifiers/display?theme=${theme}`"
    >
      Display
    </button-link>
  </div>

  <div class="mx-auto container grid grid-cols-[max-content] items-center justify-center mt-8">
    <div>
      <text-field
        v-model="settings.title"
        label="Title (Event name)"
      />
      <text-field
        v-model="settings.subTitle"
        label="Subtitle (Gender category)"
      />
    </div>

    <div class="self-center">
      <photo-picker
        v-model="settings.background"
        label="Background image"
      />
    </div>
  </div>

  <div class="mx-auto container flex flex-col gap-4 items-center justify-center mt-8">
    <text-button
      color="blue"
      class="self-end"
      @click="newQualifier()"
    >
      New Qualifier
    </text-button>

    <div v-for="qualifier of qualifiers" :key="qualifier.id" class="w-full border-b mb-4 pb-4">
      <div class="flex justify-end">
        <text-button
          color="red"
          @click="removeQualifier(qualifier.id)"
        >
          Remove Qualifier
        </text-button>
      </div>

      <select-field
        v-model="qualifier.countryCode"
        label="Country"
        :data-list="countriesList"
      />

      <div
        v-for="name, idx of qualifier.names"
        :id="`name-${qualifier.id}-${idx}`"
        :key="idx"
      >
        <text-field
          :model-value="name"
          :label="`Name ${idx + 1}`"
          @update:model-value="updateName(qualifier, idx, $event)"
        />
      </div>

      <div
        :id="`name-${qualifier.id}-new`"
      >
        <text-field
          v-model="newName"
          label="New Name"
          @update:model-value="addName(qualifier, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useHead } from '@vueuse/head'
import countries from '../../assets/countries.json'
import { ButtonLink, TextField, TextButton, SelectField } from '@ropescore/components'
import { useTheme } from '../../hooks/theme'
import { useQualifiers, type Qualifier } from './use-qualifiers'
import PhotoPicker from '../../components/PhotoPicker.vue'
import { nextTick, ref } from 'vue'

useHead({
  title: 'Qualifiers'
})

const theme = useTheme()
const { settings, qualifiers } = useQualifiers()
const bc = new BroadcastChannel('rs-qualifiers')

const countriesList = countries.map(c => ({ text: c.name, value: c.code }))

function newQualifier () {
  qualifiers.value.push({ id: crypto.randomUUID(), names: [] })
}
function removeQualifier (id: string) {
  const idx = qualifiers.value.findIndex(q => q.id === id)
  if (idx !== -1) qualifiers.value.splice(idx, 1)
}

function updateName (qualifier: Qualifier, nameIdx: number, name: string | number) {
  if (typeof name !== 'string' || name == null || name.trim() === '')  {
    qualifier.names.splice(nameIdx, 1)
    const next = document.querySelector<HTMLInputElement>(`#name-${qualifier.id}-${nameIdx - 1} input`) ??
      document.querySelector<HTMLInputElement>(`#name-${qualifier.id}-new input`)
    next?.focus()
  } else {
    qualifier.names.splice(nameIdx, 1, name)
  }
}

const newName = ref('')
function addName (qualifier: Qualifier, name: string | number) {
  if (typeof name !== 'string') return
  qualifier.names.push(name)
  nextTick(() => {
    document.querySelector<HTMLInputElement>(`#name-${qualifier.id}-${qualifier.names.length - 1} input`)?.focus()
    newName.value = ''
  })
}
</script>
