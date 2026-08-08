import type { CombatDialRow } from '@/components/unit-builder/CombatDialEditor'
import type { HeatDialRow } from '@/components/unit-builder/HeatDialEditor'
import type { AttackRow } from '@/components/unit-builder/AttackEditor'
import {
  LIGHT_MECH_SCORING_WEIGHTS,
  MEDIUM_MECH_SCORING_WEIGHTS,
  HEAVY_MECH_SCORING_WEIGHTS,
  ASSAULT_MECH_SCORING_WEIGHTS,
  NA_VEHICLE_SCORING_WEIGHTS,
  NA_INFANTRY_SCORING_WEIGHTS,
} from '@/lib/scoringWeights/index'
import type { ColorMeaning } from '@/lib/api'

type ScoringWeights = { bias: number; weights: Record<string, number> }

function selectWeights(unitClass: string, unitType: string): ScoringWeights {
  if (unitType === 'Vehicle') return NA_VEHICLE_SCORING_WEIGHTS
  if (unitType === 'Infantry') return NA_INFANTRY_SCORING_WEIGHTS
  if (unitClass === 'Medium') return MEDIUM_MECH_SCORING_WEIGHTS
  if (unitClass === 'Heavy') return HEAVY_MECH_SCORING_WEIGHTS
  if (unitClass === 'Assault') return ASSAULT_MECH_SCORING_WEIGHTS
  return LIGHT_MECH_SCORING_WEIGHTS
}

// Slugify must match the ETL: equip__ + NFD + lowercase + non-alphanum→_ + trim _
function slugify(meaning: string): string {
  return (
    'equip__' +
    meaning
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  )
}

interface UnitMeta {
  health: number
  maxSpeed: number
  ventCapacity: number
  maxAttack: number
  maxDefense: number
  maxDamage: number
  isUnique: boolean
  class: string
  type: string
}

export interface ScoreBreakdown {
  total: number
  rounded: number
  contributions: { feature: string; value: number; weight: number; contribution: number }[]
}

export function computeScore(
  meta: UnitMeta,
  combatDial: CombatDialRow[],
  heatDial: HeatDialRow[],
  attacks: AttackRow[],
  colorMeanings: ColorMeaning[],
): ScoreBreakdown {
  const { bias, weights } = selectWeights(meta.class, meta.type)

  const n = combatDial.length
  if (n === 0) return { total: 0, rounded: 0, contributions: [] }

  // Build meaningId → slug map from live colorMeanings
  const meaningSlug = new Map<string, string>()
  for (const cm of colorMeanings) {
    if (cm.usageType === 'equipment') {
      meaningSlug.set(cm.id, slugify(cm.meaning))
    }
  }

  // Helper: step weight = (N - i) / N  (i=0 → weight=1.0, i=N-1 → weight=1/N)
  const sw = (i: number) => (n - i) / n

  // ── Raw value arrays ─────────────────────────────────────────────
  const primVals  = combatDial.map(d => d.primaryValue)
  const secVals   = combatDial.map(d => d.secondaryValue)
  const movVals   = combatDial.map(d => d.movementValue)
  const defVals   = combatDial.map(d => d.defenseValue)
  const atkVals   = combatDial.map(d => d.attackValue)

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

  // ── Degradation ratios ───────────────────────────────────────────
  const first = combatDial[0]
  const last  = combatDial[n - 1]
  const degradationAttack   = first.attackValue   > 0 ? last.attackValue   / first.attackValue   : 0
  const degradationDefense  = first.defenseValue  > 0 ? last.defenseValue  / first.defenseValue  : 0
  const degradationMovement = first.movementValue > 0 ? last.movementValue / first.movementValue : 0

  // ── Equipment step-weighted dummies ─────────────────────────────
  // Replicate ETL: for each step accumulate stepWeight for each slot's ability (once per step)
  const EQUIP_SLOT_KEYS: (keyof CombatDialRow)[] = [
    'primaryEquipColorMeaningId',
    'secondaryEquipColorMeaningId',
    'movementEquipColorMeaningId',
    'attackEquipColorMeaningId',
    'defenseEquipColorMeaningId',
  ]

  const equipScores: Record<string, number> = {}
  for (let i = 0; i < n; i++) {
    const stepWeight = sw(i)
    const row = combatDial[i]
    const seen = new Set<string>()
    for (const key of EQUIP_SLOT_KEYS) {
      const meaningId = row[key] as string | null
      if (meaningId) {
        const slug = meaningSlug.get(meaningId)
        if (slug && !seen.has(slug)) {
          equipScores[slug] = (equipScores[slug] ?? 0) + stepWeight
          seen.add(slug)
        }
      }
    }
  }

  // ── Heat penalties ───────────────────────────────────────────────
  const totalPrimaryHeat   = sum(heatDial.map(h => h.primaryHeatValue))
  const totalSecondaryHeat = sum(heatDial.map(h => h.secondaryHeatValue))
  const totalMovementHeat  = sum(heatDial.map(h => h.movementHeatValue))
  const totalHeat = totalPrimaryHeat + totalSecondaryHeat + totalMovementHeat

  // ── Attack stats ─────────────────────────────────────────────────
  const damageTypes  = attacks.map(a => a.damageType.toLowerCase())
  const maxRanges    = attacks.map(a => a.maxRange)
  const minRanges    = attacks.map(a => a.minRange)
  const targetCounts = attacks.map(a => a.targetCount)

  // ── Feature map (mirrors ETL output columns) ─────────────────────
  const features: Record<string, number> = {
    health:              meta.health,
    maxSpeed:            meta.maxSpeed,
    ventCapacity:        meta.ventCapacity,
    maxAttack:           meta.maxAttack,
    maxDefense:          meta.maxDefense,
    maxDamage:           meta.maxDamage,
    isUnique:            meta.isUnique ? 1 : 0,

    avgPrimary:          avg(primVals),
    avgSecondary:        avg(secVals),
    avgMovement:         avg(movVals),
    avgAttack:           avg(atkVals),
    avgDefense:          avg(defVals),

    peakPrimary:         first.primaryValue,
    peakSecondary:       first.secondaryValue,
    peakAttack:          first.attackValue,

    sumAttack:           sum(atkVals),
    sumDefense:          sum(defVals),
    sumMovement:         sum(movVals),

    degradationAttack,
    degradationDefense,
    degradationMovement,

    totalPrimaryHeatPenalty:   totalPrimaryHeat,
    totalSecondaryHeatPenalty: totalSecondaryHeat,
    totalMovementHeatPenalty:  totalMovementHeat,
    totalHeatPenalty:          totalHeat,

    maxTargetCount: attacks.length ? Math.max(...targetCounts) : 0,
    maxMaxRange:    attacks.length ? Math.max(...maxRanges)    : 0,
    avgMinRange:    avg(minRanges),
    avgMaxRange:    avg(maxRanges),

    hasBallistic: damageTypes.includes('ballistic') ? 1 : 0,
    hasEnergetic: damageTypes.includes('energetic') ? 1 : 0,
    hasMelee:     damageTypes.includes('melee')     ? 1 : 0,

    // spread equipment dummies
    ...equipScores,
  }

  // ── Compute score ────────────────────────────────────────────────
  let total = bias
  const contributions: ScoreBreakdown['contributions'] = []

  for (const [feat, w] of Object.entries(weights) as [string, number][]) {
    const val = features[feat] ?? 0
    const contribution = w * val
    total += contribution
    if (Math.abs(contribution) > 0.01) {
      contributions.push({ feature: feat, value: val, weight: w, contribution })
    }
  }

  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))

  return {
    total,
    rounded: Math.max(1, Math.round(total)),
    contributions,
  }
}
