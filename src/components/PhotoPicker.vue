<script setup lang="ts">
import { type PropType, ref, watch } from 'vue'
import { TextButton } from '@ropescore/components'
import IconImageOff from '~icons/mdi/image-off-outline'
import IconUpload from '~icons/mdi/upload'
import IconLoading from '~icons/mdi/loading'
import IconTrashCan from '~icons/mdi/trash-can'
import { getOpfsImgUrl } from '../helpers'

const props = defineProps({
  modelValue: {
    type: String,
    default: undefined
  },
  label: {
    type: String,
    required: true
  },
  contentTypes: {
    type: Array as PropType<string[]>,
    default: () => ['image/jpeg', 'image/png', 'image/svg+xml']
  }
})

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<(event: 'update:model-value', value: string | undefined) => void>()

const loading = ref(false)

function pickFile () {
  if (loading.value) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = props.contentTypes.join(',')

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  input.addEventListener('change', async _ => {
    if (loading.value || !input.files?.length) return

    loading.value = true
    try {
      const file = input.files[0]
      const fileId = crypto.randomUUID()

      const opfsRoot = await navigator.storage.getDirectory()
      const fileHandle = await opfsRoot.getFileHandle(fileId, { create: true })
      // TS's typings are wrong
      const writeable = await (fileHandle as any).createWritable()

      await writeable.write(file)
      await writeable.close()

      emit('update:model-value', `opfs:${fileId}`)
    } finally {
      loading.value = false
    }
  })

  input.click()
}

const src = ref<string>()
const srcLoading = ref(false)
watch(() => props.modelValue, async value => {
  srcLoading.value = true
  try {
    src.value = value ? await getOpfsImgUrl(value) : undefined
  } finally {
    srcLoading.value = false
  }
}, { immediate: true })
</script>

<template>
  <p class="font-semibold pt-4">
    {{ label }}
  </p>
  <div class="flex items-start h-50 pb-0">
    <img v-if="src" class="aspect-16/9 h-full object-cover" :src="src">
    <div v-else class="aspect-16/9 h-full flex items-center justify-center bg-gray-200">
      <icon-loading v-if="srcLoading" class="animate-spin" />
      <icon-image-off v-else />
    </div>

    <div class="flex flex-col">
      <text-button :loading="loading" @click="pickFile">
        <icon-upload aria-label="Upload photo" />
      </text-button>
      <text-button
        color="red"
        :disabled="modelValue == null || loading"
        @click="emit('update:model-value', undefined)"
      >
        <icon-trash-can aria-label="Delete photo" />
      </text-button>
    </div>
  </div>
</template>
