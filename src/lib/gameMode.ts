import type { DraftResult, Unit } from '@/lib/api'

export const ORDER_STAGES = ['command', 'order', 'cleanup'] as const
export type OrderStage = typeof ORDER_STAGES[number]

export const PREPARATION_STAGES = ['player_aliases', 'battlefield_setup', 'first_player_roll', 'terrain_placement', 'battleforce_deployment'] as const
export type PreparationStage = typeof PREPARATION_STAGES[number]

export const ORDER_TYPES = ['move', 'vent', 'ranged', 'close', 'artillery', 'assault'] as const
export type OrderType = typeof ORDER_TYPES[number]

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  move: 'Mover',
  vent: 'Ventilar',
  ranged: 'Combate à Distância',
  close: 'Corpo a Corpo',
  artillery: 'Artilharia',
  assault: 'Assalto',
}

// Order types that open the Attack Sequence checklist instead of marking the order immediately.
export const COMBAT_ORDER_TYPES: OrderType[] = ['ranged', 'close']

// Order types not supported yet — shown disabled in the picker.
export const DISABLED_ORDER_TYPES: OrderType[] = ['assault']

// Artillery attack placed during the Order stage, resolved next Command stage.
export interface PendingArtilleryAttack {
  id: string
  attackerPlayerId: number
  attackerInstanceKey: string
  attackerUnitName: string
  markerDescription: string
  attackValue: number
  damageValue: number
  blastRadius: number
  placedOnTurn: number
}

// Faction abilities that trigger during the Command stage.
export interface FactionCommandAbility {
  abilityName: string
  description: string
  requirementHint?: string
}

export const FACTION_COMMAND_ABILITIES: Record<string, FactionCommandAbility[]> = {
  'House Liao': [
    {
      abilityName: 'Awe',
      description:
        'Escolha 1 oponente. Role 1d6 para cada 450 pts do build total do oponente (arredonde para cima). Para cada resultado 6, o oponente perde 1 ordem neste turno.',
      requirementHint:
        'Requer pelo menos metade do seu build total composto de unidades Elite (★) de House Liao.',
    },
  ],
}

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
  return Math.max(1, Math.ceil(points / 150))
}

export function nextStage(stage: OrderStage): OrderStage {
  const idx = ORDER_STAGES.indexOf(stage)
  return ORDER_STAGES[(idx + 1) % ORDER_STAGES.length]
}

export function nextPreparationStage(stage: PreparationStage): PreparationStage {
  const idx = PREPARATION_STAGES.indexOf(stage)
  return PREPARATION_STAGES[(idx + 1) % PREPARATION_STAGES.length]
}

export function nextPlayerId(results: DraftResult[], currentPlayerId: number): number {
  const ids = results.map(r => r.playerId).sort((a, b) => a - b)
  const idx = ids.indexOf(currentPlayerId)
  return ids[(idx + 1) % ids.length]
}

// Preparation phase types
export interface TerrainFeature {
  id: string
  playerId: number
  name: string
  x: number
  y: number
}

export interface BattlefieldSetup {
  battlefieldSize: number // 3 feet = 36 inches
  deploymentZoneDepth: number // 3 inches
  deploymentZoneMinEdgeDistance: number // 8 inches
  terrainMinDistance: number // 3 inches
}

export interface PreparationState {
  stage: PreparationStage
  battlefieldSetup: BattlefieldSetup
  terrainFeatures: TerrainFeature[]
  terrainPile: Map<number, number> // playerId -> count
  firstPlayerId: number | null
  diceRolls: Map<number, number> // playerId -> roll total
  deployedUnits: Map<number, string[]> // playerId -> unitIds
  currentDeployingPlayer: number | null
}
