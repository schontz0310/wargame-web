// src/components/game-mode/CommandPhasePanel.tsx
'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import type { CommandReminder, GameSessionState } from '@/hooks/useGameSession'
import { FACTION_COMMAND_ABILITIES, type PendingArtilleryAttack } from '@/lib/gameMode'
import ArtilleryResolutionOverlay from './ArtilleryResolutionOverlay'

interface CommandPhasePanelProps {
  draft: Draft
  session: GameSessionState
  getPlayerDisplayName: (playerId: number) => string
  onResolveArtillery: (attackId: string) => void
  onAddVictoryPoints: (playerId: number, points: number) => void
  onProceedToOrders: () => void
  reminders: CommandReminder[]
  onAddReminder: (text: string) => void
  onToggleReminder: (id: string) => void
  onRemoveReminder: (id: string) => void
}

export default function CommandPhasePanel({
  draft,
  session,
  getPlayerDisplayName,
  onResolveArtillery,
  onAddVictoryPoints,
  onProceedToOrders,
  reminders,
  onAddReminder,
  onToggleReminder,
  onRemoveReminder,
}: CommandPhasePanelProps) {
  const [resolvingAttack, setResolvingAttack] = useState<PendingArtilleryAttack | null>(null)
  const [deploymentUnitCount, setDeploymentUnitCount] = useState(0)
  const [vpApplied, setVpApplied] = useState(false)
  const [appliedFactionAbilities, setAppliedFactionAbilities] = useState<Set<string>>(new Set())
  const [newReminderText, setNewReminderText] = useState('')

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

  const handleAddReminder = () => {
    const trimmed = newReminderText.trim()
    if (!trimmed) return
    onAddReminder(trimmed)
    setNewReminderText('')
  }

  const handleVpApply = () => {
    if (deploymentUnitCount > 0) {
      onAddVictoryPoints(session.activePlayerId, deploymentUnitCount)
      setVpApplied(true)
    }
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
              Marque 1 VP por unidade sua que ocupa a zona de deployment do oponente agora, no início desta fase de Comando.
            </p>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs flex-1 truncate" style={{ color: '#e8d5a0' }}>
                {getPlayerDisplayName(session.activePlayerId)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDeploymentUnitCount(prev => Math.max(0, prev - 1))}
                  className="w-6 h-6 font-mono text-sm corner-clip-sm"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                >−</button>
                <span className="font-mono text-sm font-bold" style={{ color: '#c9a84c', minWidth: 24, textAlign: 'center' }}>{deploymentUnitCount}</span>
                <button
                  onClick={() => setDeploymentUnitCount(prev => prev + 1)}
                  className="w-6 h-6 font-mono text-sm corner-clip-sm"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                >+</button>
              </div>
              <span className="font-mono text-[10px]" style={{ color: '#5a7a4a', minWidth: 52, textAlign: 'right' }}>
                Total: {session.victoryPoints[session.activePlayerId] ?? 0} VP
              </span>
            </div>

            <button
              onClick={handleVpApply}
              disabled={vpApplied || deploymentUnitCount === 0}
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

        {/* ④ Command reminders */}
        <section className="corner-clip-sm" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}>
          <div className="px-3 py-2" style={{ borderBottom: '1px solid #1a2a0a' }}>
            <span className="font-mono text-[10px] tracking-widest uppercase font-bold" style={{ color: '#c9a84c' }}>
              ④ Lembretes de Comando
            </span>
          </div>

          <div className="p-3 space-y-3">
            <p className="font-mono text-[10px]" style={{ color: '#5a7a4a' }}>
              Anote efeitos de SEC, Faction Pride, Pilot ou outros que você precisa lembrar de resolver nesta fase.
              Os itens ficam marcados só nesta fase — na próxima fase de Comando eles voltam desmarcados.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newReminderText}
                onChange={e => setNewReminderText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddReminder() }}
                placeholder="Ex: Resolver habilidade do Pilot X"
                className="flex-1 px-2 py-1.5 font-mono text-xs"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#e8d5a0' }}
              />
              <button
                onClick={handleAddReminder}
                disabled={!newReminderText.trim()}
                className="px-3 py-1.5 font-mono text-xs corner-clip-sm disabled:opacity-40"
                style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
              >
                ADICIONAR
              </button>
            </div>

            {reminders.length === 0 ? (
              <p className="font-mono text-[10px]" style={{ color: '#3a5a2a' }}>
                Nenhum lembrete adicionado.
              </p>
            ) : (
              <div className="space-y-1.5">
                {reminders.map(reminder => (
                  <div key={reminder.id} className="flex items-center gap-2 p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <button
                      onClick={() => onToggleReminder(reminder.id)}
                      className="w-5 h-5 flex-shrink-0 flex items-center justify-center font-mono text-xs corner-clip-sm"
                      style={{
                        background: reminder.checked ? 'rgba(122,154,90,0.3)' : 'rgba(0,0,0,0.3)',
                        border: reminder.checked ? '1px solid #7a9a5a' : '1px solid #3a4a2a',
                        color: '#c9a84c',
                      }}
                    >
                      {reminder.checked ? '✓' : ''}
                    </button>
                    <span
                      className="flex-1 font-mono text-xs"
                      style={{
                        color: reminder.checked ? '#4a5e3a' : '#e8d5a0',
                        textDecoration: reminder.checked ? 'line-through' : 'none',
                      }}
                    >
                      {reminder.text}
                    </span>
                    <button
                      onClick={() => onRemoveReminder(reminder.id)}
                      className="px-1.5 font-mono text-xs flex-shrink-0"
                      style={{ color: '#6a3a3a' }}
                      title="Remover lembrete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
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
