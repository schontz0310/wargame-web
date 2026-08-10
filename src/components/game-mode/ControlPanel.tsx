'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/api'
import { useGameSession } from '@/hooks/useGameSession'
import { computeOrdersTotal, ORDER_STAGES, type OrderStage } from '@/lib/gameMode'

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
  const { session, getPlayerState, advanceStage, setBuildTotalOverride, resetSession } = useGameSession(draft.id, draft.results)
  const [viewedPlayerId, setViewedPlayerId] = useState<number>(draft.results[0]?.playerId ?? 1)
  const [confirmingReset, setConfirmingReset] = useState(false)

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0d1208' }}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">[ CARREGANDO SESSÃO... ]</div>
      </div>
    )
  }

  const activePlayer = draft.results.find(r => r.playerId === session.activePlayerId)
  const activePlayerState = getPlayerState(session.activePlayerId)
  const overriddenPoints = session.buildTotalOverride[session.activePlayerId]
  const ordersTotal = computeOrdersTotal(overriddenPoints ?? activePlayer?.armyPoints ?? 0)
  const round = Math.ceil(session.turn / Math.max(1, draft.results.length))

  const goToArmy = (playerId: number) => {
    router.push(`/game-mode?draftId=${draft.id}&view=army&player=${playerId}&page=1`)
  }

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-8 gap-6" style={{ background: 'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono tracking-widest uppercase" style={{ color: '#e8d5a0' }}>{draft.name}</h1>
          <p className="font-mono text-xs mt-1" style={{ color: '#5a7a4a' }}>Turno {session.turn} · Rodada {round}</p>
        </div>
        <button
          onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=log`)}
          className="px-3 py-1.5 font-mono text-xs corner-clip-sm"
          style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
        >
          VER LOG
        </button>
      </div>

      <div className="flex gap-2">
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

      <div className="flex gap-2 flex-wrap">
        {draft.results.map(result => {
          const isActive = result.playerId === session.activePlayerId
          const isViewed = result.playerId === viewedPlayerId
          return (
            <button
              key={result.playerId}
              onClick={() => setViewedPlayerId(result.playerId)}
              className="px-4 py-2 font-mono text-xs corner-clip-sm transition-colors"
              style={{
                background: isActive ? 'rgba(201,168,76,0.15)' : isViewed ? 'rgba(122,154,90,0.1)' : 'rgba(0,0,0,0.3)',
                border: isActive ? '1px solid #c9a84c' : '1px solid #3a4a2a',
                color: isActive ? '#c9a84c' : '#7a9a5a',
                boxShadow: isActive ? '0 0 8px rgba(201,168,76,0.4)' : 'none',
              }}
            >
              {result.playerName}
            </button>
          )
        })}
      </div>

      {session.stage === 'order' && (
        <div className="p-3 corner-clip-sm flex items-center gap-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}>
          <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>ORDENS</span>
          <span className="font-mono text-sm font-bold" style={{ color: '#c9a84c' }}>{activePlayerState.ordersUsed}/{ordersTotal}</span>
          <input
            type="number"
            min={1}
            placeholder="build total"
            defaultValue={overriddenPoints ?? undefined}
            className="ml-auto w-28 px-2 py-1 text-xs font-mono"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#c9a84c' }}
            onBlur={e => {
              const value = Number(e.target.value)
              if (value > 0) setBuildTotalOverride(session.activePlayerId, value)
            }}
          />
        </div>
      )}

      <div className="flex gap-3 flex-wrap mt-auto">
        <button
          onClick={advanceStage}
          className="px-4 py-2 font-mono text-xs corner-clip-sm"
          style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
        >
          PRÓXIMO ESTÁGIO
        </button>
        <button
          onClick={() => goToArmy(viewedPlayerId)}
          className="px-4 py-2 font-mono text-xs corner-clip-sm"
          style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
        >
          VER ARMY
        </button>
        <button
          onClick={() => setConfirmingReset(true)}
          className="px-4 py-2 font-mono text-xs corner-clip-sm ml-auto"
          style={{ background: 'rgba(150,50,50,0.15)', border: '1px solid #5a2a2a', color: '#c06060' }}
        >
          RESETAR PARTIDA
        </button>
      </div>

      {confirmingReset && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="p-6 corner-clip-sm max-w-sm" style={{ background: '#111608', border: '1px solid #5a2a2a' }}>
            <p className="font-mono text-sm mb-4" style={{ color: '#e8d5a0' }}>
              Isso zera turno, estágios, ordens, dano/calor e o log de todos os jogadores deste draft.
              Exporte o log antes se quiser guardá-lo (VER LOG → EXPORTAR).
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmingReset(false)} className="px-3 py-1.5 font-mono text-xs" style={{ color: '#7a9a5a' }}>
                CANCELAR
              </button>
              <button
                onClick={() => { resetSession(); setConfirmingReset(false) }}
                className="px-3 py-1.5 font-mono text-xs corner-clip-sm"
                style={{ background: 'rgba(150,50,50,0.2)', border: '1px solid #5a2a2a', color: '#c06060' }}
              >
                RESETAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
