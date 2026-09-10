'use client'

import { useEffect, useRef } from 'react'
import type { Draft } from '@/lib/api'
import { getInstanceKey } from '@/lib/gameMode'
import { useT } from '@/hooks/useT'

interface Props {
  draft: Draft
  onNextStage: () => void
  onBack: () => void
}

export default function DeploymentCanvas({ draft, onNextStage, onBack }: Props) {
  const t = useT()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const sendInit = () => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage({
      type: 'DEPLOYMENT_INIT',
      players: draft.results.map((result, idx) => ({
        playerId: result.playerId,
        side: idx + 1,
        alias: result.playerAlias || result.playerName || `P${result.playerId}`,
        units: result.armyUnits.map((u, i) => ({
          id: u.id,
          name: u.name,
          type: u.type,
          instanceKey: getInstanceKey(i, u.id),
        })),
      })),
    }, '*')
  }

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'DEPLOYMENT_DONE') onNextStage()
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onNextStage])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#0a0f06', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', flexShrink: 0, background: 'rgba(0,0,0,0.7)', borderBottom: '1px solid #2a3a1a' }}>
        <button
          onClick={onBack}
          className="px-3 py-1 font-mono text-xs corner-clip-sm"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
        >
          ← {t('battlefield.back')}
        </button>
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: '#c9a84c' }}>
          {t('deployment.digitalTitle')}
        </span>
      </div>
      <iframe
        ref={iframeRef}
        src="/battlefield/campo_batalha.html"
        title={t('deployment.digitalTitle')}
        onLoad={sendInit}
        style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
        allow="pointer-events"
      />
    </div>
  )
}
