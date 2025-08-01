import { isObject, useLocalStorage } from '@vueuse/core'
import type { HeatInfoConfig } from '../../hooks/heat-info'

export const deviceStreamNameModes = [
  { text: 'Athlete Names', value: 'athlete-names' },
  { text: 'Team Name', value: 'team-name' },
  { text: 'Athletes and Team Name', value: 'athletes-and-team-name' },
  { text: 'None', value: 'none' },
] as const

export type DeviceStreamNameMode = typeof deviceStreamNameModes[number]['value']

export interface StreamPool {
  id: string
  deviceId?: string
  label?: number
}

export interface GridScreenConfig {
  type: 'grid'
  rows: number
  cols: number
  // row:col
  pools?: Record<`${number}:${number}`, StreamPool>
  hideClock?: boolean
  hideCurrentHeat?: boolean
  nameMode?: DeviceStreamNameMode
}

export interface RankedScreenConfig {
  type: 'ranked-list'
  pools?: StreamPool[]
  topNOnly?: boolean
  topN?: number
  nameMode?: DeviceStreamNameMode
}

export interface DeviceStreamSettings {
  heatInfo?: HeatInfoConfig
  screens?: Record<string, GridScreenConfig | RankedScreenConfig>
}

export const HEAT_SYSTEMS = ['servo', 'ropescore', 'none'] as const
export type HeatSystem = typeof HEAT_SYSTEMS[number]

const settings = useLocalStorage<DeviceStreamSettings>('rs-device-stream-settings', {})

// Migrate to add the screen type
for (const screen of Object.values(settings.value.screens ?? {})) {
  if ((screen.type as string | undefined) == null) screen.type = 'grid'
  else break
  if (isObject(screen.pools)) {
    for (const pool of Object.values(screen.pools)) {
      if ((pool.id as string | undefined) == null) pool.id = crypto.randomUUID()
    }
  }
}

export function useDeviceStreamPools () {
  return settings
}
