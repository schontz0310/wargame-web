'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadUnit } from '@/lib/unitStorage'
import type { SavedUnit } from '@/lib/unitStorage'
import { useColorMeanings } from '@/hooks/useColorMeanings'
import type { CombatDialRow } from '@/components/unit-builder/CombatDialEditor'
import type { HeatDialRow } from '@/components/unit-builder/HeatDialEditor'
import ballisticDamage from '@/images/ballisticDamage.png'
import energeticDamage from '@/images/energeticDamage.png'
import meleeDamage from '@/images/meleeDamage.png'
import mechSpeed from '@/images/mechSpeed.png'
import defense from '@/images/defense.png'
import crosshair from '@/images/crosshair.png'

// Equipment color → cell background
// Color token per equipment color — bg bright enough to read on dark bg
const EQUIP_TOKENS: Record<string, { bg: string; text: string }> = {
  black:  { bg: '#444455', text: '#ffffff' },
  red:    { bg: '#c42200', text: '#ffffff' },
  blue:   { bg: '#0088bb', text: '#ffffff' },
  purple: { bg: '#9900cc', text: '#ffffff' },
  gray:   { bg: '#7a7a8a', text: '#ffffff' },
  green:  { bg: '#2e8b00', text: '#ffffff' },
  yellow: { bg: '#b89000', text: '#fff8cc' },
}

function equipStyle(colorName?: string): React.CSSProperties {
  if (!colorName) return {}
  const token = EQUIP_TOKENS[colorName.toLowerCase()]
  if (!token) return {}
  return { background: token.bg, color: token.text, fontWeight: 700 }
}

function heatSign(val: number): string {
  if (val === 0) return '0'
  return val > 0 ? `+${val}` : `${val}`
}

export default function UnitPreviewPage() {
  const router = useRouter()
  const [unit, setUnit] = useState<SavedUnit | null>(null)
  const { colorMeanings } = useColorMeanings()
  const combatContainerRef = useRef<HTMLDivElement>(null)
  const [combatContainerWidth, setCombatContainerWidth] = useState(0)
  const heatContainerRef = useRef<HTMLDivElement>(null)
  const [heatContainerWidth, setHeatContainerWidth] = useState(0)

  useEffect(() => { setUnit(loadUnit()) }, [])

  useEffect(() => {
    const el = combatContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setCombatContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const el = heatContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setHeatContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const meaningMap = useMemo(() => {
    const m = new Map<string, { colorName: string }>()
    colorMeanings.forEach(c => m.set(c.id, { colorName: c.color.name }))
    return m
  }, [colorMeanings])

  const getEquipColor = (id: string | null): string | undefined =>
    id ? meaningMap.get(id)?.colorName : undefined

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1208' }}>
        <div className="text-center space-y-4">
          <p className="font-mono text-sm text-[#5a7a4a]">Nenhuma unidade salva.</p>
          <button
            onClick={() => router.push('/unit-builder')}
            className="font-mono text-xs text-[#c9a84c] border border-[#c9a84c55] px-4 py-2 rounded hover:border-[#c9a84c] transition-colors"
          >
            ← Voltar ao Criador
          </button>
        </div>
      </div>
    )
  }

  const { meta, combatDial, heatDial, attacks, calculatedScore } = unit

  const priDamage = attacks.find(a => a.attackType === 'primary')?.damageType ?? 'ballistic'
  const secDamage = attacks.find(a => a.attackType === 'secondary')?.damageType ?? 'ballistic'

  const DAMAGE_IMG: Record<string, typeof ballisticDamage> = {
    ballistic: ballisticDamage,
    energetic: energeticDamage,
    melee:     meleeDamage,
  }

  const dialRows: {
    label: string
    abbr: string
    img: typeof ballisticDamage
    valueKey: keyof CombatDialRow
    equipKey: keyof CombatDialRow
    usageKey: keyof CombatDialRow
  }[] = [
    { label: 'Primário',   abbr: 'PRI', img: DAMAGE_IMG[priDamage] ?? ballisticDamage, valueKey: 'primaryValue',   equipKey: 'primaryEquipColorMeaningId',   usageKey: 'primaryEquipUsageType' },
    { label: 'Secundário', abbr: 'SEC', img: DAMAGE_IMG[secDamage] ?? ballisticDamage, valueKey: 'secondaryValue',  equipKey: 'secondaryEquipColorMeaningId', usageKey: 'secondaryEquipUsageType' },
    { label: 'Movimento',  abbr: 'MOV', img: mechSpeed,                                valueKey: 'movementValue',   equipKey: 'movementEquipColorMeaningId',  usageKey: 'movementEquipUsageType' },
    { label: 'Ataque',     abbr: 'ATK', img: crosshair,                                valueKey: 'attackValue',     equipKey: 'attackEquipColorMeaningId',    usageKey: 'attackEquipUsageType' },
    { label: 'Defesa',     abbr: 'DEF', img: defense,                                  valueKey: 'defenseValue',    equipKey: 'defenseEquipColorMeaningId',   usageKey: 'defenseEquipUsageType' },
  ]

  const heatRows: {
    label: string
    abbr: string
    img: typeof ballisticDamage
    valueKey: keyof HeatDialRow
    colorKey: keyof HeatDialRow
  }[] = [
    { label: 'Primário',  abbr: 'PRI', img: DAMAGE_IMG[priDamage] ?? ballisticDamage, valueKey: 'primaryHeatValue',   colorKey: 'primaryHeatColorMeaningId' },
    { label: 'Secundário',abbr: 'SEC', img: DAMAGE_IMG[secDamage] ?? ballisticDamage, valueKey: 'secondaryHeatValue',  colorKey: 'secondaryHeatColorMeaningId' },
    { label: 'Movimento', abbr: 'MOV', img: mechSpeed,                                valueKey: 'movementHeatValue',   colorKey: 'movementHeatColorMeaningId' },
  ]

  const cellW = 42  // px per step cell

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #080c05 0%, #0d1208 40%, #0a0f06 100%)' }}>

      {/* Top bar */}
      <div className="border-b border-[#3a4a2a] px-6 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <button
          onClick={() => router.push('/unit-builder')}
          className="font-mono text-xs text-[#c9a84c] tracking-widest uppercase hover:text-[#e8d5a0] transition-colors"
        >
          ← Voltar ao Criador
        </button>
        <span className="font-mono text-xs text-[#3a4a2a] tracking-widest">PREVIEW · UNIT RECORD</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-8">

        {/* ── Unit header ─────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-6 pb-6 border-b border-[#2a3a1a]">
          <div>
            {/* Class badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase px-2 py-0.5 rounded"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid #c9a84c44', color: '#c9a84c' }}>
                {meta.class} {meta.type}
              </span>
              {meta.isUnique && (
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 rounded"
                  style={{ background: 'rgba(153,0,170,0.15)', border: '1px solid #9900aa55', color: '#cc44ee' }}>
                  Único
                </span>
              )}
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-none" style={{ color: '#e8d5a0', fontFamily: 'monospace' }}>
              {meta.name || 'Sem Nome'}
              {meta.variant && (
                <span className="text-xl font-mono ml-3" style={{ color: '#c9a84c' }}>&lsquo;{meta.variant}&rsquo;</span>
              )}
            </h1>
            <p className="font-mono text-sm mt-2" style={{ color: '#5a7a4a' }}>
              {meta.faction || '—'} · {meta.rank} · {meta.expansion || '—'} #{meta.collectionNumber || '—'}
            </p>
          </div>

          {/* Points + base stats cluster */}
          <div className="flex items-end gap-4 flex-shrink-0">
            {/* Attacks */}
            {attacks.length > 0 && (
              <div className="flex flex-row gap-2">
                {attacks.map(atk => (
                  <div key={atk.id} className="rounded p-3 space-y-1.5"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1a2a12', minWidth: 120 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#c9a84c' }}>
                        {atk.attackType}
                      </span>
                      <span className="font-mono text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background: atk.damageType === 'ballistic' ? 'rgba(120,100,20,0.3)'
                            : atk.damageType === 'energetic' ? 'rgba(0,100,160,0.3)'
                            : 'rgba(140,20,20,0.3)',
                          color: atk.damageType === 'ballistic' ? '#c9a84c'
                            : atk.damageType === 'energetic' ? '#66bbdd'
                            : '#dd6644',
                        }}>
                        {atk.damageType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: '#4a5e3a' }}>Alvos</div>
                        <div className="font-mono text-sm font-bold" style={{ color: '#e8d5a0' }}>{atk.targetCount}</div>
                      </div>
                      <div className="h-6 w-px" style={{ background: '#2a3a1a' }} />
                      <div className="text-center">
                        <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: '#4a5e3a' }}>Alcance</div>
                        <div className="font-mono text-sm font-bold" style={{ color: '#e8d5a0' }}>{atk.minRange}–{atk.maxRange}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Score */}
            <div className="flex flex-col items-center px-6 py-4 rounded"
              style={{ background: 'rgba(201,168,76,0.08)', border: '2px solid #c9a84c66' }}>
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase mb-0.5" style={{ color: '#7a9a5a' }}>Pontos</span>
              <span className="font-mono text-5xl font-black leading-none" style={{ color: '#c9a84c' }}>{calculatedScore}</span>
            </div>
          </div>
        </div>

        {/* ── Combat Dial ─────────────────────────────────────────────── */}
        <div className="rounded border border-[#2a3a1a] overflow-hidden" style={{ background: 'rgba(6,10,4,0.95)' }}>
          {/* Panel header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.35)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
            <span className="font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: '#c9a84c' }}>Combat Dial</span>
            <span className="font-mono text-[10px] ml-2" style={{ color: '#3a4a2a' }}>{combatDial.length} clicks</span>
          </div>

          <div className="overflow-x-auto" ref={combatContainerRef}>
            {(() => {
              const colW = combatContainerWidth > 0
                ? Math.floor(combatContainerWidth / (combatDial.length + 2))
                : cellW
              return (
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: colW }} />
                <col style={{ width: colW }} />
                {combatDial.map(r => <col key={r.step} style={{ width: colW }} />)}
              </colgroup>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                  {/* Row label header cell */}
                  <th style={{ borderRight: '1px solid #2a3a1a', borderBottom: '1px solid #2a3a1a', padding: '6px 8px' }} />
                  {/* Icon header cell */}
                  <th style={{ borderRight: '1px solid #2a3a1a', borderBottom: '1px solid #2a3a1a', padding: '4px' }} />
                  {combatDial.map(row => (
                    <th key={row.step} style={{
                      width: cellW,
                      minWidth: cellW,
                      padding: '4px 2px',
                      borderRight: '1px solid #1a2a12',
                      borderBottom: '1px solid #2a3a1a',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontSize: 10,
                      color: '#c9a84c',
                      letterSpacing: '0.05em',
                    }}>
                      {row.step}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dialRows.map((dialRow, rowIdx) => (
                  <tr key={dialRow.label} style={{ borderBottom: '1px solid #1a2a12', background: rowIdx % 2 === 0 ? 'rgba(13,18,8,0.4)' : 'rgba(6,10,4,0.4)' }}>
                    {/* Row header */}
                    <td style={{ padding: '0 8px', borderRight: '1px solid #2a3a1a', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#7a9a5a', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        {dialRow.abbr}
                      </span>
                    </td>
                    {/* Icon cell */}
                    <td style={{ width: 30, height: 34, textAlign: 'center', borderRight: '1px solid #2a3a1a', padding: 0, overflow: 'hidden', lineHeight: '34px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={dialRow.img.src} alt={dialRow.abbr} style={{ height: 18, width: 'auto', display: 'inline', verticalAlign: 'middle', filter: 'brightness(0) invert(1)', opacity: 0.75 }} />
                    </td>
                    {combatDial.map(step => {
                      const equipId = step[dialRow.equipKey] as string | null
                      const colorName = getEquipColor(equipId)
                      const usageType = step[dialRow.usageKey] as 'standard' | 'single-use'
                      const token = colorName ? EQUIP_TOKENS[colorName.toLowerCase()] : undefined
                      const isSingleUse = usageType === 'single-use'
                      const value = step[dialRow.valueKey] as number
                      return (
                        <td key={step.step} style={{
                          width: cellW,
                          height: 34,
                          textAlign: 'center',
                          borderRight: '1px solid #1a2a12',
                          fontFamily: 'monospace',
                          fontSize: 13,
                          ...(token && !isSingleUse
                            ? { background: token.bg, color: token.text, fontWeight: 700 }
                            : { color: value === 0 ? '#2a3a1a' : '#c8bfa0' }),
                        }}>
                          {token && isSingleUse ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: token.bg,
                              color: token.text,
                              fontWeight: 700,
                              fontSize: 12,
                            }}>
                              {value}
                            </span>
                          ) : value}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Marker row */}
                <tr style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid #2a3a1a' }}>
                  <td style={{ padding: '0 8px', borderRight: '1px solid #2a3a1a', textAlign: 'right' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#4a5e3a', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MRK</span>
                  </td>
                  <td style={{ width: 30, borderRight: '1px solid #2a3a1a' }} />
                  {combatDial.map(step => (
                    <td key={step.step} style={{
                      height: 24,
                      textAlign: 'center',
                      borderRight: '1px solid #1a2a12',
                      fontSize: 11,
                      color: step.marker === 'black' ? '#ffffff' : step.marker === 'green' ? '#7a9a5a' : 'transparent',
                    }}>
                      {step.marker !== 'none' ? (step.marker === 'black' ? '▲' : '▲') : ''}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
              )
            })()}
          </div>

          {/* Color legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-t border-[#1a2a12]" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a4a2a' }}>Equipamento:</span>
            {Object.entries(EQUIP_TOKENS).map(([name, { bg }]) => (
              <span key={name} className="flex items-center gap-1">
                <span style={{ display: 'inline-block', width: 10, height: 10, background: bg, borderRadius: 2 }} />
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#5a7a4a', textTransform: 'capitalize' }}>{name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Bottom row: Heat Dial + Info ────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-6 items-start">

          {/* Heat Dial */}
          <div className="rounded border border-[#2a3a1a] overflow-hidden" style={{ background: 'rgba(6,10,4,0.95)' }}>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#7a9a5a]" />
              <span className="font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: '#7a9a5a' }}>Heat Dial</span>
            </div>
            <div ref={heatContainerRef}>
            {(() => {
              const hColW = heatContainerWidth > 0
                ? Math.floor(heatContainerWidth / (heatDial.length + 2))
                : cellW
              return (
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: hColW }} />
                <col style={{ width: hColW }} />
                {heatDial.map(h => <col key={h.step} style={{ width: hColW }} />)}
              </colgroup>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <th style={{ borderRight: '1px solid #2a3a1a', borderBottom: '1px solid #2a3a1a', padding: '4px 8px' }} />
                  <th style={{ borderRight: '1px solid #2a3a1a', borderBottom: '1px solid #2a3a1a', padding: '4px' }} />
                  {heatDial.map((h, hi) => {
                    const isShutdown = hi === heatDial.length - 1
                    return (
                      <th key={h.step} style={{
                        width: cellW,
                        padding: '4px 2px',
                        borderRight: '1px solid #1a2a12',
                        borderBottom: '1px solid #2a3a1a',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: isShutdown ? '#cc2200' : '#5a7a4a',
                      }}>
                        {h.step}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {heatRows.map((heatRow, rowIdx) => (
                  <tr key={heatRow.label} style={{ borderBottom: '1px solid #1a2a12', background: rowIdx % 2 === 0 ? 'rgba(13,18,8,0.4)' : 'rgba(6,10,4,0.4)' }}>
                    <td style={{ padding: '0 8px', borderRight: '1px solid #2a3a1a', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#5a7a4a', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        {heatRow.abbr}
                      </span>
                    </td>
                    <td style={{ width: 30, height: 34, textAlign: 'center', borderRight: '1px solid #2a3a1a', padding: 0, overflow: 'hidden', lineHeight: '34px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heatRow.img.src} alt={heatRow.abbr} style={{ height: 18, width: 'auto', display: 'inline', verticalAlign: 'middle', filter: 'brightness(0) invert(1)', opacity: 0.75 }} />
                    </td>
                    {heatDial.map((step, si) => {
                      const isShutdown = si === heatDial.length - 1
                      const val = step[heatRow.valueKey] as number
                      const colorId = step[heatRow.colorKey] as string | null
                      const colorName = getEquipColor(colorId)
                      const style = equipStyle(colorName)
                      const hasColor = !!colorName
                      return (
                        <td key={step.step} style={{
                          width: cellW,
                          height: 34,
                          textAlign: 'center',
                          borderRight: '1px solid #1a2a12',
                          fontFamily: 'monospace',
                          fontSize: isShutdown ? 16 : 12,
                          fontWeight: hasColor || val !== 0 || isShutdown ? 700 : 400,
                          ...(isShutdown ? { background: 'rgba(60,10,10,0.6)', color: '#cc2200' }
                            : hasColor ? style
                            : { color: val === 0 ? '#2a3a1a' : val < 0 ? '#cc4400' : '#7a9a5a' }),
                        }}>
                          {isShutdown ? '☢' : heatSign(val)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
              )
            })()}
            </div>
          </div>

          {/* Info + Attacks */}
          <div className="space-y-4">
            {/* Stats + Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoPanel title="Stats Base">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <InfoRow label="Velocidade" value={String(meta.maxSpeed)} />
                  <InfoRow label="Ventilação" value={String(meta.ventCapacity)} />
                  <InfoRow label="Ataque Máx" value={String(meta.maxAttack)} />
                  <InfoRow label="Defesa Máx" value={String(meta.maxDefense)} />
                  <InfoRow label="Dano Máx" value={String(meta.maxDamage)} />
                  <InfoRow label="Vida" value={String(meta.health)} />
                  <InfoRow label="Arco Frontal" value={`${meta.frontArc}°`} />
                  <InfoRow label="Arco Traseiro" value={`${meta.rearArc}°`} />
                </div>
              </InfoPanel>
              <InfoPanel title="Identidade">
                <div className="space-y-1.5">
                  <InfoRow label="Facção" value={meta.faction || '—'} />
                  <InfoRow label="Expansão" value={meta.expansion || '—'} />
                  <InfoRow label="Nº Coleção" value={meta.collectionNumber || '—'} />
                  <InfoRow label="Rank" value={meta.rank} />
                  <InfoRow label="Único" value={meta.isUnique ? 'Sim' : 'Não'} />
                </div>
              </InfoPanel>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-4">
          <p className="font-mono text-[10px]" style={{ color: '#2a3a1a' }}>
            Salvo em {new Date(unit.savedAt).toLocaleString('pt-BR')} · ID {unit.id.slice(0, 8)}
          </p>
        </div>

      </div>
    </div>
  )
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-[#2a3a1a] overflow-hidden" style={{ background: 'rgba(6,10,4,0.9)' }}>
      <div className="px-4 py-2 border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: '#7a9a5a' }}>{title}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="font-mono text-[10px] uppercase tracking-wider whitespace-nowrap" style={{ color: '#4a5e3a' }}>{label}</span>
      <span className="font-mono text-xs" style={{ color: '#c8bfa0' }}>{value}</span>
    </div>
  )
}
