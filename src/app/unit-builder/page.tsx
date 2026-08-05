'use client'

import { useState, useCallback, useMemo } from 'react'
import { CombatDialEditor } from '@/components/unit-builder/CombatDialEditor'
import type { CombatDialRow } from '@/components/unit-builder/CombatDialEditor'
import { HeatDialEditor } from '@/components/unit-builder/HeatDialEditor'
import type { HeatDialRow } from '@/components/unit-builder/HeatDialEditor'
import { AttackEditor } from '@/components/unit-builder/AttackEditor'
import type { AttackRow } from '@/components/unit-builder/AttackEditor'
import { computeScore } from '@/lib/computeScore'
import type { ScoreBreakdown } from '@/lib/computeScore'
import { useColorMeanings } from '@/hooks/useColorMeanings'

const defaultCombatDial = (steps: number): CombatDialRow[] =>
  Array.from({ length: steps }, (_, i) => ({
    step: i + 1,
    marker: 'none' as const,
    primaryValue: 3,
    secondaryValue: 0,
    movementValue: 4,
    defenseValue: 14,
    attackValue: 8,
    frontArcPrimary: true,
    rearArcPrimary: false,
    frontArcSecondary: false,
    rearArcSecondary: false,
    primaryEquipColorMeaningId: null,
    secondaryEquipColorMeaningId: null,
    movementEquipColorMeaningId: null,
    attackEquipColorMeaningId: null,
    defenseEquipColorMeaningId: null,
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
  isUnique: false,
}

type Tab = 'meta' | 'combat' | 'heat' | 'attacks'

export default function UnitBuilderPage() {
  const [meta, setMeta] = useState<UnitMeta>(DEFAULT_META)
  const [dialSteps, setDialSteps] = useState(9)
  const [combatDial, setCombatDial] = useState<CombatDialRow[]>(() => defaultCombatDial(9))
  const [heatDial, setHeatDial] = useState<HeatDialRow[]>(defaultHeatDial)
  const [attacks, setAttacks] = useState<AttackRow[]>(defaultAttacks)
  const [activeTab, setActiveTab] = useState<Tab>('meta')
  const [showBreakdown, setShowBreakdown] = useState(false)

  const { colorMeanings } = useColorMeanings()

  const score = useMemo(
    () => computeScore(meta, combatDial, heatDial, attacks, colorMeanings),
    [meta, combatDial, heatDial, attacks, colorMeanings]
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
        <span className="font-mono text-xs text-[#4a5e3a] tracking-widest">WARGAME-WEB // v1.0</span>
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
              className="font-mono text-xs tracking-widest uppercase px-4 py-2 transition-all"
              style={{
                color: activeTab === t.id ? '#c9a84c' : '#5a7a4a',
                borderBottom: activeTab === t.id ? '2px solid #c9a84c' : '2px solid transparent',
                background: 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === 'meta' && (
          <MetaPanel meta={meta} updateMeta={updateMeta} dialSteps={dialSteps} onStepCountChange={handleStepCountChange} />
        )}
        {activeTab === 'combat' && (
          <CombatDialEditor rows={combatDial} onChange={setCombatDial} />
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
