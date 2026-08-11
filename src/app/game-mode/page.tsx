'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { safeLocalStorage } from '@/lib/storage'
import type { Draft } from '@/lib/api'
import DraftPicker from '@/components/game-mode/DraftPicker'
import ControlPanel from '@/components/game-mode/ControlPanel'
import ArmyGrid from '@/components/game-mode/ArmyGrid'
import BattleLogView from '@/components/game-mode/BattleLogView'
import PreparationPhase from '@/components/game-mode/preparation/PreparationPhase'

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

  // Preparation phase - automatically show if not completed
  if (!draft.preparationCompleted) {
    return <PreparationPhase draft={draft} onUpdateDraft={(updatedDraft) => {
      const updatedDrafts = drafts.map(d => d.id === updatedDraft.id ? updatedDraft : d)
      setDrafts(updatedDrafts)
      if (isClient) {
        safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
      }
    }} onComplete={() => {
      // Mark preparation as completed and redirect to control panel
      const updatedDrafts = drafts.map(d => 
        d.id === draft.id ? { ...d, preparationCompleted: true } : d
      )
      setDrafts(updatedDrafts)
      if (isClient) {
        safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
      }
      window.location.href = `/game-mode?draftId=${draft.id}&view=control`
    }} />
  }

  // If preparation is completed, ignore the view parameter and go to control
  const requestedPlayerId = playerParam ? Number(playerParam) : null
  const viewedPlayerId =
    requestedPlayerId !== null && draft.results.some(r => r.playerId === requestedPlayerId)
      ? requestedPlayerId
      : draft.results[0]?.playerId ?? 1

  const requestedPage = pageParam ? Number(pageParam) : 1
  const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? requestedPage : 1

  if (view === 'army') {
    return <ArmyGrid draft={draft} viewedPlayerId={viewedPlayerId} page={page} />
  }

  if (view === 'log') {
    return <BattleLogView draft={draft} />
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
