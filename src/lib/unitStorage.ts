import { safeLocalStorage } from '@/lib/storage'
import type { CombatDialRow } from '@/components/unit-builder/CombatDialEditor'
import type { HeatDialRow } from '@/components/unit-builder/HeatDialEditor'
import type { AttackRow } from '@/components/unit-builder/AttackEditor'

export interface SavedUnitMeta {
  name: string
  variant: string
  type: string
  class: string
  rank: string
  faction: string
  expansion: string
  collectionNumber: string
  points: number
  health: number
  maxSpeed: number
  ventCapacity: number
  maxAttack: number
  maxDefense: number
  maxDamage: number
  frontArc: number
  rearArc: number
  isUnique: boolean
}

export interface SavedUnit {
  id: string
  meta: SavedUnitMeta
  combatDial: CombatDialRow[]
  heatDial: HeatDialRow[]
  attacks: AttackRow[]
  calculatedScore: number
  savedAt: string
}

const STORAGE_KEY = 'wargame_unit_builder_draft'

export function saveUnit(unit: Omit<SavedUnit, 'id' | 'savedAt'>): SavedUnit {
  const saved: SavedUnit = {
    ...unit,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  }
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  return saved
}

export function loadUnit(): SavedUnit | null {
  const raw = safeLocalStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SavedUnit
  } catch {
    return null
  }
}
