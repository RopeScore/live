<script setup lang="ts">
import { TextField, TextButton, SelectField } from '@ropescore/components'
import { apiDomain, localManual, localApis } from '../apollo'
import { useAuth } from '../hooks/auth'
import { ref } from 'vue'

const auth = useAuth()

const newName = ref('')
</script>

<template>
  <div
    class="grid  bg-white border-t px-4 items-stretch gap-4"
    :class="{
      'grid-cols-1': !auth.isLoggedIn.value,
      'grid-cols-[max-content,max-content,auto]': auth.isLoggedIn.value
    }"
  >
    <div class="flex items-center gap-2">
      <span>Server: {{ apiDomain }}</span>
      <select-field
        v-model="localManual"
        dense
        label="Preferred Server"
        :data-list="localApis"
        class="min-w-[14ch]"
      />
    </div>

    <p v-if="auth.isLoggedIn.value" class="border-l pl-4 flex items-center">
      System ID: <code class="bg-gray-100 px-2 rounded">{{ auth.loading.value ? 'Loading...' : auth.user.value?.id }}</code>
    </p>

    <form v-if="auth.isLoggedIn.value" class="border-l pl-4 grid grid-cols-[max-content,auto,max-content] gap-2 items-center" @submit.prevent="auth.update({ name: newName })">
      System name:
      <text-field
        :model-value="auth.user.value?.name ?? ''"
        label="System Name"
        dense
        :disabled="auth.loadingUpdate.value"
        @update:model-value="newName = $event ?? ''"
      />
      <text-button color="blue" dense :loading="auth.loadingUpdate.value">
        Update
      </text-button>
    </form>
  </div>
</template>
