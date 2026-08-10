// src/components/game-mode/AttackSequenceOverlay.tsx
'use client'

import { useMemo, useState } from 'react'
import type { Draft, DraftUnit } from '@/lib/api'
import type { UnitDialState } from '@/hooks/useGameSession'
import { getInstanceKey, ORDER_TYPE_LABELS } from '@/lib/gameMode'
import GameDialCard from './GameDialCard'

const STEP_LABELS = [
  'Declarar o(s) alvo(s) do ataque',
  'Declarar tentativa de captura, se aplicável',
  'Atacante cancela equipamento especial opcional e define modificadores ao ataque',
  'Alvo cancela equipamento especial opcional e define modificadores à defesa',
  'Rolar o ataque e determinar se acerta',
  'Calcular o dano',
  'Aplicar calor gerado aos afetados',
  'Gerou um ataque adicional? Se sim, volte ao passo 2',
  'Dar o marcador de ordem ao atacante',
  'Aplicar dano de push e calor ao atacante, se houver',
]

export interface AttackResolutionResult {
  attacker: { playerId: number; instanceKey: string; name: string; damageDelta: number; heatDelta: number }
  targets: { playerId: number; instanceKey: string; name: string; damageDelta: number; heatDelta: number }[]
  orderType: 'ranged' | 'close'
}

interface TargetCandidate {
  playerId: number
  playerName: string
  instanceKey: string
  draftUnit: DraftUnit
}

interface AttackSequenceOverlayProps {
  draft: Draft
  attackerPlayerId: number
  attackerUnit: DraftUnit
  attackerInstanceKey: string
  orderType: 'ranged' | 'close'
  getDialState: (playerId: number, instanceKey: string) => UnitDialState
  setDialClicks: (playerId: number, instanceKey: string, clicks: Partial<UnitDialState>) => void
  onOrderMarked: () => void
  onComplete: (result: AttackResolutionResult) => void
  onClose: () => void
}

export default function AttackSequenceOverlay({
  draft,
  attackerPlayerId,
  attackerUnit,
  attackerInstanceKey,
  orderType,
  getDialState,
  setDialClicks,
  onOrderMarked,
  onComplete,
  onClose,
}: AttackSequenceOverlayProps) {
  const [completedSteps, setCompletedSteps] = useState(0)
  const [selectedTargetKeys, setSelectedTargetKeys] = useState<string[]>([])
  const [attackerStart] = useState<UnitDialState>(() => getDialState(attackerPlayerId, attackerInstanceKey))

  const targetCandidates: TargetCandidate[] = useMemo(() => {
    const list: TargetCandidate[] = []
    draft.results.forEach(result => {
      if (result.playerId === attackerPlayerId) return
      result.armyUnits.forEach((draftUnit, index) => {
        list.push({
          playerId: result.playerId,
          playerName: result.playerName,
          instanceKey: getInstanceKey(index, draftUnit.id),
          draftUnit,
        })
      })
    })
    return list
  }, [draft, attackerPlayerId])

  const selectedTargets = targetCandidates.filter(t => selectedTargetKeys.includes(`${t.playerId}:${t.instanceKey}`))
  const [targetStartState] = useState<Map<string, UnitDialState>>(() => new Map())

  const canCompleteStep1 = selectedTargetKeys.length > 0

  const markStepDone = (stepIndex: number) => {
    if (stepIndex !== completedSteps) return
    if (stepIndex === 0 && !canCompleteStep1) return

    if (stepIndex === 0) {
      // Snapshot each selected target's dial state right as targeting is locked in.
      selectedTargets.forEach(t => {
        const key = `${t.playerId}:${t.instanceKey}`
        if (!targetStartState.has(key)) {
          targetStartState.set(key, getDialState(t.playerId, t.instanceKey))
        }
      })
    }

    const next = completedSteps + 1
    setCompletedSteps(next)

    if (next === 9) {
      onOrderMarked()
    }

    if (next === 10) {
      const attackerEnd = getDialState(attackerPlayerId, attackerInstanceKey)
      const result: AttackResolutionResult = {
        attacker: {
          playerId: attackerPlayerId,
          instanceKey: attackerInstanceKey,
          name: attackerUnit.name,
          damageDelta: attackerEnd.damageClicks - attackerStart.damageClicks,
          heatDelta: attackerEnd.heatClicks - attackerStart.heatClicks,
        },
        targets: selectedTargets.map(t => {
          const key = `${t.playerId}:${t.instanceKey}`
          const start = targetStartState.get(key) ?? { damageClicks: 0, heatClicks: 0 }
          const end = getDialState(t.playerId, t.instanceKey)
          return {
            playerId: t.playerId,
            instanceKey: t.instanceKey,
            name: t.draftUnit.name,
            damageDelta: end.damageClicks - start.damageClicks,
            heatDelta: end.heatClicks - start.heatClicks,
          }
        }),
        orderType,
      }
      onComplete(result)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col p-4 overflow-y-auto" style={{ background: 'rgba(5,8,3,0.96)' }}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="font-mono text-sm tracking-widest uppercase" style={{ color: '#c9a84c' }}>
          Assistente de Ataque · {ORDER_TYPE_LABELS[orderType]}
        </h2>
        <button onClick={onClose} className="font-mono text-xs" style={{ color: '#c06060' }}>FECHAR</button>
      </div>

      <div className="flex gap-3 mb-4 flex-shrink-0 overflow-x-auto">
        <div style={{ width: 220, height: 220, flexShrink: 0 }}>
          <GameDialCard
            draftUnit={attackerUnit}
            instanceKey={attackerInstanceKey}
            damageClicks={getDialState(attackerPlayerId, attackerInstanceKey).damageClicks}
            heatClicks={getDialState(attackerPlayerId, attackerInstanceKey).heatClicks}
            onDamageChange={clicks => setDialClicks(attackerPlayerId, attackerInstanceKey, { damageClicks: clicks })}
            onHeatChange={clicks => setDialClicks(attackerPlayerId, attackerInstanceKey, { heatClicks: clicks })}
          />
        </div>
        {selectedTargets.map(t => (
          <div key={`${t.playerId}:${t.instanceKey}`} style={{ width: 220, height: 220, flexShrink: 0 }}>
            <GameDialCard
              draftUnit={t.draftUnit}
              instanceKey={t.instanceKey}
              damageClicks={getDialState(t.playerId, t.instanceKey).damageClicks}
              heatClicks={getDialState(t.playerId, t.instanceKey).heatClicks}
              onDamageChange={clicks => setDialClicks(t.playerId, t.instanceKey, { damageClicks: clicks })}
              onHeatChange={clicks => setDialClicks(t.playerId, t.instanceKey, { heatClicks: clicks })}
            />
          </div>
        ))}
      </div>

      {completedSteps === 0 && (
        <div className="mb-4 flex-shrink-0">
          <div className="font-mono text-xs mb-2" style={{ color: '#5a7a4a' }}>Selecione o(s) alvo(s):</div>
          <div className="flex flex-wrap gap-2">
            {targetCandidates.map(t => {
              const key = `${t.playerId}:${t.instanceKey}`
              const isSelected = selectedTargetKeys.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTargetKeys(prev => isSelected ? prev.filter(k => k !== key) : [...prev, key])}
                  className="px-2 py-1 font-mono text-[10px] corner-clip-sm"
                  style={{
                    background: isSelected ? 'rgba(201,168,76,0.15)' : 'rgba(0,0,0,0.3)',
                    border: isSelected ? '1px solid #c9a84c' : '1px solid #3a4a2a',
                    color: isSelected ? '#c9a84c' : '#7a9a5a',
                  }}
                >
                  {t.playerName} — {t.draftUnit.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-1 flex-1 min-h-0 overflow-y-auto">
        {STEP_LABELS.map((label, idx) => {
          const isDone = idx < completedSteps
          const isCurrent = idx === completedSteps
          return (
            <button
              key={idx}
              onClick={() => markStepDone(idx)}
              disabled={!isCurrent || (idx === 0 && !canCompleteStep1)}
              className="w-full text-left flex items-center gap-3 px-3 py-2 font-mono text-xs corner-clip-sm disabled:opacity-40"
              style={{
                background: isDone ? 'rgba(122,154,90,0.1)' : isCurrent ? 'rgba(201,168,76,0.1)' : 'rgba(0,0,0,0.2)',
                border: isCurrent ? '1px solid #c9a84c' : '1px solid #2a3a1a',
                color: isDone ? '#7a9a5a' : isCurrent ? '#c9a84c' : '#4a5e3a',
              }}
            >
              <span>{isDone ? '✓' : idx + 1}</span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
