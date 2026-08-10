'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { safeLocalStorage } from '@/lib/storage'
import type { Draft } from '@/lib/api'
import DraftPicker from '@/components/game-mode/DraftPicker'
import ControlPanel from '@/components/game-mode/ControlPanel'
import ArmyGrid from '@/components/game-mode/ArmyGrid'

function GameModeContent() {
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draftId')
  const view = searchParams.get('view') ?? 'control'
  const playerParam = searchParams.get('player')
  const pageParam = searchParams.get('page')

  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => { setIsClient(true) }, [])

  useEffect(() => {
    if (!isClient) return
    const raw = safeLocalStorage.getItem('myDrafts')
    if (raw) {
      try {
        setDrafts(JSON.parse(raw) as Draft[])
      } catch {
        setDrafts([])
      }
    }
  }, [isClient])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0d1208' }}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">[ CARREGANDO... ]</div>
      </div>
    )
  }

  const draft = drafts.find(d => d.id === draftId) ?? null

  if (!draftId || !draft) {
    return <DraftPicker drafts={drafts} invalidDraftId={draftId} />
  }

  const viewedPlayerId = playerParam ? Number(playerParam) : draft.results[0]?.playerId
  const page = pageParam ? Math.max(1, Number(pageParam)) : 1

  if (view === 'army') {
    return <ArmyGrid draft={draft} viewedPlayerId={viewedPlayerId ?? draft.results[0]?.playerId ?? 1} page={page} />
  }

  if (view === 'log') {
    // TODO(Task 10): render <BattleLogView draft={draft} />
    return <div className="p-8 font-mono text-xs" style={{ color: '#7a9a5a' }}>Log view placeholder</div>
  }

  return <ControlPanel draft={draft} />
}

export default function GameModePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameModeContent />
    </Suspense>
  )
}
