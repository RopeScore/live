<script setup lang="ts">
import { SelectField } from '@ropescore/components'
import { apiDomain, localManual, localApis } from '../apollo'
import useFirebaseAuth from '../hooks/firebase-auth'
import { keyColors, themes, useKeyColor, useTheme } from '../hooks/theme'

const auth = useFirebaseAuth()

const theme = useTheme()
const keyColor = useKeyColor()
</script>

<template>
  <div
    class="
      grid bg-white border-t items-stretch
      grid-rows-4 sm:grid-rows-2 xl:grid-rows-1
      grid-cols-1 sm:grid-cols-[max-content_auto] xl:grid-cols-[max-content_max-content_max-content_auto]"
  >
    <div class="flex items-center px-4 gap-2 lt-xl:border-b">
      <span>Server: {{ apiDomain }}</span>
      <select-field
        v-model="localManual"
        dense
        label="Preferred Server"
        :data-list="localApis"
        class="!min-w-[12ch]"
      />
    </div>
    <p v-if="auth.isAuthenticated.value" class="border-l lt-xl:border-b px-4 flex items-center">
      User ID: <code class="bg-gray-100 px-2 rounded">{{ auth.userLoading.value ? 'Loading...' : auth.user.value?.id }}</code>
    </p>
    <p v-else />

    <div class="xl:border-l lt-sm:border-b px-4 flex items-center gap-2">
      <span>Theme:</span>
      <select-field
        v-model="theme"
        dense
        label="Theme"
        :data-list="themes"
      />
    </div>
    <div class="border-l no-wrap px-4 flex items-center gap-2">
      <span>Key Color:</span>
      <select-field
        v-model="keyColor"
        dense
        label="Key color"
        :data-list="keyColors"
      />
    </div>
  </div>
</template>
