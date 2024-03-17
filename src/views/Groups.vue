<template>
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
                On Floor
              </button-link>
              <button-link :to="`/groups/${group.id}/on-floor?key-color=transparent`">
                (Transparent)
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

            <div>
              <button-link :to="`/groups/${group.id}/leaderboard`">
                Leaderboard (Live)
              </button-link>
              <button-link :to="`/groups/${group.id}/leaderboard?max-visibility=${ResultVersionType.Private}`">
                (Private)
              </button-link>
              <button-link :to="`/groups/${group.id}/leaderboard?max-visibility=${ResultVersionType.Public}`">
                (Public)
              </button-link>
            </div>
          </menu>
        </div>
      </div>
    </component>
  </template>

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
import { computed } from 'vue'
import useFirebaseAuth from '../hooks/firebase-auth'
import { ResultVersionType, useGroupsQuery } from '../graphql/generated'
import { useHead } from '@vueuse/head'

import { ButtonLink } from '@ropescore/components'

useHead({
  title: 'Groups'
})

const auth = useFirebaseAuth()

const { result, loading, error } = useGroupsQuery(() => ({ fetchPolicy: 'cache-and-network', pollInterval: 30_000, enabled: auth.isAuthenticated.value }))

const groups = computed(() => result.value?.groups.filter(group => !group.completedAt))
const completedGroups = computed(() => result.value?.groups.filter(group => !!group.completedAt))
</script>
