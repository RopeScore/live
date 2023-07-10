<template>
  <main class="container mx-auto px-2">
    <div class="mx-auto mb-8 w-max max-w-full">
      <p>
        RopeScore live is currently limited to tournament organisers,
        click below to be able to connect with your RopeScore core system.
      </p>
      <button-link to="/groups">
        Groups
      </button-link>
    </div>

    <div v-if="needRefresh" class="mx-auto mb-8 flex flex-col justify-center w-max max-w-full">
      <p>Update required, reload to activate</p>
      <text-button @click="updateSW()">
        Reload
      </text-button>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { useSW } from '../hooks/sw'

import { TextButton, ButtonLink } from '@ropescore/components'

const { needRefresh, updateSW } = useSW()
</script>
