'use client'

import { useEffect, useRef } from 'react'
import type { PreparationState } from '@/lib/gameMode'
import { useT } from '@/hooks/useT'

interface Props {
  preparationState: PreparationState
  onNextStage: () => void
  onBack: () => void
}

export default function BattlefieldCanvas({ preparationState, onNextStage, onBack }: Props) {
  const t = useT()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const sendInit = () => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage({
      type: 'BATTLEFIELD_INIT',
      pile: preparationState.terrainPileItems.map(item => ({
        code: item.code,
        playerId: item.playerId,
      })),
      firstPlayerId: preparationState.firstPlayerId ?? 1,
    }, '*')
  }

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'BATTLEFIELD_DONE') onNextStage()
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onNextStage])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#0a0f06', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '8px 16px', flexShrink: 0,
          background: 'rgba(0,0,0,0.7)', borderBottom: '1px solid #2a3a1a',
        }}
      >
        <button
          onClick={onBack}
          className="px-3 py-1 font-mono text-xs corner-clip-sm"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
        >
          ← {t('battlefield.back')}
        </button>
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: '#c9a84c' }}>
          {t('battlefield.title')}
        </span>
        <span className="font-mono text-xs" style={{ color: '#4a5e3a', marginLeft: 'auto' }}>
          {t('battlefield.doneHint')}
        </span>
        <button
          onClick={onNextStage}
          className="px-3 py-1 font-mono text-xs corner-clip-sm"
          style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid #c9a84c', color: '#c9a84c' }}
        >
          {t('battlefield.finishButton')} →
        </button>
      </div>
      <iframe
        ref={iframeRef}
        src="/battlefield/campo_batalha.html"
        title={t('battlefield.title')}
        onLoad={sendInit}
        style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
        allow="pointer-events"
      />
    </div>
  )
}
