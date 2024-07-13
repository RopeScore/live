<script setup lang="ts">
import { TextField, TextButton, SelectField } from '@ropescore/components'
import { apiDomain, localManual, localApis } from '../apollo'
import { ref } from 'vue'
import useFirebaseAuth from '../hooks/firebase-auth'

const auth = useFirebaseAuth()

const newName = ref('')
</script>

<template>
  <div
    class="grid bg-white border-t px-4 items-stretch gap-4"
    :class="{
      'grid-cols-1': !auth.isAuthenticated.value,
      'grid-cols-[max-content_max-content_auto]': auth.isAuthenticated.value
    }"
  >
    <div class="flex items-center gap-2">
      <span>Server: {{ apiDomain }}</span>
      <select-field
        v-model="localManual"
        dense
        label="Preferred Server"
        :data-list="localApis"
        class="!min-w-[12ch]"
      />
    </div>

    <p v-if="auth.isAuthenticated.value" class="border-l pl-4 flex items-center">
      User ID: <code class="bg-gray-100 px-2 rounded">{{ auth.userLoading.value ? 'Loading...' : auth.user.value?.id }}</code>
    </p>

    <!-- <form v-if="auth.isAuthenticated.value" class="border-l pl-4 grid grid-cols-[max-content_auto_max-content_max-content] gap-2 items-center" @submit.prevent="auth.update({ name: newName })">
      System name:
      <text-field
        :model-value="auth.user.value?.name ?? ''"
        label="System Name"
        dense
        :disabled="auth.userLoading.value"
        @update:model-value="newName = ($event as string ?? '')"
      />
      <text-button color="blue" dense :loading="auth.userLoading.value">
        Update
      </text-button>
      <text-button color="orange" dense :loading="auth.userLoading.value" type="button" @click="auth.logout()">
        Log out
      </text-button>
    </form> -->
  </div>
</template>
