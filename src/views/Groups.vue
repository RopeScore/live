<template>
  <div>
    <div
      v-if="auth.loading.value"
      class="flex justify-center items-center text-2xl"
    >
      Loading
    </div>
  </div>

  <div v-if="auth.token.value">
    <template v-for="groupType in ['uncompleted', 'completed']" :key="groupType">
      <component :is="groupType === 'completed' ? 'details' : 'div'" :class="{ 'mt-4': groupType === 'completed' }">
        <summary v-if="groupType === 'completed'">
          Completed Groups
        </summary>

        <div class="flex flex-col gap-4">
          <div
            v-for="group of groupType === 'completed' ? completedGroups : groups"
            :key="group.id"
            class="border rounded p-2"
          >
            <div>
              <span class="font-semibold">{{ group.name }}</span>
            </div>

            <menu class="p-0 m-0 flex justify-end items-start flex-col">
              <button-link :to="`/groups/${group.id}/live`">
                Live
              </button-link>
              <div>
                <button-link :to="`/groups/${group.id}/on-floor`">
                  On Floor (Transparent)
                </button-link>
                <button-link :to="`/groups/${group.id}/on-floor?key-color=green`">
                  (Green)
                </button-link>
                <button-link :to="`/groups/${group.id}/on-floor?key-color=blue`">
                  (Blue)
                </button-link>
              </div>
              <button-link :to="`/groups/${group.id}/next-up`">
                Next Up
              </button-link>
            </menu>
          </div>
        </div>
      </component>
    </template>
  </div>

  <div v-if="!auth.token.value">
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

    <text-button @click="auth.register({ name: newName })">
      Register
    </text-button>
  </div>

  <div v-else class="mt-4">
    <div>
      <select-field
        v-model="localManual"
        label="Preferred Server"
        :data-list="localApis"
        class="max-w-60"
      />
      <p>Server: {{ apiDomain }}</p>
    </div>
    <p>
      System ID: <code class="bg-gray-100 px-2 rounded">{{ auth.user.value?.id }}</code>
    </p>
    <system-name />
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
import { ref, computed } from 'vue'
import { useAuth } from '../hooks/auth'
import { apiDomain, localManual, localApis } from '../apollo'
import { useGroupsQuery } from '../graphql/generated'
import { useHead } from '@vueuse/head'

import SystemName from '../components/SystemName.vue'
import { TextButton, ButtonLink, TextField, SelectField } from '@ropescore/components'

useHead({
  title: 'Groups | RopeScore Live'
})

const auth = useAuth()

const newName = ref('')

const { result, loading, error } = useGroupsQuery(() => ({ fetchPolicy: 'cache-and-network', pollInterval: 30_000, enabled: auth.isLoggedIn.value }))

const groups = computed(() => result.value?.groups.filter(group => !group.completedAt))
const completedGroups = computed(() => result.value?.groups.filter(group => !!group.completedAt))
</script>
