<template>
  <div class="mb-4 mx-auto container flex justify-between">
    <div />
    <button-link
      :to="`/qualifiers/display?theme=${theme}`"
    >
      Display
    </button-link>
  </div>

  <div class="mx-auto container grid grid-cols-[max-content] items-center justify-center mt-8">
    <div class="self-center">
      <photo-picker
        v-model="settings.background"
        label="Background image"
      />
    </div>
  </div>

  <div class="grid grid-cols-[auto_max-content] py-4">
    <div class="overflow-x-auto flex flex-row">
      <text-button
        v-for="session, idx of sessions"
        :key="session.id"
        :selected="session.id === selectedSession?.id"
        @click="selectedSession = session"
      >
        {{ session.title ? `${session.title} ${session.subTitle ? `(${session.subTitle})` : ''}`.trim() : `Session ${idx + 1}` }}
      </text-button>
    </div>

    <text-button
      color="blue"
      class="self-end"
      @click="newSession()"
    >
      New Session
    </text-button>
  </div>

  <div
    v-if="selectedSession != null"
    class="container mx-auto"
  >
    <div class="mb-4 flex justify-between">
      <div>
        <text-button color="blue" @click="bc.postMessage(`show:${selectedSession.id}`)">
          Show
        </text-button>
        <text-button @click="bc.postMessage(`show-title:${selectedSession.id}`)">
          Show Title
        </text-button>
        <text-button color="orange" @click="bc.postMessage('hide')">
          Hide
        </text-button>
      </div>
      <text-button color="red" @click="removeSession(selectedSession.id)">
        Remove Session
      </text-button>
    </div>

    <text-field
      v-model="selectedSession.title"
      label="Title (Event name)"
    />
    <text-field
      v-model="selectedSession.subTitle"
      label="Subtitle (Gender category)"
    />

    <div
      class="mx-auto container flex flex-col gap-4 items-center justify-center mt-8"
    >
      <text-button
        color="blue"
        class="self-end"
        @click="newQualifier()"
      >
        New Qualifier
      </text-button>
    </div>

    <div
      v-for="qualifier, idx of selectedSession.qualifiers"
      :key="qualifier.id"
      class="grid grid-cols-[3ch_1fr] gap-2 items-center w-full border-b mb-4 pb-4"
    >
      <div class="text-end">
        {{ idx + 1 }}
      </div>

      <div>
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
          v-for="name, qIdx of qualifier.names"
          :id="`name-${qualifier.id}-${qIdx}`"
          :key="qIdx"
        >
          <text-field
            :model-value="name"
            :label="`Name ${qIdx + 1}`"
            @update:model-value="updateName(qualifier, qIdx, $event)"
            @keyup.enter="focusNextName(qualifier, qIdx)"
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
  </div>
</template>

<script lang="ts" setup>
import { useHead } from '@vueuse/head'
import countries from '../../assets/countries.json'
import { ButtonLink, TextField, TextButton, SelectField } from '@ropescore/components'
import { useTheme } from '../../hooks/theme'
import { useQualifiers, type Qualifier, type QualifierSession } from './use-qualifiers'
import PhotoPicker from '../../components/PhotoPicker.vue'
import { nextTick, ref } from 'vue'

useHead({
  title: 'Qualifiers'
})

const theme = useTheme()
const { settings, sessions } = useQualifiers()
const bc = new BroadcastChannel('rs-qualifiers')

const countriesList = countries.map(c => ({ text: c.name, value: c.code }))

const selectedSession = ref<QualifierSession>(sessions.value?.[0])

function newSession () {
  const newSession = { id: crypto.randomUUID(), qualifiers: [] }
  sessions.value.push(newSession)
  if (sessions.value.length === 1) selectedSession.value = newSession
}
function removeSession (sessionId: string) {
  const idx = sessions.value.findIndex(s => s.id === sessionId)
  if (idx !== -1) sessions.value.splice(idx, 1)
}

function newQualifier () {
  selectedSession.value?.qualifiers.push({ id: crypto.randomUUID(), names: [] })
}
function removeQualifier (id: string) {
  const idx = selectedSession.value?.qualifiers.findIndex(q => q.id === id)
  if (idx != null && idx !== -1) selectedSession.value?.qualifiers.splice(idx, 1)
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

function focusNextName (qualifier: Qualifier, currentIdx: number) {
  const next = document.querySelector<HTMLInputElement>(`#name-${qualifier.id}-${currentIdx + 1} input`) ??
    document.querySelector<HTMLInputElement>(`#name-${qualifier.id}-new input`)
  next?.focus()
}
</script>
