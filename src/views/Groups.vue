<template>
  <nav>
    <div
      v-if="auth.loading.value"
      class="flex justify-center items-center text-2xl"
    >
      Loading
    </div>
  </nav>

  <div v-if="auth.token.value" class="flex flex-col gap-4">
    <router-link
      v-for="group of groups"
      :key="group.id"
      :to="`/groups/${group.id}`"
      class="bg-gray-100 hover:bg-gray-300 rounded px-2 py-1 min-h-[4rem] flex flex-col justify-center"
    >
      <span class="font-semibold">{{ group.name }}</span>
    </router-link>
  </div>

  <div v-if="!auth.token.value">
    <h1 class="font-semibold text-2xl mt-4">
      Register
    </h1>
    <!-- <text-field v-model="newName" label="System name" /> -->

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

    <text-button @click="auth.register()">
      Register
    </text-button>
  </div>

  <div v-else class="mt-4">
    <p>
      System ID: <code class="bg-gray-100 px-2 rounded">{{ auth.user.value?.id }}</code>
    </p>
    <p>
      You need to add this system as a viewer of the group in RopeScore core,
      do this by entering the ID shown above. It is case sensitive.
    </p>
  </div>

  <div
    v-if="loading"
    class="p-2"
  >
    Loading...
  </div>

  <div
    v-if="error"
    class="p-2"
  >
    {{ error }}
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useAuth } from '../hooks/auth'
import { useGroupsQuery } from '../graphql/generated'
import { useResult } from '@vue/apollo-composable'

import { TextButton } from '@ropescore/components'

const auth = useAuth()

// const newName = ref('')

const { result, loading, error } = useGroupsQuery(() => ({ fetchPolicy: 'cache-and-network', pollInterval: 30_000, enabled: auth.isLoggedIn.value }))

const groups = useResult(result, [], res => res?.groups)
</script>