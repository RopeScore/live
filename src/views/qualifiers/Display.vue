<template>
  <main
    class="flex items-start justify-center gap-6 px-8 py-6 max-w-[100vw]"
    :class="{
      'dark bg-black text-white': theme === 'dark',
      'bg-white text-black': theme !== 'dark'
    }"
  >
    <div
      :style="`--cols: ${grid.cols}; --rows: ${grid.rows};`"
      class="grid max-w-full overflow-hidden w-full h-full grid-cols-1 grid-rows-[min-content_1fr] items-center justify-around gap-y-4"
    >
      <transition name="fade">
        <div v-if="state !== 'hidden'">
          <h1 class="text-center font-normal text-6xl">
            Qualifiers
          </h1>
          <h1 class="text-center font-bold text-6xl">
            {{ session?.title }}
          </h1>
          <h2 class="text-center font-bold text-4xl">
            {{ session?.subTitle }}
          </h2>
        </div>
      </transition>

      <div
        class="grid w-full grid-cols-[repeat(var(--cols),10rem_1fr)] grid-rows-[repeat(var(--rows),1fr)] gap-y-4 self-center"
      >
        <template
          v-for="idx of (session?.numQualifiers ?? 0)"
          :key="session?.qualifiers[idx - 1]?.id ?? idx"
        >
          <transition :name="idxToPos(idx - 1).direction" @after-leave="afterLeave()">
            <div
              v-show="state === 'shown'"
              :name="idxToPos(idx - 1).direction"
              :style="`--station-col: ${idxToPos(idx - 1).col}; --station-row: ${idxToPos(idx - 1).row}`"
              class="flex h-full items-center justify-end col-start-[var(--station-col,1)] row-start-[calc(var(--station-row,1))] p-2"
              :class="{
                'bg-white bg-opacity-60': theme !== 'dark',
                'bg-black bg-opacity-60': theme === 'dark',
              }"
            >
              <img
                v-if="session?.qualifiers[idx - 1]?.countryCode != null"
                class="border-2"
                :class="{
                  'border-gray-800': theme !== 'dark',
                  'border-gray-400': theme === 'dark'
                }"
                alt=""
                :src="`/flags/${session?.qualifiers[idx - 1]?.countryCode}.svg`"
              >
            </div>
          </transition>
          <transition :name="idxToPos(idx - 1).direction">
            <div
              v-show="state === 'shown'"
              :name="idxToPos(idx - 1).direction"
              :style="`--station-col: ${idxToPos(idx - 1).col}; --station-row: ${idxToPos(idx - 1).row}`"
              class="h-full col-start-[calc(var(--station-col,1)+1)] row-start-[calc(var(--station-row,1))] text-4xl px-6 py-2"
              :class="{
                'bg-white bg-opacity-60': theme !== 'dark',
                'bg-black bg-opacity-60': theme === 'dark',
              }"
            >
              <p class="font-bold">
                {{ formatList(session?.qualifiers[idx - 1]?.names?? []) }}&nbsp;
              </p>
              <p v-if="session?.qualifiers[idx - 1]?.countryCode != null">
                {{ countryNames[session?.qualifiers[idx - 1]?.countryCode!] }}
              </p>
            </div>
          </transition>
        </template>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { useHead } from '@vueuse/head'
import countries from '../../assets/countries.json'
import { useTheme } from '../../hooks/theme'
import { useQualifiers, type QualifierSession } from './use-qualifiers'
import { computed, nextTick, ref, watch } from 'vue'
import { formatList, getOpfsImgUrl } from '../../helpers'

useHead({
  title: '📺 Qualifiers (Live)'
})

const bc = new BroadcastChannel('rs-qualifiers')

const theme = useTheme()
const { settings } = useQualifiers()
const session = ref<QualifierSession & { numQualifiers: number }>()
const pendingHide = ref(false)
const state = ref<'hidden' | 'title' | 'shown'>('hidden')

const countryNames = Object.fromEntries(countries.map(c => [c.code, c.name]))

const bgUrlVar = ref('')
watch(() => settings.value.background, async newBg => {
  bgUrlVar.value = newBg ? `url(${await getOpfsImgUrl(newBg)})` : ''
}, { immediate: true })

bc.addEventListener('message', evt => {
  if (
    typeof evt.data === 'string' &&
    (evt.data.startsWith('show:') || evt.data.startsWith('show-title:'))
  ) {
    const rawSession = window.localStorage.getItem('rs-qualifier-sessions')
    const sessions = rawSession ? JSON.parse(rawSession) as QualifierSession[] : null
    console.log(sessions)
    if (sessions == null) {
      session.value = undefined
    } else {
      const sessionId = evt.data.split(':')[1]
      const newSession = sessions.find(s => s.id === sessionId)

      if (newSession == null) {
        session.value = undefined
      } else {
        if (evt.data.startsWith('show-title:')) {
          session.value = {
            ...newSession,
            numQualifiers: newSession.qualifiers.length,
          }
          void nextTick(() => {
            state.value = 'title'
          })
        } else {
          session.value = {
            ...newSession,
            numQualifiers: newSession.qualifiers.length
          }
          void nextTick(() => {
            state.value = 'shown'
          })
        }
      }
    }
  } else if (evt.data === 'hide') {
    state.value = 'hidden'
    pendingHide.value = true
  }
})

function afterLeave () {
  if (pendingHide.value) {
    session.value = undefined
  }
}

const grid = computed(() => {
  let cols = 1
  let rows = 1

  if (session.value?.numQualifiers === 2) {
    cols = 2
  } else if (session.value?.numQualifiers === 3) {
    rows = 3
  } else if (session.value?.numQualifiers === 4) {
    cols = 2
    rows = 2
  } else if (session.value != null && session.value?.numQualifiers <= 8) {
    cols = 2
    rows = Math.ceil(session.value?.numQualifiers / 2)
  } else {
    cols = 3
    rows = Math.ceil((session.value?.numQualifiers ?? 0) / 3)
  }

  return { cols, rows }
})

function idxToPos (idx: number) {
  for (let col = 0; col < grid.value.cols; col++) {
    for (let row = 0; row < grid.value.rows; row++) {
      if ((col * grid.value.rows) + row === idx) {
        let direction: 'left' | 'right' | 'bottom' = 'left'
        if (col === 0) direction = 'left'
        else if (col === grid.value.cols - 1) direction = 'right'
        else direction = 'bottom'

        return { col: (col * 2) + 1, row: row + 1, direction }
      }
    }
  }
  return { col: 1, row: 1, direction: 'left' }
}
</script>

<style scoped>
main {
  --bgUrl: v-bind(bgUrlVar);
  background: var(--bgUrl, white);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

main.dark {
  background: var(--bgUrl, black);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.left-enter-active,
.left-leave-active,
.right-enter-active,
.right-leave-active {
  transition: all 0.5s ease;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.left-enter-from,
.left-leave-to {
  transform: translateX(calc(-55vw));
}
.right-enter-from,
.right-leave-to {
  transform: translateX(calc(55vw));
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
