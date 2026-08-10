// src/components/game-mode/GameDialCard.tsx
'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { apiService, type DraftUnit, type Unit } from '@/lib/api'
import { AppDial } from '@/components/app-dial'
import { InfantryDial } from '@/components/infantry-dial'
import { getDialKind } from '@/lib/gameMode'

const DIAL_INTRINSIC_SIZE = 500
const MAX_DAMAGE_CLICKS = 17

export interface GameDialCardProps {
  draftUnit: DraftUnit
  instanceKey: string
  damageClicks: number
  heatClicks: number
  onDamageChange: (clicks: number) => void
  onHeatChange: (clicks: number) => void
  headerRight?: ReactNode
}

export default function GameDialCard({
  draftUnit,
  instanceKey,
  damageClicks,
  heatClicks,
  onDamageChange,
  onHeatChange,
  headerRight,
}: GameDialCardProps) {
  const [unit, setUnit] = useState<Unit | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    let cancelled = false
    apiService.getUnit(draftUnit.id).then(u => {
      if (!cancelled) setUnit(u)
    }).catch(() => {
      if (!cancelled) setUnit(null)
    })
    return () => { cancelled = true }
  }, [draftUnit.id])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      const factor = Math.min(width, height) / DIAL_INTRINSIC_SIZE
      if (factor > 0) setScale(factor)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dialKind = unit ? getDialKind(unit) : 'none'

  const handleDamageChange = (newClicks: number) => {
    if (newClicks > damageClicks) {
      if (damageClicks < MAX_DAMAGE_CLICKS) onDamageChange(damageClicks + 1)
    } else {
      onDamageChange(Math.max(0, damageClicks - 1))
    }
  }

  const handleHeatChange = (newClicks: number) => {
    const maxHeatSteps = (unit?.heatDial?.length ?? 0) + 1
    if (newClicks > heatClicks) {
      if (heatClicks < maxHeatSteps - 1) onHeatChange(heatClicks + 1)
    } else {
      onHeatChange(Math.max(0, heatClicks - 1))
    }
  }

  return (
    <div
      className="flex flex-col h-full corner-clip-sm overflow-hidden"
      style={{ background: '#111608', border: '1px solid #3a4a2a' }}
      data-instance-key={instanceKey}
    >
      <div
        className="px-2 py-1.5 flex items-center justify-between gap-2 flex-shrink-0"
        style={{ borderBottom: '1px solid #2a3a1a', background: 'rgba(0,0,0,0.3)' }}
      >
        <div className="min-w-0">
          <div className="font-mono text-xs font-bold truncate" style={{ color: '#e8d5a0' }}>{draftUnit.name}</div>
          <div className="font-mono text-[10px] truncate" style={{ color: '#5a7a4a' }}>{draftUnit.faction} · {draftUnit.points} pts</div>
        </div>
        {headerRight}
      </div>

      <div ref={containerRef} className="flex-1 min-h-0 flex items-center justify-center" style={{ background: '#d8d0c0' }}>
        {dialKind === 'mech' && (
          <div style={{ width: DIAL_INTRINSIC_SIZE, height: DIAL_INTRINSIC_SIZE, transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <AppDial
              unitId={draftUnit.id}
              dialSide="stats"
              externalDamageClicks={damageClicks}
              externalHeatClicks={heatClicks}
              onDamageChange={handleDamageChange}
              onHeatChange={handleHeatChange}
            />
          </div>
        )}
        {dialKind === 'infantry' && (
          <div style={{ width: DIAL_INTRINSIC_SIZE, height: DIAL_INTRINSIC_SIZE, transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <InfantryDial
              unitId={draftUnit.id}
              dialSide="stats"
              externalDamageClicks={damageClicks}
              onDamageChange={handleDamageChange}
            />
          </div>
        )}
        {dialKind === 'none' && (
          <div className="text-center px-2">
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#7a9a5a' }}>
              {draftUnit.isCard ? 'Card secreto' : 'Dial em desenvolvimento'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
