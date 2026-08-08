'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { CombatDialEditor } from '@/components/unit-builder/CombatDialEditor'
import type { CombatDialRow } from '@/components/unit-builder/CombatDialEditor'
import { HeatDialEditor } from '@/components/unit-builder/HeatDialEditor'
import type { HeatDialRow } from '@/components/unit-builder/HeatDialEditor'
import { AttackEditor } from '@/components/unit-builder/AttackEditor'
import type { AttackRow } from '@/components/unit-builder/AttackEditor'
import { computeScore } from '@/lib/computeScore'
import type { ScoreBreakdown } from '@/lib/computeScore'
import { useColorMeanings } from '@/hooks/useColorMeanings'
import { saveUnit, loadUnit } from '@/lib/unitStorage'
import { useRouter } from 'next/navigation'

// ── Defense validation rules (per class) ─────────────────────────────────────

interface DialViolation {
  rule: string
  detail: string
}

interface ColorMeaningRef {
  id: string
  meaning: string
  color: { name: string }
  context: string
}

function isSalvage(cm: ColorMeaningRef): boolean {
  return cm.color.name.toLowerCase() === 'black' && cm.meaning.toLowerCase().includes('salvage')
}

function computeDialViolations(
  unitClass: string,
  combatDial: CombatDialRow[],
  colorMeanings: ColorMeaningRef[],
): DialViolation[] {
  const violations: DialViolation[] = []

  // Rule: salvage (preto) on attack → attack value must be ≤ 0 (unit unusable)
  const salvageIds = new Set(colorMeanings.filter(isSalvage).map(c => c.id))
  for (const row of combatDial) {
    if (row.attackEquipColorMeaningId && salvageIds.has(row.attackEquipColorMeaningId) && row.attackValue > 0) {
      violations.push({
        rule: 'Salvage (preto): ataque deve ser ≤ 0',
        detail: `Step ${row.step}: ataque ${row.attackValue} (unidade inutilizável neste click)`,
      })
    }
  }

  if (unitClass === 'Light') {
    const defVals = combatDial.map(r => r.defenseValue)

    // Rule 1: no step may exceed 21
    const over21 = combatDial.filter(r => r.defenseValue > 21)
    if (over21.length > 0) {
      violations.push({
        rule: 'Defesa máxima: 21',
        detail: `Steps ${over21.map(r => r.step).join(', ')} excedem 21`,
      })
    }

    // Rule 2: at most one step with value 21
    const exactly21 = combatDial.filter(r => r.defenseValue === 21)
    if (exactly21.length > 1) {
      violations.push({
        rule: 'Máximo 1 step com defesa 21',
        detail: `${exactly21.length} steps com valor 21 (steps ${exactly21.map(r => r.step).join(', ')})`,
      })
    }

    // Rule 3: sum of first 3 steps ≤ 60
    if (defVals.length >= 3) {
      const sum3 = defVals[0] + defVals[1] + defVals[2]
      if (sum3 > 61) {
        violations.push({
          rule: 'Soma dos 3 primeiros steps ≤ 61',
          detail: `Soma atual: ${sum3} (${defVals[0]}+${defVals[1]}+${defVals[2]})`,
        })
      }
    }

    // Rule 4: difference between consecutive steps ≤ 1
    for (let i = 1; i < defVals.length; i++) {
      const diff = Math.abs(defVals[i] - defVals[i - 1])
      if (diff > 1) {
        violations.push({
          rule: 'Variação máxima de defesa: 1 por step',
          detail: `Step ${i} → ${i + 1}: diferença de ${diff} (${defVals[i - 1]} → ${defVals[i]})`,
        })
      }
    }

    // Rule 5: attack ≤ 10 in first 4 clicks
    const atkOver10 = combatDial.slice(0, 4).filter(r => r.attackValue > 10)
    if (atkOver10.length > 0) {
      violations.push({
        rule: 'Ataque máximo nos 4 primeiros clicks: 10',
        detail: `Steps ${atkOver10.map(r => r.step).join(', ')} excedem 10 (${atkOver10.map(r => r.attackValue).join(', ')})`,
      })
    }
  }

  if (unitClass === 'Assault') {
    const n = combatDial.length
    // Improved Targeting = Blue + context attack
    const improvedTargetingIds = new Set(
      colorMeanings
        .filter(c => c.color.name.toLowerCase() === 'blue' && c.context === 'attack')
        .map(c => c.id)
    )

    const threshold = Math.floor(n / 3)

    for (let i = 0; i < n; i++) {
      const row = combatDial[i]
      if (!row.attackEquipColorMeaningId || !improvedTargetingIds.has(row.attackEquipColorMeaningId)) continue

      // Rule 1: attack > 9 → improved targeting never allowed
      if (row.attackValue > 9) {
        violations.push({
          rule: 'Assault: Improved Targeting proibido com ataque > 9',
          detail: `Step ${row.step}: ataque ${row.attackValue} excede o limite nominal de 9`,
        })
        continue
      }

      // Rule 2: step ≤ vida/3 → must satisfy ataque[N] ≤ ataque[N+1]
      if (i < threshold) {
        const nextAtk = combatDial[i + 1]?.attackValue ?? row.attackValue
        if (row.attackValue >= nextAtk) {
          violations.push({
            rule: `Assault: Improved Targeting proibido antes do step ${threshold + 1} sem ataque crescente`,
            detail: `Step ${row.step}: ataque ${row.attackValue} não é menor que o próximo step ${nextAtk} (vida/3-1 = ${threshold})`,
          })
        }
      }
    }

    // Defense rules for Assault
    const defVals = combatDial.map(r => r.defenseValue)

    const over23 = combatDial.filter(r => r.defenseValue > 23)
    if (over23.length > 0) {
      violations.push({
        rule: 'Assault: defesa máxima 23',
        detail: `Steps ${over23.map(r => r.step).join(', ')} excedem 23`,
      })
    }

    if (defVals.length >= 3) {
      const sum3 = defVals[0] + defVals[1] + defVals[2]
      if (sum3 > 68) {
        violations.push({
          rule: 'Assault: soma dos 3 primeiros steps de defesa ≤ 68',
          detail: `Soma atual: ${sum3} (${defVals[0]}+${defVals[1]}+${defVals[2]})`,
        })
      }
    }

    for (let i = 1; i < defVals.length; i++) {
      const diff = defVals[i - 1] - defVals[i]
      if (diff > 1) {
        violations.push({
          rule: 'Assault: defesa não pode diminuir mais de 1 por step',
          detail: `Step ${i} → ${i + 1}: queda de ${diff} (${defVals[i - 1]} → ${defVals[i]})`,
        })
      }
    }
  }

  return violations
}

const defaultCombatDial = (steps: number): CombatDialRow[] =>
  Array.from({ length: steps }, (_, i) => ({
    step: i + 1,
    marker: 'none' as const,
    primaryValue: 3,
    secondaryValue: 0,
    movementValue: 4,
    defenseValue: 14,
    attackValue: 8,
    primaryEquipColorMeaningId: null,
    primaryEquipUsageType: 'standard',
    secondaryEquipColorMeaningId: null,
    secondaryEquipUsageType: 'standard',
    movementEquipColorMeaningId: null,
    movementEquipUsageType: 'standard',
    attackEquipColorMeaningId: null,
    attackEquipUsageType: 'standard',
    defenseEquipColorMeaningId: null,
    defenseEquipUsageType: 'standard',
  }))

const defaultHeatDial = (): HeatDialRow[] =>
  Array.from({ length: 5 }, (_, i) => ({
    step: i + 1,
    primaryHeatValue: 0,
    secondaryHeatValue: 0,
    movementHeatValue: 0,
    primaryHeatColorMeaningId: null,
    secondaryHeatColorMeaningId: null,
    movementHeatColorMeaningId: null,
  }))

const defaultAttacks = (): AttackRow[] => [
  {
    id: crypto.randomUUID(),
    attackType: 'primary',
    damageType: 'ballistic',
    targetCount: 1,
    minRange: 0,
    maxRange: 6,
  },
]

const FACTIONS = [
  "Bannson's Raiders",
  "Clan Hell's Horses",
  'Clan Jade Falcon',
  'Clan Nova Cat',
  'Clan Sea Fox',
  'Clan Wolf',
  'Comstar',
  "Dragon's Fury",
  'Gunslinger',
  'Highlanders',
  'House Davion',
  'House Kurita',
  'House Liao',
  'House Steiner',
  'Mercenary',
  'Rasalhague Dominion',
  'Republic of the Sphere',
  'Spirit Cats',
  'Steel Wolves',
  'Stormhammers',
  'Swordsworn',
  'Wolf Hunters',
] as const

type UnitClass = 'Light' | 'Medium' | 'Heavy' | 'Assault'
type UnitRank = 'Green' | 'Veteran' | 'Elite' | 'NA'

interface UnitMeta {
  name: string
  variant: string
  type: 'Mech' | 'Vehicle' | 'Infantry'
  class: UnitClass
  rank: UnitRank
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

const DEFAULT_META: UnitMeta = {
  name: '',
  variant: '',
  type: 'Mech',
  class: 'Light',
  rank: 'NA',
  faction: '',
  expansion: '',
  collectionNumber: '',
  points: 100,
  health: 9,
  maxSpeed: 6,
  ventCapacity: 2,
  maxAttack: 9,
  maxDefense: 16,
  maxDamage: 3,
  frontArc: 180,
  rearArc: 180,
  isUnique: false,
}

type Tab = 'meta' | 'combat' | 'heat' | 'attacks'

export default function UnitBuilderPage() {
  const router = useRouter()

  const [meta, setMeta] = useState<UnitMeta>(DEFAULT_META)
  const [dialSteps, setDialSteps] = useState(9)
  const [combatDial, setCombatDial] = useState<CombatDialRow[]>(() => defaultCombatDial(9))
  const [heatDial, setHeatDial] = useState<HeatDialRow[]>(defaultHeatDial)
  const [attacks, setAttacks] = useState<AttackRow[]>(defaultAttacks)
  const [activeTab, setActiveTab] = useState<Tab>('meta')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)

  useEffect(() => {
    const saved = loadUnit()
    if (!saved) return
    setMeta(saved.meta as UnitMeta)
    setDialSteps(saved.combatDial.length)
    setCombatDial(saved.combatDial)
    setHeatDial(saved.heatDial)
    setAttacks(saved.attacks)
  }, [])

  const { colorMeanings } = useColorMeanings()

  const score = useMemo(
    () => computeScore(meta, combatDial, heatDial, attacks, colorMeanings),
    [meta, combatDial, heatDial, attacks, colorMeanings]
  )

  const dialViolations = useMemo(
    () => computeDialViolations(meta.class, combatDial, colorMeanings),
    [meta.class, combatDial, colorMeanings]
  )

  const handleStepCountChange = useCallback((n: number) => {
    setDialSteps(n)
    setCombatDial(prev => {
      if (n > prev.length) {
        const last = prev[prev.length - 1]
        const added = Array.from({ length: n - prev.length }, (_, i) => ({
          ...last,
          step: prev.length + i + 1,
        }))
        return [...prev, ...added]
      }
      return prev.slice(0, n)
    })
  }, [])

  const updateMeta = <K extends keyof UnitMeta>(key: K, value: UnitMeta[K]) => {
    setMeta(prev => ({ ...prev, [key]: value }))
    if (key === 'health') handleStepCountChange(value as number)
  }

  const handleSave = () => {
    saveUnit({ meta, combatDial, heatDial, attacks, calculatedScore: score.rounded })
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2000)
  }

  const handleView = () => {
    saveUnit({ meta, combatDial, heatDial, attacks, calculatedScore: score.rounded })
    router.push('/unit-builder/preview')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'meta', label: '01 · Metadados' },
    { id: 'combat', label: '02 · Combat Dial' },
    { id: 'heat', label: '03 · Heat Dial' },
    { id: 'attacks', label: '04 · Ataques' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #080c05 0%, #0d1208 40%, #0a0f06 100%)' }}>
      {/* Top bar */}
      <div className="border-b border-[#3a4a2a] px-6 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#7a9a5a] animate-pulse" />
          <span className="font-mono text-xs text-[#7a9a5a] tracking-widest uppercase">Criador de Unidades</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="font-mono text-xs tracking-widest uppercase px-4 py-1.5 rounded border transition-all"
            style={{
              background: savedFeedback ? 'rgba(122,154,90,0.2)' : 'rgba(201,168,76,0.08)',
              border: savedFeedback ? '1px solid #7a9a5a' : '1px solid #c9a84c55',
              color: savedFeedback ? '#7a9a5a' : '#c9a84c',
            }}
          >
            {savedFeedback ? '✓ Salvo' : 'Salvar'}
          </button>
          <button
            onClick={handleView}
            className="font-mono text-xs tracking-widest uppercase px-4 py-1.5 rounded border transition-all hover:border-[#c9a84c]"
            style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
          >
            Ver Unidade →
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#c9a84c]" />
            <span className="font-mono text-xs text-[#c9a84c] tracking-[0.3em] uppercase">Módulo 04</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: '#e8d5a0' }}>
                {meta.name || 'Nova Unidade'}
                {meta.variant ? <span className="text-[#c9a84c] ml-2 text-lg font-mono">&apos;{meta.variant}&apos;</span> : null}
              </h1>
              <p className="text-sm font-mono text-[#5a7a4a] mt-1">
                {meta.type} · {meta.class} · {meta.faction || '—'}
              </p>
            </div>
            {/* Score badge */}
            <div className="flex-shrink-0 text-right">
              <div
                className="inline-flex flex-col items-center px-5 py-3 rounded border cursor-pointer hover:border-[#c9a84c] transition-colors"
                style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid #c9a84c55' }}
                onClick={() => setShowBreakdown(v => !v)}
                title="Clique para ver breakdown"
              >
                <span className="font-mono text-[10px] text-[#7a9a5a] tracking-widest uppercase">Pts Calculados</span>
                <span className="font-mono text-4xl font-black" style={{ color: '#c9a84c', lineHeight: 1.1 }}>
                  {score.rounded}
                </span>
                <span className="font-mono text-[10px] text-[#4a5e3a]">±6 pts (LOO-MAE)</span>
              </div>
            </div>
          </div>
          {showBreakdown && <ScoreBreakdownPanel score={score} />}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-6 border-b border-[#2a3a1a]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="relative font-mono text-xs tracking-widest uppercase px-4 py-2 transition-all"
              style={{
                color: activeTab === t.id ? '#c9a84c' : '#5a7a4a',
                borderBottom: activeTab === t.id ? '2px solid #c9a84c' : '2px solid transparent',
                background: 'none',
              }}
            >
              {t.label}
              {t.id === 'combat' && dialViolations.length > 0 && (
                <span className="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-[#cc2200]" title={`${dialViolations.length} violação(ões)`} />
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === 'meta' && (
          <MetaPanel meta={meta} updateMeta={updateMeta} dialSteps={dialSteps} onStepCountChange={handleStepCountChange} />
        )}
        {activeTab === 'combat' && (
          <div className="flex flex-col gap-4">
            {dialViolations.length > 0 && (
              <div className="rounded border border-[#cc220055] overflow-hidden" style={{ background: 'rgba(80,10,10,0.3)' }}>
                <div className="px-4 py-2 border-b border-[#cc220033] flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#cc2200] animate-pulse flex-shrink-0" />
                  <span className="font-mono text-xs text-[#cc2200] tracking-widest uppercase">
                    {dialViolations.length} violação{dialViolations.length > 1 ? 'ões' : ''} · {meta.class} Mech
                  </span>
                </div>
                <div className="divide-y divide-[#cc220022]">
                  {dialViolations.map((v, i) => (
                    <div key={i} className="flex items-start gap-4 px-4 py-2">
                      <span className="font-mono text-[10px] text-[#cc4400] uppercase tracking-wide w-56 flex-shrink-0">{v.rule}</span>
                      <span className="font-mono text-[10px] text-[#7a3a3a]">{v.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <CombatDialEditor rows={combatDial} onChange={setCombatDial} />
          </div>
        )}
        {activeTab === 'heat' && (
          <HeatDialEditor rows={heatDial} onChange={setHeatDial} />
        )}
        {activeTab === 'attacks' && (
          <AttackEditor rows={attacks} onChange={setAttacks} />
        )}
      </div>
    </div>
  )
}

// ── Meta panel ───────────────────────────────────────────────────────────────

function MetaPanel({
  meta,
  updateMeta,
  dialSteps,
  onStepCountChange,
}: {
  meta: UnitMeta
  updateMeta: <K extends keyof UnitMeta>(key: K, value: UnitMeta[K]) => void
  dialSteps: number
  onStepCountChange: (n: number) => void
}) {
  const inputCls = "w-full bg-[#0d1208] border border-[#3a4a2a] rounded px-3 py-1.5 text-sm text-[#e8d5a0] font-mono focus:outline-none focus:border-[#c9a84c] transition-colors"
  const selectCls = inputCls + " cursor-pointer"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Identidade */}
      <Section title="Identidade">
        <Field label="Nome">
          <input className={inputCls} value={meta.name} onChange={e => updateMeta('name', e.target.value)} placeholder="Ex: Raven" />
        </Field>
        <Field label="Variante">
          <input className={inputCls} value={meta.variant} onChange={e => updateMeta('variant', e.target.value)} placeholder="Ex: Shadow" />
        </Field>
        <Field label="Tipo">
          <select className={selectCls} value={meta.type} onChange={e => updateMeta('type', e.target.value as UnitMeta['type'])}>
            <option>Mech</option>
            <option>Vehicle</option>
            <option>Infantry</option>
          </select>
        </Field>
        <Field label="Classe">
          <select className={selectCls} value={meta.class} onChange={e => updateMeta('class', e.target.value as UnitClass)}>
            <option>Light</option>
            <option>Medium</option>
            <option>Heavy</option>
            <option>Assault</option>
          </select>
        </Field>
        <Field label="Rank">
          <select className={selectCls} value={meta.rank} onChange={e => updateMeta('rank', e.target.value as UnitRank)}>
            <option value="NA">NA</option>
            <option>Green</option>
            <option>Veteran</option>
            <option>Elite</option>
          </select>
        </Field>
        <Field label="Único">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={meta.isUnique} onChange={e => updateMeta('isUnique', e.target.checked)}
              className="w-4 h-4 accent-[#c9a84c]" />
            <span className="text-xs font-mono text-[#7a9a5a]">{meta.isUnique ? 'Sim' : 'Não'}</span>
          </label>
        </Field>
      </Section>

      {/* Publicação */}
      <Section title="Publicação">
        <Field label="Facção">
          <select className={selectCls} value={meta.faction} onChange={e => updateMeta('faction', e.target.value)}>
            <option value="">— Selecione —</option>
            {FACTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Expansão">
          <input className={inputCls} value={meta.expansion} onChange={e => updateMeta('expansion', e.target.value)} placeholder="Ex: AOD" />
        </Field>
        <Field label="Nº Coleção">
          <input className={inputCls} value={meta.collectionNumber} onChange={e => updateMeta('collectionNumber', e.target.value)} placeholder="Ex: 042" />
        </Field>
      </Section>

      {/* Stats base */}
      <Section title="Stats Base">
        <Field label={`Vida / Clicks do Dial (${dialSteps})`}>
          <input className={inputCls} type="number" min={1} max={18} value={dialSteps}
            onChange={e => { updateMeta('health', +e.target.value); onStepCountChange(+e.target.value) }} />
        </Field>
        <Field label="Velocidade Máx">
          <input className={inputCls} type="number" min={0} value={meta.maxSpeed} onChange={e => updateMeta('maxSpeed', +e.target.value)} />
        </Field>
        <Field label="Capacidade de Ventilação">
          <input className={inputCls} type="number" min={0} value={meta.ventCapacity} onChange={e => updateMeta('ventCapacity', +e.target.value)} />
        </Field>
        <Field label="Ataque Máx">
          <input className={inputCls} type="number" min={0} value={meta.maxAttack} onChange={e => updateMeta('maxAttack', +e.target.value)} />
        </Field>
        <Field label="Defesa Máx">
          <input className={inputCls} type="number" min={0} value={meta.maxDefense} onChange={e => updateMeta('maxDefense', +e.target.value)} />
        </Field>
        <Field label="Dano Máx">
          <input className={inputCls} type="number" min={0} value={meta.maxDamage} onChange={e => updateMeta('maxDamage', +e.target.value)} />
        </Field>
        <Field label="Arco Frontal (°)">
          <select className={selectCls} value={meta.frontArc} onChange={e => updateMeta('frontArc', +e.target.value)}>
            {[0, 45, 90, 135, 180, 225, 270, 315, 360].map(v => <option key={v} value={v}>{v}°</option>)}
          </select>
        </Field>
        <Field label="Arco Traseiro (°)">
          <select className={selectCls} value={meta.rearArc} onChange={e => updateMeta('rearArc', +e.target.value)}>
            {[0, 45, 90, 135, 180, 225, 270, 315, 360].map(v => <option key={v} value={v}>{v}°</option>)}
          </select>
        </Field>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[#2a3a1a] p-4" style={{ background: 'rgba(13,18,8,0.7)' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-[#2a3a1a]" />
        <span className="font-mono text-xs text-[#c9a84c] tracking-widest uppercase">{title}</span>
        <div className="h-px flex-1 bg-[#2a3a1a]" />
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono text-[#7a9a5a] tracking-widest uppercase mb-1">{label}</label>
      {children}
    </div>
  )
}

function ScoreBreakdownPanel({ score }: { score: ScoreBreakdown }) {
  const top = score.contributions.slice(0, 20)
  const maxAbs = Math.max(...top.map(c => Math.abs(c.contribution)), 1)

  return (
    <div className="mt-4 rounded border border-[#2a3a1a] overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <span className="font-mono text-xs text-[#c9a84c] tracking-widest uppercase">Breakdown dos Pontos</span>
        <span className="font-mono text-xs text-[#4a5e3a]">bias: {score.total.toFixed(1)} → arredondado: {score.rounded}</span>
      </div>
      <div className="divide-y divide-[#1a2a12]">
        {top.map(c => {
          const pct = (Math.abs(c.contribution) / maxAbs) * 100
          const positive = c.contribution >= 0
          const featLabel = c.feature.replace('equip__', '').replace(/_/g, ' ')
          return (
            <div key={c.feature} className="flex items-center gap-3 px-4 py-1.5 hover:bg-[#0d1208] transition-colors">
              <span className="font-mono text-[10px] text-[#5a7a4a] w-48 truncate" title={c.feature}>{featLabel}</span>
              <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-full rounded-sm transition-all"
                  style={{
                    width: `${pct}%`,
                    background: positive ? '#7a9a5a' : '#cc4400',
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="font-mono text-[10px] w-16 text-right" style={{ color: positive ? '#7a9a5a' : '#cc4400' }}>
                {positive ? '+' : ''}{c.contribution.toFixed(1)}
              </span>
              <span className="font-mono text-[10px] text-[#3a4a2a] w-24 text-right">
                {c.value.toFixed(2)} × {c.weight.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
      {score.contributions.length > 20 && (
        <div className="px-4 py-1.5 border-t border-[#1a2a12]">
          <span className="font-mono text-[10px] text-[#3a4a2a]">+ {score.contributions.length - 20} features menores omitidas</span>
        </div>
      )}
    </div>
  )
}
