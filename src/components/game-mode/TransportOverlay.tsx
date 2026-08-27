// src/components/game-mode/TransportOverlay.tsx
'use client'

import { useState } from 'react'
import type { DraftUnit } from '@/lib/api'
import { getInstanceKey } from '@/lib/gameMode'
import type { PlayerSessionState } from '@/hooks/useGameSession'
import { useT } from '@/hooks/useT'

// Rulebook p.18: infantry counts as 1 capacity slot, all other types count as 3.
function slotCost(unitType: string): number {
  return unitType.toLowerCase() === 'infantry' ? 1 : 3
}

interface TransportOverlayProps {
  action: 'board' | 'disembark'
  transportDraftUnit: DraftUnit
  transportInstanceKey: string
  cargoCapacity: number
  allArmyUnits: DraftUnit[]
  playerState: PlayerSessionState
  onConfirm: (passengerInstanceKeys: string[]) => void
  onClose: () => void
}

export default function TransportOverlay({
  action,
  transportDraftUnit,
  transportInstanceKey,
  cargoCapacity,
  allArmyUnits,
  playerState,
  onConfirm,
  onClose,
}: TransportOverlayProps) {
  const t = useT()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const transportDialState = playerState.units[transportInstanceKey]
  const currentPassengerKeys = transportDialState?.passengers ?? []

  // Build index: instanceKey → DraftUnit for fast lookup
  const unitByKey: Record<string, DraftUnit> = {}
  allArmyUnits.forEach((du, i) => {
    unitByKey[getInstanceKey(i, du.id)] = du
  })

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const slotsUsed = (keys: Iterable<string>) => {
    let total = 0
    for (const k of keys) {
      const du = unitByKey[k]
      if (du) total += slotCost(du.type)
    }
    return total
  }

  if (action === 'board') {
    // Eligible: not the transport, not already aboard, not already ordered this turn
    // Rulebook p.18: only infantry and vehicles can board transports.
    const eligible = allArmyUnits
      .map((du, i) => ({ du, key: getInstanceKey(i, du.id) }))
      .filter(({ du, key }) => {
        const t = du.type.toLowerCase()
        return (
          (t === 'infantry' || t === 'vehicle') &&
          key !== transportInstanceKey &&
          !playerState.units[key]?.aboard &&
          playerState.unitOrders[key]?.status !== 'ordered'
        )
      })

    const existingSlots = slotsUsed(currentPassengerKeys)
    const newSlots = slotsUsed(selected)
    const totalSlots = existingSlots + newSlots
    const overCapacity = totalSlots > cargoCapacity

    return (
      <div
        className="fixed inset-0 z-40 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.75)' }}
      >
        <div
          className="corner-clip-sm overflow-hidden flex flex-col"
          style={{ background: '#111608', border: '1px solid #4a6a3a', width: 440, maxHeight: '80vh' }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a3a1a' }}>
            <div>
              <div className="font-mono text-sm font-bold" style={{ color: '#e8d5a0' }}>{t('transport.boardTitle')}</div>
              <div className="font-mono text-xs" style={{ color: '#5a7a4a' }}>{transportDraftUnit.name}</div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-xs px-2 py-1 corner-clip-sm"
                style={{
                  background: overCapacity ? 'rgba(150,50,50,0.2)' : 'rgba(40,80,120,0.2)',
                  border: `1px solid ${overCapacity ? '#7a3a3a' : '#3a6090'}`,
                  color: overCapacity ? '#c06060' : '#7aaad8',
                }}
              >
                {totalSlots} / {cargoCapacity} slots
              </span>
              <button onClick={onClose} className="font-mono text-xs" style={{ color: '#5a7a4a' }}>✕</button>
            </div>
          </div>

          {/* Unit list */}
          <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: '#1a2a12' }}>
            {eligible.length === 0 && (
              <div className="px-4 py-6 text-center font-mono text-xs" style={{ color: '#4a5e3a' }}>
                {t('transport.noEligible')}
              </div>
            )}
            {eligible.map(({ du, key }) => {
              const cost = slotCost(du.type)
              const checked = selected.has(key)
              const wouldExceed = !checked && (totalSlots + cost) > cargoCapacity
              return (
                <label
                  key={key}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                  style={{
                    opacity: wouldExceed ? 0.4 : 1,
                    background: checked ? 'rgba(40,80,120,0.1)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={wouldExceed && !checked}
                    onChange={() => toggle(key)}
                    className="accent-blue-400"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs font-bold truncate" style={{ color: '#e8d5a0' }}>{du.name}</div>
                    <div className="font-mono text-[10px]" style={{ color: '#4a5e3a' }}>
                      {du.type.toUpperCase()} · {cost} slot{cost !== 1 ? 's' : ''}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: '1px solid #2a3a1a' }}>
            <span className="font-mono text-[10px]" style={{ color: '#4a5e3a' }}>
              {selected.size} {t('transport.selected')}
            </span>
            <button
              onClick={() => onConfirm([...selected])}
              disabled={selected.size === 0 || overCapacity}
              className="font-mono text-xs px-3 py-1.5 corner-clip-sm disabled:opacity-30"
              style={{ background: 'rgba(40,80,120,0.3)', border: '1px solid #3a6090', color: '#7aaad8' }}
            >
              {t('transport.confirmBoard')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // action === 'disembark'
  const passengers = currentPassengerKeys
    .map(k => ({ key: k, du: unitByKey[k] }))
    .filter(({ du }) => !!du)

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="corner-clip-sm overflow-hidden flex flex-col"
        style={{ background: '#111608', border: '1px solid #4a6a3a', width: 440, maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a3a1a' }}>
          <div>
            <div className="font-mono text-sm font-bold" style={{ color: '#e8d5a0' }}>{t('transport.disembarkTitle')}</div>
            <div className="font-mono text-xs" style={{ color: '#5a7a4a' }}>{transportDraftUnit.name}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2 py-1 corner-clip-sm"
              style={{ background: 'rgba(40,80,120,0.2)', border: '1px solid #3a6090', color: '#7aaad8' }}>
              {slotsUsed(currentPassengerKeys)} / {cargoCapacity} slots
            </span>
            <button onClick={onClose} className="font-mono text-xs" style={{ color: '#5a7a4a' }}>✕</button>
          </div>
        </div>

        {/* Passenger list */}
        <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: '#1a2a12' }}>
          {passengers.length === 0 && (
            <div className="px-4 py-6 text-center font-mono text-xs" style={{ color: '#4a5e3a' }}>
              {t('transport.noPassengers')}
            </div>
          )}
          {passengers.map(({ key, du }) => {
            const checked = selected.has(key)
            return (
              <label
                key={key}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                style={{ background: checked ? 'rgba(40,80,120,0.1)' : 'transparent' }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(key)}
                  className="accent-blue-400"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs font-bold truncate" style={{ color: '#e8d5a0' }}>{du!.name}</div>
                  <div className="font-mono text-[10px]" style={{ color: '#4a5e3a' }}>
                    {du!.type.toUpperCase()} · {slotCost(du!.type)} slot{slotCost(du!.type) !== 1 ? 's' : ''}
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: '1px solid #2a3a1a' }}>
          <button
            onClick={() => setSelected(new Set(passengers.map(p => p.key)))}
            className="font-mono text-[10px]"
            style={{ color: '#5a7a4a' }}
          >
            {t('transport.selectAll')}
          </button>
          <button
            onClick={() => onConfirm([...selected])}
            disabled={selected.size === 0}
            className="font-mono text-xs px-3 py-1.5 corner-clip-sm disabled:opacity-30"
            style={{ background: 'rgba(40,80,120,0.3)', border: '1px solid #3a6090', color: '#7aaad8' }}
          >
            {t('transport.confirmDisembark')}
          </button>
        </div>
      </div>
    </div>
  )
}
