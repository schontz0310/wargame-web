'use client'

import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/api'

interface DraftPickerProps {
  drafts: Draft[]
  invalidDraftId: string | null
}

export default function DraftPicker({ drafts, invalidDraftId }: DraftPickerProps) {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex flex-col items-center p-8"
      style={{ background: 'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)' }}
    >
      <h1 className="text-lg font-bold font-mono tracking-widest uppercase mb-1" style={{ color: '#e8d5a0' }}>
        Modo Jogo
      </h1>
      <p className="text-xs font-mono mb-6" style={{ color: '#5a7a4a' }}>
        Escolha um draft salvo para acompanhar a partida
      </p>

      {invalidDraftId && (
        <div
          className="mb-4 px-4 py-2 font-mono text-xs corner-clip-sm"
          style={{ background: 'rgba(150,50,50,0.15)', border: '1px solid #5a2a2a', color: '#c06060' }}
        >
          Draft &quot;{invalidDraftId}&quot; não encontrado.
        </div>
      )}

      <div className="w-full max-w-md space-y-2">
        {drafts.length === 0 ? (
          <p className="font-mono text-xs text-center py-8" style={{ color: '#3a5a2a' }}>
            Nenhum draft salvo. Crie um em /drafts primeiro.
          </p>
        ) : (
          drafts.map(draft => (
            <button
              key={draft.id}
              onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=control`)}
              className="w-full text-left p-3 corner-clip-sm transition-colors"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a' }}
            >
              <div className="font-mono text-sm font-bold" style={{ color: '#e8d5a0' }}>{draft.name}</div>
              <div className="font-mono text-xs mt-0.5" style={{ color: '#5a7a4a' }}>
                {draft.results?.length || 0} jogadores
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
