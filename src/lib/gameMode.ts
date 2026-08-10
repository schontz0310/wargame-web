import type { DraftResult, Unit } from '@/lib/api'

export const ORDER_STAGES = ['command', 'order', 'cleanup'] as const
export type OrderStage = typeof ORDER_STAGES[number]

export const ORDER_TYPES = ['move', 'vent', 'ranged', 'close', 'assault'] as const
export type OrderType = typeof ORDER_TYPES[number]

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  move: 'Mover',
  vent: 'Ventilar',
  ranged: 'Combate à Distância',
  close: 'Corpo a Corpo',
  assault: 'Assalto',
}

// Order types that open the Attack Sequence checklist instead of marking the order immediately.
export const COMBAT_ORDER_TYPES: OrderType[] = ['ranged', 'close']

// Order types not supported yet — shown disabled in the picker.
export const DISABLED_ORDER_TYPES: OrderType[] = ['assault']

export function getInstanceKey(index: number, unitId: string): string {
  return `${index}-${unitId}`
}

export type DialKind = 'mech' | 'infantry' | 'none'

/**
 * Mirrors the dial-eligibility rule already used in src/app/list/page.tsx:
 * infantry/vehicle -> InfantryDial; non-colossal mech/quadmech -> AppDial; else no dial.
 */
export function getDialKind(unit: Pick<Unit, 'type' | 'speedMode' | 'class'>): DialKind {
  const type = unit.type.toLowerCase()
  if (type === 'infantry' || type === 'vehicle') return 'infantry'
  if (
    type === 'mech' &&
    (unit.speedMode.toLowerCase() === 'mech' || unit.speedMode.toLowerCase() === 'quadmech') &&
    unit.class.toLowerCase() !== 'colossal'
  ) {
    return 'mech'
  }
  return 'none'
}

// Rulebook: one order per 150 points of build total, minimum 1.
export function computeOrdersTotal(points: number): number {
  return Math.max(1, Math.floor(points / 150))
}

export function nextStage(stage: OrderStage): OrderStage {
  const idx = ORDER_STAGES.indexOf(stage)
  return ORDER_STAGES[(idx + 1) % ORDER_STAGES.length]
}

export function nextPlayerId(results: DraftResult[], currentPlayerId: number): number {
  const ids = results.map(r => r.playerId).sort((a, b) => a - b)
  const idx = ids.indexOf(currentPlayerId)
  return ids[(idx + 1) % ids.length]
}
