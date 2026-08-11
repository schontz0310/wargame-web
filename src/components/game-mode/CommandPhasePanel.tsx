// src/components/game-mode/CommandPhasePanel.tsx
'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import type { GameSessionState } from '@/hooks/useGameSession'
import { FACTION_COMMAND_ABILITIES, type PendingArtilleryAttack } from '@/lib/gameMode'
import ArtilleryResolutionOverlay from './ArtilleryResolutionOverlay'

interface CommandPhasePanelProps {
  draft: Draft
  session: GameSessionState
  getPlayerDisplayName: (playerId: number) => string
  onResolveArtillery: (attackId: string) => void
  onAddVictoryPoints: (playerId: number, points: number) => void
  onProceedToOrders: () => void
}

export default function CommandPhasePanel({
  draft,
  session,
  getPlayerDisplayName,
  onResolveArtillery,
  onAddVictoryPoints,
  onProceedToOrders,
}: CommandPhasePanelProps) {
  const [resolvingAttack, setResolvingAttack] = useState<PendingArtilleryAttack | null>(null)
  const [deploymentUnitCounts, setDeploymentUnitCounts] = useState<Record<number, number>>({})
  const [vpApplied, setVpApplied] = useState(false)
  const [appliedFactionAbilities, setAppliedFactionAbilities] = useState<Set<string>>(new Set())

  // Artillery pending for the active player this command stage
  const myPendingArtillery = session.pendingArtillery.filter(
    a => a.attackerPlayerId === session.activePlayerId
  )

  // Factions present in ALL players' armies (to show relevant abilities)
  const factionsInGame = new Set(
    draft.results.flatMap(r => r.armyUnits.map(u => u.faction))
  )
  const relevantAbilities = Array.from(factionsInGame).flatMap(faction => {
    const abilities = FACTION_COMMAND_ABILITIES[faction] ?? []
    return abilities.map(a => ({ faction, ...a }))
  })

  const handleVpApply = () => {
    let totalAdded = 0
    for (const [playerIdStr, count] of Object.entries(deploymentUnitCounts)) {
      const playerId = Number(playerIdStr)
      if (count > 0) {
        onAddVictoryPoints(playerId, count)
        totalAdded += count
      }
    }
    if (totalAdded > 0) setVpApplied(true)
  }

  const allArtilleryResolved = myPendingArtillery.length === 0
  const canProceed = allArtilleryResolved

  return (
    <>
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">

        {/* ① Artillery */}
        <section className="corner-clip-sm" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid #1a2a0a' }}>
            <span className="font-mono text-[10px] tracking-widest uppercase font-bold" style={{ color: '#c9a84c' }}>
              ① Artilharia Pendente
            </span>
            {allArtilleryResolved && (
              <span className="font-mono text-[9px] tracking-widest" style={{ color: '#7a9a5a' }}>✓ limpo</span>
            )}
          </div>

          <div className="p-3">
            {myPendingArtillery.length === 0 ? (
              <p className="font-mono text-xs" style={{ color: '#3a5a2a' }}>
                Nenhum ataque de artilharia pendente.
              </p>
            ) : (
              <div className="space-y-2">
                {myPendingArtillery.map(attack => (
                  <div
                    key={attack.id}
                    className="p-3 corner-clip-sm"
                    style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid #c9a84c' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold truncate" style={{ color: '#e8d5a0' }}>
                          {attack.attackerUnitName}
                        </div>
                        <div className="font-mono text-[10px] mt-0.5" style={{ color: '#7a9a5a' }}>
                          ATK {attack.attackValue} · DMG {attack.damageValue} · Raio {attack.blastRadius}&quot;
                        </div>
                        <div className="font-mono text-[10px] mt-0.5 truncate" style={{ color: '#5a7a4a' }}>
                          Marcador: {attack.markerDescription}
                        </div>
                        <div className="font-mono text-[9px] mt-0.5" style={{ color: '#3a5a2a' }}>
                          Colocado no turno {attack.placedOnTurn}
                        </div>
                      </div>
                      <button
                        onClick={() => setResolvingAttack(attack)}
                        className="px-2 py-1 font-mono text-[10px] corner-clip-sm flex-shrink-0"
                        style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
                      >
                        RESOLVER
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ② Victory Condition 3 */}
        <section className="corner-clip-sm" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid #1a2a0a' }}>
            <span className="font-mono text-[10px] tracking-widest uppercase font-bold" style={{ color: '#c9a84c' }}>
              ② Pontos de Vitória — Zona Adversária
            </span>
            {vpApplied && (
              <span className="font-mono text-[9px] tracking-widest" style={{ color: '#7a9a5a' }}>✓ marcado</span>
            )}
          </div>

          <div className="p-3 space-y-3">
            <p className="font-mono text-[10px]" style={{ color: '#5a7a4a' }}>
              Marque 1 VP por unidade sua que ocupe a zona de deployment do oponente neste turno.
            </p>

            {draft.results.map(result => {
              const vp = session.victoryPoints[result.playerId] ?? 0
              const count = deploymentUnitCounts[result.playerId] ?? 0
              return (
                <div key={result.playerId} className="flex items-center gap-3">
                  <span className="font-mono text-xs flex-1 truncate" style={{ color: '#e8d5a0' }}>
                    {getPlayerDisplayName(result.playerId)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDeploymentUnitCounts(prev => ({ ...prev, [result.playerId]: Math.max(0, (prev[result.playerId] ?? 0) - 1) }))}
                      className="w-6 h-6 font-mono text-sm corner-clip-sm"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                    >−</button>
                    <span className="font-mono text-sm font-bold" style={{ color: '#c9a84c', minWidth: 24, textAlign: 'center' }}>{count}</span>
                    <button
                      onClick={() => setDeploymentUnitCounts(prev => ({ ...prev, [result.playerId]: (prev[result.playerId] ?? 0) + 1 }))}
                      className="w-6 h-6 font-mono text-sm corner-clip-sm"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                    >+</button>
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: '#5a7a4a', minWidth: 52, textAlign: 'right' }}>
                    Total: {vp} VP
                  </span>
                </div>
              )
            })}

            <button
              onClick={handleVpApply}
              disabled={vpApplied || Object.values(deploymentUnitCounts).every(c => c === 0)}
              className="px-3 py-1.5 font-mono text-xs corner-clip-sm disabled:opacity-40"
              style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
            >
              {vpApplied ? '✓ VP MARCADOS' : 'REGISTRAR VP'}
            </button>
          </div>
        </section>

        {/* ③ Faction Abilities */}
        {relevantAbilities.length > 0 && (
          <section className="corner-clip-sm" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}>
            <div className="px-3 py-2" style={{ borderBottom: '1px solid #1a2a0a' }}>
              <span className="font-mono text-[10px] tracking-widest uppercase font-bold" style={{ color: '#c9a84c' }}>
                ③ Faction Abilities — Fase de Comando
              </span>
            </div>

            <div className="p-3 space-y-2">
              {relevantAbilities.map((ability, idx) => {
                const key = `${ability.faction}-${ability.abilityName}`
                const applied = appliedFactionAbilities.has(key)
                return (
                  <div
                    key={idx}
                    className="p-3 corner-clip-sm"
                    style={{
                      background: applied ? 'rgba(122,154,90,0.08)' : 'rgba(0,0,0,0.2)',
                      border: applied ? '1px solid #3a4a2a' : '1px solid #2a3a1a',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[10px] font-bold" style={{ color: applied ? '#5a7a4a' : '#c9a84c' }}>
                          {ability.faction} — {ability.abilityName}
                        </div>
                        <p className="font-mono text-[10px] mt-1 leading-relaxed" style={{ color: '#7a9a5a' }}>
                          {ability.description}
                        </p>
                        {ability.requirementHint && (
                          <p className="font-mono text-[9px] mt-1 italic" style={{ color: '#4a5e3a' }}>
                            {ability.requirementHint}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setAppliedFactionAbilities(prev => {
                          const next = new Set(prev)
                          if (next.has(key)) next.delete(key); else next.add(key)
                          return next
                        })}
                        className="px-2 py-0.5 font-mono text-[9px] corner-clip-sm flex-shrink-0"
                        style={{
                          background: applied ? 'rgba(122,154,90,0.15)' : 'rgba(0,0,0,0.3)',
                          border: '1px solid #3a4a2a',
                          color: applied ? '#7a9a5a' : '#5a7a4a',
                        }}
                      >
                        {applied ? '✓' : 'USAR'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Proceed button */}
      <div className="flex-shrink-0 pt-4">
        {!allArtilleryResolved && (
          <p className="font-mono text-[10px] mb-2 text-center" style={{ color: '#c06060' }}>
            Resolva todos os ataques de artilharia antes de avançar.
          </p>
        )}
        <button
          onClick={onProceedToOrders}
          disabled={!canProceed}
          className="w-full py-3 font-mono text-xs tracking-widest uppercase corner-clip-sm disabled:opacity-40"
          style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
        >
          INICIAR FASE DE ORDENS →
        </button>
      </div>

      {/* Artillery resolution overlay */}
      {resolvingAttack && (
        <ArtilleryResolutionOverlay
          attack={resolvingAttack}
          onComplete={result => {
            onResolveArtillery(resolvingAttack.id)
            setResolvingAttack(null)
            // result is passed up via log in ControlPanel
            void result
          }}
          onClose={() => setResolvingAttack(null)}
        />
      )}
    </>
  )
}
