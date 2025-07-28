import { useLocalStorage } from '@vueuse/core'
import { useRouteQuery } from '@vueuse/router'
import { computed } from 'vue'

export const themes = ['light', 'dark', 'swedish-gymnastics'] as const
export type Theme = typeof themes[number]
export const keyColors = ['transparent', 'theme', 'green', 'blue'] as const
export type KeyColor = typeof keyColors[number]

const theme = useLocalStorage<Theme>('rs-theme', 'light')
const keyColor = useLocalStorage<KeyColor>('rs-key-color', 'transparent')

export function useTheme () {
  const queryTheme = useRouteQuery('theme', theme)

  return computed({
    get () { return queryTheme.value },
    set (newValue) { theme.value = newValue }
  })
}

export function useKeyColor () {
  const queryKeyColor = useRouteQuery('key-color', keyColor)

  return computed({
    get () { return queryKeyColor.value },
    set (newValue) { keyColor.value = newValue }
  })
}

export function useRawKeyColor () {
  return keyColor
}

export function useRawTheme () {
  return theme
}
