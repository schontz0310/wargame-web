'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/api'
import { useGameSession } from '@/hooks/useGameSession'
import { computeOrdersTotal, nextStage, ORDER_STAGES, type OrderStage } from '@/lib/gameMode'
import { useBattleLog } from '@/hooks/useBattleLog'
import { safeLocalStorage } from '@/lib/storage'
import CommandPhasePanel from './CommandPhasePanel'

const STAGE_LABELS: Record<OrderStage, string> = {
  command: 'Comando',
  order: 'Ordens',
  cleanup: 'Limpeza',
}

interface ControlPanelProps {
  draft: Draft
}

export default function ControlPanel({ draft }: ControlPanelProps) {
  const router = useRouter()
  const {
    session,
    getPlayerState,
    advanceStage,
    setBuildTotal,
    addVictoryPoints,
    resolveArtilleryAttack,
    resetSession,
  } = useGameSession(draft.id, draft.results)
  const { appendEvent, clearLog } = useBattleLog(draft.id)
  const [viewedPlayerId, setViewedPlayerId] = useState<number>(draft.results[0]?.playerId ?? 1)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => { setIsClient(true) }, [])

  useEffect(() => {
    if (!isClient) return
    const raw = safeLocalStorage.getItem('myDrafts')
    if (raw) {
      try { setDrafts(JSON.parse(raw) as Draft[]) } catch { setDrafts([]) }
    }
  }, [isClient])

  const handleResetToPreparation = () => {
    const updatedDrafts = drafts.map(d =>
      d.id === draft.id ? { ...d, preparationCompleted: false } : d
    )
    setDrafts(updatedDrafts)
    if (isClient) safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    safeLocalStorage.removeItem(`preparation-state-${draft.id}`)
    resetSession()
    clearLog()
    setConfirmingReset(false)
    window.location.reload()
  }

  const handleResetBattleOnly = () => {
    resetSession()
    clearLog()
    setConfirmingReset(false)
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0d1208' }}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">[ CARREGANDO SESSÃO... ]</div>
      </div>
    )
  }

  const activePlayer = draft.results.find(r => r.playerId === session.activePlayerId)
  const activePlayerState = getPlayerState(session.activePlayerId)
  const ordersTotal = computeOrdersTotal(activePlayer?.armyPoints ?? session.buildTotal)
  const round = Math.ceil(session.turn / Math.max(1, draft.results.length))

  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `Jogador ${playerId}`
  }

  const goToArmy = (playerId: number) => {
    router.push(`/game-mode?draftId=${draft.id}&view=army&player=${playerId}&page=1`)
  }

  const handleAdvanceStage = () => {
    const toStage = nextStage(session.stage)
    appendEvent({
      turn: session.turn,
      stage: session.stage,
      playerId: session.activePlayerId,
      type: 'stage_change',
      payload: { toStage },
    })
    advanceStage()
  }

  const handleProceedToOrders = () => {
    appendEvent({
      turn: session.turn,
      stage: 'command',
      playerId: session.activePlayerId,
      type: 'stage_change',
      payload: { toStage: 'order' },
    })
    advanceStage()
  }

  const handleResolveArtillery = (attackId: string) => {
    const attack = session.pendingArtillery.find(a => a.id === attackId)
    if (attack) {
      appendEvent({
        turn: session.turn,
        stage: 'command',
        playerId: session.activePlayerId,
        type: 'artillery_resolved',
        payload: {
          attackerUnitName: attack.attackerUnitName,
          hit: true,
          drifted: false,
          damageDelta: 0,
        },
      })
    }
    resolveArtilleryAttack(attackId)
  }

  const handleAddVP = (playerId: number, points: number) => {
    if (points <= 0) return
    addVictoryPoints(playerId, points)
    appendEvent({
      turn: session.turn,
      stage: 'command',
      playerId,
      type: 'vp_scored',
      payload: { points, reason: `${points} unidade(s) na zona adversária (VC3)` },
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col p-4 sm:p-6 gap-4"
      style={{ background: 'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-widest uppercase" style={{ color: '#e8d5a0' }}>
            {draft.name}
          </h1>
          <p className="font-mono text-xs mt-0.5" style={{ color: '#5a7a4a' }}>
            Turno {session.turn} · Rodada {round}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=log`)}
            className="px-3 py-1.5 font-mono text-xs corner-clip-sm"
            style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
          >
            VER LOG
          </button>
          <button
            onClick={() => setConfirmingReset(true)}
            className="px-3 py-1.5 font-mono text-xs corner-clip-sm"
            style={{ background: 'rgba(150,50,50,0.15)', border: '1px solid #5a2a2a', color: '#c06060' }}
          >
            RESETAR
          </button>
        </div>
      </div>

      {/* Stage indicator */}
      <div className="flex gap-2 flex-shrink-0">
        {ORDER_STAGES.map(stage => (
          <div
            key={stage}
            className="flex-1 text-center py-2 font-mono text-xs tracking-widest uppercase corner-clip-sm"
            style={{
              background: session.stage === stage ? 'rgba(201,168,76,0.15)' : 'rgba(0,0,0,0.3)',
              border: session.stage === stage ? '1px solid #c9a84c' : '1px solid #2a3a1a',
              color: session.stage === stage ? '#c9a84c' : '#4a5e3a',
            }}
          >
            {STAGE_LABELS[stage]}
          </div>
        ))}
      </div>

      {/* Player tabs */}
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        {draft.results.map(result => {
          const isActive = result.playerId === session.activePlayerId
          const isViewed = result.playerId === viewedPlayerId
          const vp = session.victoryPoints[result.playerId] ?? 0
          const displayName = getPlayerDisplayName(result.playerId)
          return (
            <button
              key={result.playerId}
              onClick={() => setViewedPlayerId(result.playerId)}
              className="px-4 py-2 font-mono text-xs corner-clip-sm transition-colors text-left"
              style={{
                background: isActive ? 'rgba(201,168,76,0.15)' : isViewed ? 'rgba(122,154,90,0.1)' : 'rgba(0,0,0,0.3)',
                border: isActive ? '1px solid #c9a84c' : '1px solid #3a4a2a',
                color: isActive ? '#c9a84c' : '#7a9a5a',
                boxShadow: isActive ? '0 0 8px rgba(201,168,76,0.4)' : 'none',
              }}
            >
              <div>{displayName}</div>
              {vp > 0 && (
                <div className="font-mono text-[9px] opacity-70">{vp} VP</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Stage-specific body */}
      {session.stage === 'command' ? (
        <CommandPhasePanel
          draft={draft}
          session={session}
          getPlayerDisplayName={getPlayerDisplayName}
          onResolveArtillery={handleResolveArtillery}
          onAddVictoryPoints={handleAddVP}
          onProceedToOrders={handleProceedToOrders}
        />
      ) : (
        <>
          {/* Orders counter */}
          {session.stage === 'order' && (
            <div
              className="p-3 corner-clip-sm flex items-center gap-3"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}
            >
              <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>ORDENS</span>
              <span className="font-mono text-sm font-bold" style={{ color: '#c9a84c' }}>
                {activePlayerState.ordersUsed}/{ordersTotal}
              </span>
              <span className="font-mono text-[10px] ml-auto" style={{ color: '#3a5a2a' }}>build total</span>
              <input
                type="number"
                min={150}
                step={150}
                placeholder="300"
                defaultValue={session.buildTotal}
                className="w-24 px-2 py-1 text-xs font-mono"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#c9a84c' }}
                onBlur={e => {
                  const value = Number(e.target.value)
                  if (value > 0) setBuildTotal(value)
                }}
              />
            </div>
          )}

          {/* Cleanup info */}
          {session.stage === 'cleanup' && (
            <div
              className="p-3 corner-clip-sm space-y-1"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}
            >
              <div className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: '#c9a84c' }}>
                Fase de Limpeza
              </div>
              <ul className="font-mono text-[10px] space-y-1 mt-2" style={{ color: '#7a9a5a' }}>
                <li>• Remova tokens de ordem de unidades que não receberam ordens</li>
                <li>• Mechs sem ordem perdem 1 calor (gire o dial de calor)</li>
                <li>• Mechs em água rasa sem ordem no início/fim perdem 1 calor adicional</li>
                <li>• Ordens não usadas são perdidas</li>
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap mt-auto">
            <button
              onClick={handleAdvanceStage}
              className="px-4 py-2 font-mono text-xs corner-clip-sm"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
            >
              {session.stage === 'order' ? 'INICIAR LIMPEZA →' : 'PRÓXIMO TURNO →'}
            </button>
            <button
              onClick={() => goToArmy(viewedPlayerId)}
              className="px-4 py-2 font-mono text-xs corner-clip-sm"
              style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
            >
              VER ARMY
            </button>
          </div>
        </>
      )}

      {/* Reset dialog */}
      {confirmingReset && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="p-6 corner-clip-sm max-w-sm w-full mx-4" style={{ background: '#111608', border: '1px solid #5a2a2a' }}>
            <p className="font-mono text-sm mb-4" style={{ color: '#e8d5a0' }}>Escolha o tipo de reset:</p>
            <div className="space-y-3 mb-4">
              <button
                onClick={handleResetToPreparation}
                className="w-full p-3 font-mono text-xs corner-clip-sm text-left"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid #c9a84c', color: '#c9a84c' }}
              >
                <div className="font-bold mb-1">RESETAR PARA FASE PREPARATÓRIA</div>
                <div className="opacity-70">Reseta tudo e volta para a fase preparatória</div>
              </button>
              <button
                onClick={handleResetBattleOnly}
                className="w-full p-3 font-mono text-xs corner-clip-sm text-left"
                style={{ background: 'rgba(150,50,50,0.1)', border: '1px solid #5a2a2a', color: '#c06060' }}
              >
                <div className="font-bold mb-1">RESETAR APENAS BATALHA</div>
                <div className="opacity-70">Zera turno, estágios, ordens, dano/calor e log</div>
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setConfirmingReset(false)}
                className="px-3 py-1.5 font-mono text-xs"
                style={{ color: '#7a9a5a' }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
