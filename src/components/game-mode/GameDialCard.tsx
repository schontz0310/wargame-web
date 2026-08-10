// src/components/game-mode/GameDialCard.tsx
'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { apiService, type DraftUnit, type Unit } from '@/lib/api'
import { AppDial } from '@/components/app-dial'
import { InfantryDial } from '@/components/infantry-dial'
import { getDialKind } from '@/lib/gameMode'

// AppDial/InfantryDial's Stage canvas is a fixed 500x500, but in compact mode they still
// render a small position badge above it — DIAL_CONTENT_HEIGHT accounts for that so the
// scale factor is computed from the dial's *actual* rendered footprint, not just the
// canvas, and the whole thing (badge + canvas) fits inside the cell's useful area.
const DIAL_CONTENT_WIDTH = 500
const DIAL_CONTENT_HEIGHT = 532
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
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [retryToken, setRetryToken] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    apiService.getUnit(draftUnit.id).then(u => {
      if (cancelled) return
      if (u) {
        setUnit(u)
        setStatus('loaded')
      } else {
        setStatus('error')
      }
    }).catch(() => {
      if (!cancelled) setStatus('error')
    })
    return () => { cancelled = true }
  }, [draftUnit.id, retryToken])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      const factor = Math.min(width / DIAL_CONTENT_WIDTH, height / DIAL_CONTENT_HEIGHT)
      if (factor > 0) setScale(factor)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dialKind = status === 'loaded' && unit ? getDialKind(unit) : 'none'

  const handleDamageChange = (newClicks: number) => {
    if (newClicks > damageClicks) {
      if (damageClicks < MAX_DAMAGE_CLICKS) onDamageChange(damageClicks + 1)
    } else {
      onDamageChange(Math.max(0, damageClicks - 1))
    }
  }

  const handleHeatChange = (newClicks: number) => {
    // AppDial pre-clamps both directions itself before invoking onHeatChange when
    // externally controlled (see app-dial.tsx handleHeat/handleCooldown: increments
    // are capped at max-1, decrements floored at 0). Re-deriving direction here by
    // comparing newClicks to heatClicks is unsound right at the cap — an increment
    // click at the max arrives with newClicks === heatClicks (already clamped),
    // which a ">" comparison misreads as "not an increment" and decrements instead.
    // Forward the already-bounded value AppDial computed instead of re-deriving it.
    onHeatChange(newClicks)
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

      <div ref={containerRef} className="flex-1 min-h-0 flex items-center justify-center p-2" style={{ background: '#d8d0c0' }}>
        {status === 'loading' && (
          <div className="text-center px-2">
            <div className="font-mono text-[10px] uppercase tracking-widest animate-pulse" style={{ color: '#7a9a5a' }}>
              [ CARREGANDO... ]
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center px-2 flex flex-col items-center gap-1.5">
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#c06060' }}>
              Falha ao carregar unidade
            </div>
            <button
              onClick={() => setRetryToken(t => t + 1)}
              className="px-2 py-1 font-mono text-[10px] corner-clip-sm"
              style={{ background: 'rgba(150,50,50,0.15)', border: '1px solid #5a2a2a', color: '#c06060' }}
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        )}
        {dialKind === 'mech' && (
          <div style={{ width: DIAL_CONTENT_WIDTH, height: DIAL_CONTENT_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <AppDial
              unitId={draftUnit.id}
              dialSide="stats"
              compact
              externalDamageClicks={damageClicks}
              externalHeatClicks={heatClicks}
              onDamageChange={handleDamageChange}
              onHeatChange={handleHeatChange}
            />
          </div>
        )}
        {dialKind === 'infantry' && (
          <div style={{ width: DIAL_CONTENT_WIDTH, height: DIAL_CONTENT_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <InfantryDial
              unitId={draftUnit.id}
              dialSide="stats"
              compact
              externalDamageClicks={damageClicks}
              onDamageChange={handleDamageChange}
            />
          </div>
        )}
        {status === 'loaded' && dialKind === 'none' && (
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
