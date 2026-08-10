'use client'

import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/api'
import { useBattleLog, buildNarrativeText, eventToNarrativeLine } from '@/hooks/useBattleLog'

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

interface BattleLogViewProps {
  draft: Draft
}

export default function BattleLogView({ draft }: BattleLogViewProps) {
  const router = useRouter()
  const { events } = useBattleLog(draft.id)
  const playerNameById = Object.fromEntries(draft.results.map(r => [r.playerId, r.playerName]))
  const orderedEvents = [...events].reverse()

  const exportJson = () => {
    downloadFile(`battle-log-${draft.id}.json`, JSON.stringify(events, null, 2), 'application/json')
  }

  const exportNarrative = () => {
    const text = buildNarrativeText(events, draft.name, playerNameById)
    downloadFile(`battle-log-${draft.id}.txt`, text, 'text/plain')
  }

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-8 gap-4" style={{ background: 'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)' }}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=control`)}
          className="font-mono text-xs tracking-widest uppercase"
          style={{ color: '#c9a84c' }}
        >
          ← Painel de Controle
        </button>
        <h1 className="font-mono text-sm tracking-widest uppercase" style={{ color: '#e8d5a0' }}>Log de Batalha</h1>
      </div>

      <div className="flex gap-2">
        <button
          onClick={exportJson}
          disabled={events.length === 0}
          className="px-3 py-1.5 font-mono text-xs corner-clip-sm disabled:opacity-30"
          style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
        >
          EXPORTAR JSON
        </button>
        <button
          onClick={exportNarrative}
          disabled={events.length === 0}
          className="px-3 py-1.5 font-mono text-xs corner-clip-sm disabled:opacity-30"
          style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
        >
          EXPORTAR NARRATIVA
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {orderedEvents.length === 0 ? (
          <p className="font-mono text-xs text-center py-8" style={{ color: '#3a5a2a' }}>Nenhuma ação registrada ainda.</p>
        ) : (
          orderedEvents.map(event => (
            <div
              key={event.id}
              className="px-3 py-2 font-mono text-xs corner-clip-sm"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a', color: '#c8bfa0' }}
            >
              {eventToNarrativeLine(event, playerNameById[event.playerId] ?? `Jogador ${event.playerId}`)}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
