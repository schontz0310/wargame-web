// src/components/game-mode/ArtilleryOrderOverlay.tsx
'use client'

import { useState } from 'react'
import type { DraftUnit } from '@/lib/api'
import type { PendingArtilleryAttack } from '@/lib/gameMode'

interface ArtilleryOrderOverlayProps {
  attackerPlayerId: number
  attackerUnit: DraftUnit
  attackerInstanceKey: string
  currentTurn: number
  onConfirm: (attack: Omit<PendingArtilleryAttack, 'id'>) => void
  onClose: () => void
}

export default function ArtilleryOrderOverlay({
  attackerPlayerId,
  attackerUnit,
  attackerInstanceKey,
  currentTurn,
  onConfirm,
  onClose,
}: ArtilleryOrderOverlayProps) {
  const [markerDescription, setMarkerDescription] = useState('')
  const [attackValue, setAttackValue] = useState('')
  const [damageValue, setDamageValue] = useState('')
  const [blastRadius, setBlastRadius] = useState('')

  const canConfirm = markerDescription.trim().length > 0

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({
      attackerPlayerId,
      attackerInstanceKey,
      attackerUnitName: attackerUnit.name,
      markerDescription: markerDescription.trim(),
      attackValue: Number(attackValue) || 0,
      damageValue: Number(damageValue) || 0,
      blastRadius: Number(blastRadius) || 0,
      placedOnTurn: currentTurn,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,8,3,0.96)' }}>
      <div className="w-full max-w-sm corner-clip-sm" style={{ background: '#111608', border: '1px solid #c9a84c' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a3a1a' }}>
          <div>
            <div className="font-mono text-xs font-bold tracking-widest uppercase" style={{ color: '#c9a84c' }}>
              Ordem de Artilharia
            </div>
            <div className="font-mono text-[10px] mt-0.5" style={{ color: '#5a7a4a' }}>
              {attackerUnit.name} — resolve no próximo Comando
            </div>
          </div>
          <button onClick={onClose} className="font-mono text-xs" style={{ color: '#c06060' }}>
            FECHAR
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div
            className="p-3 corner-clip-sm text-xs font-mono"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
          >
            Coloque o marcador de artilharia no campo de batalha. O ataque será resolvido no início
            do seu próximo estágio de Comando.
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#5a7a4a' }}>
              Descrição da posição do marcador *
            </label>
            <input
              type="text"
              placeholder="ex: 15&quot; à frente do Zibler, atrás da pedra"
              value={markerDescription}
              onChange={e => setMarkerDescription(e.target.value)}
              className="w-full px-2 py-1.5 font-mono text-xs corner-clip-sm"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#e8d5a0' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#5a7a4a' }}>
                ATK
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={attackValue}
                onChange={e => setAttackValue(e.target.value)}
                className="w-full px-2 py-1.5 font-mono text-xs corner-clip-sm"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#c9a84c' }}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#5a7a4a' }}>
                DMG
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={damageValue}
                onChange={e => setDamageValue(e.target.value)}
                className="w-full px-2 py-1.5 font-mono text-xs corner-clip-sm"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#c9a84c' }}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#5a7a4a' }}>
                Raio
              </label>
              <input
                type="number"
                min={0}
                placeholder='0"'
                value={blastRadius}
                onChange={e => setBlastRadius(e.target.value)}
                className="w-full px-2 py-1.5 font-mono text-xs corner-clip-sm"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#c9a84c' }}
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex justify-end gap-2" style={{ borderTop: '1px solid #2a3a1a' }}>
          <button
            onClick={onClose}
            className="px-3 py-1.5 font-mono text-xs"
            style={{ color: '#7a9a5a' }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-1.5 font-mono text-xs corner-clip-sm disabled:opacity-40"
            style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
          >
            REGISTRAR MARCADOR
          </button>
        </div>
      </div>
    </div>
  )
}
