<template>
  <div v-if="auth.isLoggedIn" class="max-w-80 flex flex-row items-baseline">
    <text-field
      :model-value="auth.user.value?.name ?? ''"
      label="System Name"
      :disabled="loading"
      @update:model-value="newName = $event"
    />
    <text-button color="blue" :loading="loading" @click="auth.update({ name: newName })">
      Update
    </text-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../hooks/auth'

import { TextField, TextButton } from '@ropescore/components'
import { useGlobalMutationLoading } from '@vue/apollo-composable'

const auth = useAuth()

const loading = useGlobalMutationLoading()

const newName = ref('')
</script>
