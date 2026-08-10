'use client'

import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/api'
import { useGameSession } from '@/hooks/useGameSession'
import { getInstanceKey } from '@/lib/gameMode'
import GameDialCard from './GameDialCard'

const PAGE_SIZE = 6

interface ArmyGridProps {
  draft: Draft
  viewedPlayerId: number
  page: number
}

export default function ArmyGrid({ draft, viewedPlayerId, page }: ArmyGridProps) {
  const router = useRouter()
  const { session, getPlayerState, setDialClicks } = useGameSession(draft.id, draft.results)
  const result = draft.results.find(r => r.playerId === viewedPlayerId)

  if (!session || !result) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0d1208' }}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">[ CARREGANDO... ]</div>
      </div>
    )
  }

  const armyUnits = result.armyUnits
  const totalPages = Math.max(1, Math.ceil(armyUnits.length / PAGE_SIZE))
  const clampedPage = Math.min(Math.max(1, page), totalPages)
  const pageUnits = armyUnits.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)
  const playerState = getPlayerState(viewedPlayerId)

  const goToPage = (nextPage: number) => {
    router.push(`/game-mode?draftId=${draft.id}&view=army&player=${viewedPlayerId}&page=${nextPage}`)
  }

  if (armyUnits.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0d1208' }}>
        <div className="font-mono text-sm" style={{ color: '#c9a84c' }}>{result.playerName} não tem unidades no army</div>
        <a href="/drafts" className="font-mono text-xs" style={{ color: '#7a9a5a' }}>← Voltar para /drafts</a>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col p-3 gap-3" style={{ background: 'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)' }}>
      <div className="flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=control`)}
          className="font-mono text-xs tracking-widest uppercase"
          style={{ color: '#c9a84c' }}
        >
          ← Painel de Controle
        </button>
        <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>{result.playerName} · Página {clampedPage}/{totalPages}</span>
        <div className="flex gap-2">
          <button onClick={() => goToPage(clampedPage - 1)} disabled={clampedPage <= 1} className="px-2 py-1 font-mono text-xs disabled:opacity-30" style={{ color: '#7a9a5a' }}>◀</button>
          <button onClick={() => goToPage(clampedPage + 1)} disabled={clampedPage >= totalPages} className="px-2 py-1 font-mono text-xs disabled:opacity-30" style={{ color: '#7a9a5a' }}>▶</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)' }}>
        {pageUnits.map((draftUnit, idxOnPage) => {
          const index = (clampedPage - 1) * PAGE_SIZE + idxOnPage
          const instanceKey = getInstanceKey(index, draftUnit.id)
          const dialState = playerState.units[instanceKey] ?? { damageClicks: 0, heatClicks: 0 }
          return (
            <GameDialCard
              key={instanceKey}
              draftUnit={draftUnit}
              instanceKey={instanceKey}
              damageClicks={dialState.damageClicks}
              heatClicks={dialState.heatClicks}
              onDamageChange={clicks => setDialClicks(viewedPlayerId, instanceKey, { damageClicks: clicks })}
              onHeatChange={clicks => setDialClicks(viewedPlayerId, instanceKey, { heatClicks: clicks })}
            />
          )
        })}
      </div>
    </div>
  )
}
