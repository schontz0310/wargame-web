// src/components/game-mode/ArtilleryResolutionOverlay.tsx
'use client'

import { useState } from 'react'
import type { PendingArtilleryAttack } from '@/lib/gameMode'

// Drift direction table: black die result (1-6) -> direction label
const DRIFT_DIRECTIONS = ['Frente', 'Frente-Direita', 'Trás-Direita', 'Trás', 'Trás-Esquerda', 'Frente-Esquerda']

// Drift distance ranges from rulebook p.26: compare attack result to marker's attack result ranges
const DRIFT_DISTANCE_HINT = 'Compare o resultado do ataque com as faixas do marcador para determinar a distância de desvio.'

interface ArtilleryResolutionResult {
  hit: boolean
  drifted: boolean
  driftDirection?: string
  driftDistance?: string
  damageDelta: number
}

interface ArtilleryResolutionOverlayProps {
  attack: PendingArtilleryAttack
  onComplete: (result: ArtilleryResolutionResult) => void
  onClose: () => void
}

const STEPS = [
  'Rolar o dado de ataque (2 brancos + 1 preto) e somar ao valor de ATK',
  'Comparar resultado com o Target Value do marcador',
  'Se acertou: aplicar dano (DMG) a todas as unidades no raio de explosão',
  'Se errou: aplicar desvio — rolar dado branco para direção e determinar distância',
  'Aplicar dano nas unidades na nova posição do marcador',
  'Remover o marcador do campo de batalha',
]

export default function ArtilleryResolutionOverlay({
  attack,
  onComplete,
  onClose,
}: ArtilleryResolutionOverlayProps) {
  const [completedSteps, setCompletedSteps] = useState(0)
  const [hit, setHit] = useState<boolean | null>(null)
  const [driftDirection, setDriftDirection] = useState('')
  const [driftDistance, setDriftDistance] = useState('')
  const [damageDelta, setDamageDelta] = useState(0)

  const markStepDone = (idx: number) => {
    if (idx !== completedSteps) return

    // Step 1 (idx=1): must declare hit or miss
    if (idx === 1 && hit === null) return

    const next = completedSteps + 1
    setCompletedSteps(next)

    // Skip steps 3/4 based on hit/miss
    if (idx === 1) {
      if (hit) {
        // Skip drift steps → jump to step 2 (apply damage)
        setCompletedSteps(2)
      } else {
        // Skip apply damage step → jump to step 3 (drift)
        setCompletedSteps(3)
      }
      return
    }

    if (next >= STEPS.length) {
      onComplete({
        hit: hit ?? false,
        drifted: !hit,
        driftDirection: driftDirection || undefined,
        driftDistance: driftDistance || undefined,
        damageDelta,
      })
    }
  }

  const isCurrent = (idx: number) => idx === completedSteps
  const isDone = (idx: number) => idx < completedSteps

  // Steps 2 and 3/4/5 are conditionally shown based on hit
  const visibleSteps = hit === null
    ? STEPS.slice(0, 2) // only show first 2 until hit/miss declared
    : hit
      ? [STEPS[0], STEPS[1], STEPS[2], STEPS[5]] // hit path
      : [STEPS[0], STEPS[1], STEPS[3], STEPS[4], STEPS[5]] // drift path

  return (
    <div className="fixed inset-0 z-50 flex flex-col p-4 overflow-y-auto" style={{ background: 'rgba(5,8,3,0.96)' }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="font-mono text-sm tracking-widest uppercase" style={{ color: '#c9a84c' }}>
            Resolução de Artilharia
          </h2>
          <p className="font-mono text-[10px] mt-0.5" style={{ color: '#5a7a4a' }}>
            {attack.attackerUnitName} · ATK {attack.attackValue} · DMG {attack.damageValue} · Raio {attack.blastRadius}&quot;
          </p>
        </div>
        <button onClick={onClose} className="font-mono text-xs" style={{ color: '#c06060' }}>FECHAR</button>
      </div>

      {/* Marker info */}
      <div className="mb-4 p-3 corner-clip-sm flex-shrink-0" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a' }}>
        <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#5a7a4a' }}>Posição do marcador</div>
        <div className="font-mono text-xs" style={{ color: '#e8d5a0' }}>{attack.markerDescription}</div>
        <div className="font-mono text-[10px] mt-1" style={{ color: '#5a7a4a' }}>Colocado no turno {attack.placedOnTurn}</div>
      </div>

      {/* Step 1: declare hit or miss after roll */}
      {completedSteps >= 1 && hit === null && (
        <div className="mb-4 flex-shrink-0">
          <div className="font-mono text-xs mb-2" style={{ color: '#5a7a4a' }}>O ataque acertou o alvo?</div>
          <div className="flex gap-2">
            <button
              onClick={() => setHit(true)}
              className="px-4 py-2 font-mono text-xs corner-clip-sm"
              style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #7a9a5a', color: '#7a9a5a' }}
            >
              ACERTOU
            </button>
            <button
              onClick={() => setHit(false)}
              className="px-4 py-2 font-mono text-xs corner-clip-sm"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid #c9a84c', color: '#c9a84c' }}
            >
              ERROU (desvio)
            </button>
          </div>
        </div>
      )}

      {/* Drift inputs — shown when miss declared and on drift steps */}
      {hit === false && completedSteps >= 3 && completedSteps < STEPS.length && (
        <div className="mb-4 flex-shrink-0 space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#5a7a4a' }}>
            {DRIFT_DISTANCE_HINT}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[10px] mb-1" style={{ color: '#5a7a4a' }}>Direção (dado preto 1-6)</label>
              <select
                value={driftDirection}
                onChange={e => setDriftDirection(e.target.value)}
                className="w-full px-2 py-1.5 font-mono text-xs corner-clip-sm"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#e8d5a0' }}
              >
                <option value="">— selecionar —</option>
                {DRIFT_DIRECTIONS.map((d, i) => (
                  <option key={i} value={d}>{i + 1} — {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] mb-1" style={{ color: '#5a7a4a' }}>Distância de desvio</label>
              <input
                type="text"
                placeholder='ex: 3"'
                value={driftDistance}
                onChange={e => setDriftDistance(e.target.value)}
                className="w-full px-2 py-1.5 font-mono text-xs corner-clip-sm"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#e8d5a0' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Damage input — shown when hit or after drift applied */}
      {((hit === true && completedSteps >= 2) || (hit === false && completedSteps >= 4)) && completedSteps < STEPS.length && (
        <div className="mb-4 flex-shrink-0">
          <label className="block font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#5a7a4a' }}>
            Dano total aplicado (cliques no dial)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDamageDelta(d => Math.max(0, d - 1))}
              className="w-8 h-8 font-mono text-sm corner-clip-sm"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
            >−</button>
            <span className="font-mono text-lg font-bold" style={{ color: '#c9a84c', minWidth: 32, textAlign: 'center' }}>{damageDelta}</span>
            <button
              onClick={() => setDamageDelta(d => d + 1)}
              className="w-8 h-8 font-mono text-sm corner-clip-sm"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
            >+</button>
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-1">
        {visibleSteps.map((label, visIdx) => {
          const globalIdx = STEPS.indexOf(label)
          const done = isDone(globalIdx)
          const current = isCurrent(globalIdx)
          const blocked = current && globalIdx === 1 && hit === null
          return (
            <button
              key={globalIdx}
              onClick={() => markStepDone(globalIdx)}
              disabled={!current || blocked}
              className="w-full text-left flex items-center gap-3 px-3 py-2 font-mono text-xs corner-clip-sm disabled:opacity-40"
              style={{
                background: done ? 'rgba(122,154,90,0.1)' : current ? 'rgba(201,168,76,0.1)' : 'rgba(0,0,0,0.2)',
                border: current ? '1px solid #c9a84c' : '1px solid #2a3a1a',
                color: done ? '#7a9a5a' : current ? '#c9a84c' : '#4a5e3a',
              }}
            >
              <span className="flex-shrink-0">{done ? '✓' : visIdx + 1}</span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
