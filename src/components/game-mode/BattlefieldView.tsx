'use client'

import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/api'
import { useT } from '@/hooks/useT'

export default function BattlefieldView({ draft }: { draft: Draft }) {
  const router = useRouter()
  const t = useT()

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#0a0f06' }}>
      <div
        className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid #2a3a1a' }}
      >
        <button
          onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=control`)}
          className="px-3 py-1 font-mono text-xs corner-clip-sm"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
        >
          ← {t('battlefield.back')}
        </button>
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: '#c9a84c' }}>
          {t('battlefield.title')}
        </span>
        <span className="font-mono text-xs" style={{ color: '#4a5e3a' }}>
          — {draft.name}
        </span>
      </div>

      <iframe
        src="/battlefield/campo_batalha.html"
        title={t('battlefield.title')}
        style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
        allow="pointer-events"
      />
    </div>
  )
}
