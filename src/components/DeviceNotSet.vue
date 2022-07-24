<template>
  <div
    class="border border-black bg-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white flex items-center justify-center relative"
  >
    <div
      class="font-bold text-8xl absolute top-0 left-2 text-gray-600 dark:text-gray-400"
    >
      {{ pool }}
    </div>

    <p class="text-center">
      No device linked to this pool
    </p>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  pool: {
    type: Number,
    required: true
  }
})
</script>
