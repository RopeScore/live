<template>
  <main class="container mx-auto px-2">
    <div class="mx-auto max-w-44">
      <img
        class="h-44"
        :src="logo"
        alt="RopeScore Logo"
      >
    </div>
    <h1 class="text-center text-4xl font-bold">
      RopeScore Live
    </h1>

    <nav>
      <button-link to="/groups">Groups</button-link>
    </nav>

    <div v-if="needRefresh" class="mb-8">
      <span class="font-bold">Update required, reload to activate</span>
      <button
        class="block p-2 mt-2 text-center text-lg text-white bg-green-500 hover:bg-green-600 rounded hover:outline-none focus:outline-none outline-none w-full"
        @click="updateSW()"
      >
        Reload
      </button>
    </div>

    <p>
      &copy; Swantzter 2018 &mdash;
      {{ version }} &mdash;
      <a
        class="text-indigo-700 hover:text-indigo-900"
        href="https://ropescore.com"
        target="_blank"
        rel="noopener"
      >RopeScore - the simple scoring system</a>
    </p>
  </main>
</template>

<script lang="ts" setup>
import logo from '../assets/logo.svg'
import { useSW } from '../hooks/sw'

import { ButtonLink } from '@ropescore/components'

const version = (import.meta.env.VITE_COMMIT_REF ?? 'dev').toString().substring(0, 7)

const { needRefresh, updateSW } = useSW()
</script>
