<template>
  <nav>
    <div
      v-if="auth.loading.value"
      class="flex justify-center items-center text-2xl"
    >
      Connecting
    </div>
    <div
      v-else
      class="flex justify-center items-center text-2xl font-bold"
    >
      {{ auth.user.value?.id }}
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { useAuth } from '../hooks/auth'

const auth = useAuth()
</script>
