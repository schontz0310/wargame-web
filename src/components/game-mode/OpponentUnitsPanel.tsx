'use client'

import { useState, useEffect } from 'react'
import { apiService, type Draft, type Unit } from '@/lib/api'
import { AppDial } from '@/components/app-dial'
import { InfantryDial } from '@/components/infantry-dial'
import { getInstanceKey, getDialKind } from '@/lib/gameMode'
import type { PlayerSessionState } from '@/hooks/useGameSession'
import { useT } from '@/hooks/useT'

// AppDial/InfantryDial native canvas size (same as GameDialCard)
const DIAL_W = 500
const DIAL_H = 532

// Popup dial content area — ~3× a typical army grid cell
const POPUP_W = 400
const POPUP_H = 426 // DIAL_H * (POPUP_W / DIAL_W)
const DIAL_SCALE = POPUP_W / DIAL_W // 0.8

interface OpponentUnitsPanelProps {
  draft: Draft
  opponentPlayerId: number
  opponentState: PlayerSessionState
  label?: string
}

interface HoveredUnit {
  instanceKey: string
  unitId: string
  name: string
  damageClicks: number
  heatClicks: number
}

export default function OpponentUnitsPanel({
  draft,
  opponentPlayerId,
  opponentState,
  label,
}: OpponentUnitsPanelProps) {
  const t = useT()
  const resolvedLabel = label ?? t('control.opponentUnits')
  const [unitCache, setUnitCache] = useState<Record<string, Unit>>({})
  const [hovered, setHovered] = useState<HoveredUnit | null>(null)

  const opponentResult = draft.results.find(r => r.playerId === opponentPlayerId)
  const armyUnits = opponentResult?.armyUnits ?? []

  useEffect(() => {
    const uniqueIds = [...new Set(armyUnits.map(u => u.id))]
    uniqueIds.forEach(id => {
      setUnitCache(prev => {
        if (prev[id]) return prev
        apiService.getUnit(id).then(u => {
          if (u) setUnitCache(c => ({ ...c, [id]: u }))
        }).catch(() => {})
        return prev
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentPlayerId])

  if (armyUnits.length === 0) return null

  const hoveredUnit = hovered ? unitCache[hovered.unitId] : null
  const dialKind = hoveredUnit ? getDialKind(hoveredUnit) : null

  return (
    <>
      <div
        className="corner-clip-sm flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}
      >
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ borderBottom: '1px solid #2a3a1a' }}
        >
          <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#5a7a4a' }}>
            {resolvedLabel}
          </span>
          <span className="font-mono text-xs" style={{ color: '#3a4a2a' }}>
            {armyUnits.length} {t('opponent.units')}
          </span>
        </div>

        <div className="divide-y" style={{ borderColor: '#1a2a12' }}>
          {armyUnits.map((draftUnit, index) => {
            const instanceKey = getInstanceKey(index, draftUnit.id)
            const dialState = opponentState.units[instanceKey] ?? { damageClicks: 0, heatClicks: 0 }
            const unit = unitCache[draftUnit.id]
            const markerCount = dialState.markerCount ?? 0

            const maxHP = unit?.health ?? null
            const currentHP = maxHP !== null ? Math.max(0, maxHP - dialState.damageClicks) : null
            const isDead = maxHP !== null && currentHP !== null && currentHP <= 0

            const dial = unit?.combatDial
            const stepIdx = Math.min(dialState.damageClicks, (dial?.length ?? 1) - 1)
            const currentStep = dial?.[stepIdx]

            return (
              <div
                key={instanceKey}
                className="px-3 py-2 cursor-default"
                style={{ opacity: isDead ? 0.45 : 1 }}
                onMouseEnter={() => setHovered({
                  instanceKey,
                  unitId: draftUnit.id,
                  name: draftUnit.name,
                  damageClicks: dialState.damageClicks,
                  heatClicks: dialState.heatClicks,
                })}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span
                    className="font-mono text-sm font-bold leading-tight"
                    style={{ color: isDead ? '#5a5a4a' : '#e8d5a0' }}
                  >
                    {draftUnit.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="font-mono text-base tracking-tight leading-none"
                      style={{ color: markerCount >= 2 ? '#c06060' : markerCount === 1 ? '#c9a84c' : '#3a4a2a' }}
                      title={`${markerCount} ${t('opponent.markersTitle')}`}
                    >
                      {markerCount >= 2 ? '●●' : markerCount === 1 ? '●○' : '○○'}
                    </span>
                    {maxHP !== null && currentHP !== null ? (
                      <span
                        className="font-mono text-sm font-bold shrink-0"
                        style={{
                          color: isDead
                            ? '#7a3a3a'
                            : currentHP <= maxHP * 0.35
                            ? '#c06060'
                            : currentHP <= maxHP * 0.6
                            ? '#c9a84c'
                            : '#7a9a5a',
                        }}
                      >
                        {isDead ? t('opponent.eliminated') : `${currentHP}/${maxHP}`}
                      </span>
                    ) : (
                      <span className="font-mono text-xs" style={{ color: '#3a4a2a' }}>—</span>
                    )}
                  </div>
                </div>

                {currentStep && !isDead && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatChip label="ATK" value={currentStep.attackValue} />
                    <StatChip label="DEF" value={currentStep.defenseValue} />
                    <StatChip label="VEL" value={currentStep.movementValue} />
                    <StatChip label="DMG" value={currentStep.primaryValue} />
                    {(unit?.cargoCapacity ?? 0) > 0 && (
                      <StatChip label="CAP" value={unit!.cargoCapacity} />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dial hover popup — fixed centered, pointer-events-none so the list stays hoverable */}
      {hovered && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: POPUP_W + 2,
            background: '#111608',
            border: '1px solid #4a6a3a',
            boxShadow: '0 16px 64px rgba(0,0,0,0.85)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-2.5 flex items-baseline justify-between gap-2"
            style={{ borderBottom: '1px solid #2a3a1a' }}
          >
            <span className="font-mono text-sm font-bold" style={{ color: '#e8d5a0' }}>
              {hovered.name}
            </span>
            <div className="flex items-center gap-2">
              {hoveredUnit && (hoveredUnit.cargoCapacity ?? 0) > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 font-mono" style={{ background: 'rgba(100,80,20,0.2)', border: '1px solid #8a7a3a', color: '#c9a84c' }}>
                  <CargoSvg size={12} />
                  <span className="text-xs font-bold">{hoveredUnit.cargoCapacity}</span>
                </div>
              )}
              <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>dial</span>
            </div>
          </div>

          {/* Dial canvas area */}
          <div
            className="flex items-center justify-center overflow-hidden"
            style={{ width: POPUP_W, height: POPUP_H, background: '#d8d0c0' }}
          >
            {!hoveredUnit ? (
              <span className="font-mono text-xs animate-pulse" style={{ color: '#5a7a4a' }}>
                {t('common.loading')}
              </span>
            ) : dialKind === 'mech' ? (
              <div style={{
                width: DIAL_W,
                height: DIAL_H,
                transform: `scale(${DIAL_SCALE})`,
                transformOrigin: 'center center',
                flexShrink: 0,
              }}>
                <AppDial
                  unitId={hovered.unitId}
                  dialSide="stats"
                  compact
                  externalDamageClicks={hovered.damageClicks}
                  externalHeatClicks={hovered.heatClicks}
                  onDamageChange={() => {}}
                  onHeatChange={() => {}}
                />
              </div>
            ) : dialKind === 'infantry' ? (
              <div style={{
                width: DIAL_W,
                height: DIAL_H,
                transform: `scale(${DIAL_SCALE})`,
                transformOrigin: 'center center',
                flexShrink: 0,
              }}>
                <InfantryDial
                  unitId={hovered.unitId}
                  dialSide="stats"
                  compact
                  externalDamageClicks={hovered.damageClicks}
                  onDamageChange={() => {}}
                />
              </div>
            ) : (
              <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>
                {t('opponent.dialUnavailable')}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs uppercase" style={{ color: '#4a5e3a' }}>{label}</span>
      <span className="font-mono text-xs font-bold" style={{ color: '#c9a84c' }}>{value}</span>
    </div>
  )
}

function CargoSvg({ size = 12 }: { size?: number }) {
  const w = size * 2.2
  const h = size * 1.8
  return (
    <svg width={w} height={h} viewBox="0 0 22 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="20" height="16" rx="1.5" stroke="#c9a84c" strokeWidth="1.5"/>
      <line x1="1" y1="7.5" x2="21" y2="7.5" stroke="#c9a84c" strokeWidth="1"/>
      <line x1="8" y1="7.5" x2="8" y2="17" stroke="#c9a84c" strokeWidth="1"/>
      <line x1="15" y1="7.5" x2="15" y2="17" stroke="#c9a84c" strokeWidth="1"/>
    </svg>
  )
}
