<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuth } from '../hooks/auth'
import { TextButton, TextField } from '@ropescore/components'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuth()
const newName = ref('')

const route = useRoute()
const router = useRouter()

watch(auth.user, newUser => {
  if (newUser) {
    const returnTo = route.query['return-to'] as string | undefined
    router.replace(returnTo ? decodeURIComponent(returnTo) : '/')
  }
})
</script>

<template>
  <form v-if="!auth.token.value" class="mx-auto container" @submit.prevent="auth.register({ name: newName })">
    <h1 class="font-semibold text-2xl mt-4">
      Register
    </h1>
    <text-field v-model="newName" label="System name" />

    <div
      class="border-l border-l-4 py-2 px-4 mt-2 bg-blue-100 border-l-blue-300"
    >
      Note that live scoring will send and store data in the cloud,
      Swantzter is the data controller for this and can be reached on
      <a
        class="text-blue-700 hover:text-blue-900 underline"
        href="mailto:privacy@swantzter.se"
        target="_blank"
      >privacy@swantzter.se</a>.
      Please make sure you have read the (short and simple!) privacy policy
      available on
      <a
        class="text-blue-700 hover:text-blue-900 underline"
        href="https://ropescore.com/privacy"
        target="_blank"
      >https://ropescore.com/privacy</a>
    </div>

    <text-button type="submit">
      Register
    </text-button>
  </form>
  <p v-if="auth.loading.value" class="container mx-auto">
    Loading...
  </p>
</template>
