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

// The rulebook's 3 victory conditions (p.38-40).
export type VictoryCondition = 1 | 2 | 3

export const VICTORY_CONDITION_LABELS: Record<VictoryCondition, string> = {
  1: 'VC1 · Eliminação',
  2: 'VC2 · Controle de Campo',
  3: 'VC3 · Zona Adversária',
}

export const VICTORY_CONDITION_DESCRIPTIONS: Record<VictoryCondition, string> = {
  1: 'Elimine unidades inimigas: cada unidade inimiga eliminada vale pontos de vitória iguais ao seu valor em pontos.',
  2: 'No fim do jogo: suas unidades sobreviventes valem seu valor em pontos; cativos na sua zona de deployment valem o dobro do valor; unidades inimigas com Salvage fora da zona de deployment do dono também contam.',
  3: 'No início de cada uma das suas fases de Comando: 1 VP por unidade sua que ocupa a zona de deployment do oponente.',
}

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
  code: string
  x: number
  y: number
}

// Official WizKids-approved terrain models (warrenborn.com/Terrain.html), grouped
// by the same 5 categories the rulebook uses. Each model carries its official
// control code (from the product PDF filenames, e.g. MWDATerrainC1hi.pdf → "C1").
// The two "Combined Terrain" pieces that share the "Blocking / Hindering" name
// are distinct physical pieces — their codes (C1 / C3) are what disambiguates them.
export interface TerrainModel {
  code: string
  name: string
}

export interface TerrainCategory {
  category: string
  models: TerrainModel[]
}

// Official reference sheet PDF for a terrain model, keyed by its control code
// (matches the warrenborn.com file naming: MWDATerrain<code>hi.pdf).
export function terrainPdfUrl(code: string): string {
  return `https://www.warrenborn.com/Files/Terrain/MWDATerrain${code}hi.pdf`
}

export const TERRAIN_CATEGORIES: TerrainCategory[] = [
  {
    category: 'Abrupt Terrain',
    models: [
      { code: 'A1', name: 'Abrupt Elevated' },
    ],
  },
  {
    category: 'Blocking Terrain',
    models: [
      { code: 'B1', name: 'Office Building' },
      { code: 'B2', name: 'City Block A' },
      { code: 'B3', name: 'City Block B' },
      { code: 'B4', name: 'City Block C' },
      { code: 'B5', name: 'Industrial Complex' },
      { code: 'B6', name: 'Industrial Tower' },
      { code: 'B7', name: 'Butte' },
      { code: 'B8', name: 'Fortification Wall' },
    ],
  },
  {
    category: 'Combined Terrain',
    models: [
      { code: 'C1', name: 'Blocking / Hindering' },
      { code: 'C2', name: 'Water / Hindering' },
      { code: 'C3', name: 'Blocking / Hindering' },
      { code: 'C4', name: 'Abrupt / Hindering / Water' },
    ],
  },
  {
    category: 'Hindering Terrain',
    models: [
      { code: 'h1', name: 'Woodland' },
      { code: 'h2', name: 'Orchard' },
      { code: 'h4', name: 'Brush' },
    ],
  },
  {
    category: 'Water Terrain',
    models: [
      { code: 'W1', name: 'Lagoon' },
      { code: 'W2', name: 'Pool' },
      { code: 'W3', name: 'Canal' },
      { code: 'W4', name: 'Tarn' },
      { code: 'W5', name: 'Watercourse' },
      { code: 'W6', name: 'Watercourse Bend' },
      { code: 'W7', name: 'Canal Bend' },
    ],
  },
]

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
