'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import { terrainPdfUrl, type PreparationState } from '@/lib/gameMode'
import { useT } from '@/hooks/useT'
import BattlefieldCanvas from './BattlefieldCanvas'

interface TerrainPlacementProps {
  draft: Draft
  preparationState: PreparationState
  onUpdateState: (state: Partial<PreparationState>) => void
  onNextStage: () => void
}

export default function TerrainPlacement({ draft, preparationState, onUpdateState, onNextStage }: TerrainPlacementProps) {
  const t = useT()

  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `${t('control.player')} ${playerId}`
  }

  const playerIds = draft.results.map(r => r.playerId)
  const firstPlayerId = preparationState.firstPlayerId ?? playerIds[0]
  const firstIdx = playerIds.indexOf(firstPlayerId)

  const [mode, setMode] = useState<'physical' | 'digital' | null>(null)
  // actionCount tracks placements + discards so the turn always advances correctly
  const [actionCount, setActionCount] = useState(0)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const currentTurnIdx = (firstIdx + actionCount) % playerIds.length
  const currentTurnPlayerId = playerIds[currentTurnIdx]

  const pile = preparationState.terrainPileItems
  const placed = preparationState.terrainFeatures
  const selectedItem = pile.find(t => t.id === selectedItemId) ?? null

  const nextPlayer = () => {
    const nextIdx = (playerIds.indexOf(currentTurnPlayerId) + 1) % playerIds.length
    return playerIds[nextIdx]
  }

  // Place selected terrain on battlefield
  const handleConfirmPlacement = () => {
    if (!selectedItem) return
    onUpdateState({
      terrainPileItems: pile.filter(t => t.id !== selectedItem.id),
      terrainFeatures: [...placed, selectedItem],
    })
    setSelectedItemId(null)
    setActionCount(c => c + 1)
  }

  // Discard: no valid location exists (rules: p.13 — set aside if no valid spot)
  const handleDiscard = () => {
    if (!selectedItem) return
    onUpdateState({
      terrainPileItems: pile.filter(t => t.id !== selectedItem.id),
    })
    setSelectedItemId(null)
    setActionCount(c => c + 1)
  }

  // Undo last placement (also rolls back the turn)
  const handleUndo = () => {
    if (placed.length === 0) return
    const last = placed[placed.length - 1]
    onUpdateState({
      terrainFeatures: placed.slice(0, -1),
      terrainPileItems: [...pile, last],
    })
    setSelectedItemId(null)
    setActionCount(c => Math.max(0, c - 1))
  }

  if (mode === 'digital') {
    return (
      <BattlefieldCanvas
        preparationState={preparationState}
        onNextStage={onNextStage}
        onBack={() => setMode(null)}
      />
    )
  }

  if (mode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0d1208' }}>
        <div className="max-w-lg w-full space-y-4">
          <h2 className="font-mono text-sm tracking-widest uppercase text-center mb-8" style={{ color: '#c9a84c' }}>
            {t('terrainPlacement.chooseMode')}
          </h2>
          <button
            onClick={() => setMode('physical')}
            className="w-full p-5 font-mono text-left corner-clip-sm"
            style={{ background: 'rgba(122,154,90,0.1)', border: '1px solid #3a5a2a', color: '#e8d5a0' }}
          >
            <div className="text-sm font-bold mb-1" style={{ color: '#7a9a5a' }}>{t('terrainPlacement.modePhysical')}</div>
            <div className="text-xs" style={{ color: '#4a5e3a' }}>{t('terrainPlacement.modePhysicalDesc')}</div>
          </button>
          <button
            onClick={() => setMode('digital')}
            className="w-full p-5 font-mono text-left corner-clip-sm"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid #c9a84c44', color: '#e8d5a0' }}
          >
            <div className="text-sm font-bold mb-1" style={{ color: '#c9a84c' }}>{t('terrainPlacement.modeDigital')}</div>
            <div className="text-xs" style={{ color: '#7a6a3a' }}>{t('terrainPlacement.modeDigitalDesc')}</div>
          </button>
        </div>
      </div>
    )
  }

  if (pile.length === 0 && placed.length === 0) {
    return (
      <div className="min-h-screen p-8" style={{ background: '#0d1208' }}>
        <div className="max-w-4xl mx-auto text-center p-8" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a' }}>
          <p className="font-mono text-lg mb-6" style={{ color: '#a0a090' }}>{t('terrainPlacement.emptyPile')}</p>
          <button onClick={onNextStage} className="px-8 py-3 font-mono text-lg"
            style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}>
            {t('terrainPlacement.nextPhase')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8" style={{ background: '#0d1208' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-mono font-bold text-center" style={{ color: '#c9a84c' }}>
          {t('terrainPlacement.title')}
        </h1>

        {/* Rules reminder */}
        <div className="p-3 border" style={{ background: 'rgba(0,0,0,0.25)', borderColor: '#2a3a1a' }}>
          <p className="font-mono text-xs" style={{ color: '#5a7a4a' }}>
            {t('terrainPlacement.rulesHint')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* Left: pile + action */}
          <div className="space-y-4">

            {/* Active player */}
            {pile.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border"
                style={{ background: 'rgba(201,168,76,0.08)', borderColor: '#c9a84c44' }}>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#5a7a4a' }}>{t('terrainPlacement.currentTurn')}</div>
                  <div className="font-mono text-lg font-bold" style={{ color: '#c9a84c' }}>
                    {getPlayerDisplayName(currentTurnPlayerId)}
                  </div>
                </div>
                <div className="font-mono text-xs" style={{ color: '#4a5e3a' }}>
                  {t('terrainPlacement.next')} {getPlayerDisplayName(nextPlayer())}
                </div>
              </div>
            )}

            {/* Pile */}
            {pile.length > 0 ? (
              <div className="border" style={{ borderColor: '#3a4a2a', background: 'rgba(0,0,0,0.3)' }}>
                <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: '#3a4a2a' }}>
                  <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#7a9a5a' }}>{t('terrainPlacement.sharedPile')}</span>
                  <span className="font-mono text-xs" style={{ color: '#c9a84c' }}>{pile.length} {t('terrainPlacement.remaining')}</span>
                </div>
                <div className="p-3 space-y-1">
                  {pile.map(item => {
                    const isSelected = item.id === selectedItemId
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemId(isSelected ? null : item.id)}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer transition-all"
                        style={{
                          border: isSelected ? '1px solid #c9a84c' : '1px solid #2a3a1a',
                          background: isSelected ? 'rgba(201,168,76,0.12)' : 'rgba(122,154,90,0.06)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected && <span style={{ color: '#c9a84c' }}>▶</span>}
                          <span className="font-mono text-sm font-bold" style={{ color: isSelected ? '#c9a84c' : '#e8d5a0' }}>
                            {item.code}
                          </span>
                          <span className="font-mono text-sm" style={{ color: '#a0a090' }}>{item.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5"
                            style={{ color: '#5a7a4a', border: '1px solid #2a3a1a', background: 'rgba(0,0,0,0.3)' }}>
                            {getPlayerDisplayName(item.playerId)}
                          </span>
                        </div>
                        <a href={terrainPdfUrl(item.code)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="font-mono text-[10px] px-2 py-1 shrink-0"
                          style={{ color: '#5a7a4a', border: '1px solid #2a3a1a', background: 'rgba(0,0,0,0.4)' }}>
                          PDF
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center border" style={{ borderColor: '#3a4a2a', background: 'rgba(0,0,0,0.3)' }}>
                <span className="font-mono text-sm" style={{ color: '#5a7a4a' }}>{t('terrainPlacement.pileEmpty')}</span>
              </div>
            )}

            {/* Action buttons when item selected */}
            {selectedItem && (
              <div className="p-4 border space-y-3" style={{ borderColor: '#c9a84c44', background: 'rgba(201,168,76,0.06)' }}>
                <div className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
                  {t('terrainPlacement.selected')} <span className="font-bold" style={{ color: '#c9a84c' }}>{selectedItem.code}</span> {selectedItem.name}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmPlacement}
                    className="flex-1 py-3 font-mono text-sm"
                    style={{ background: 'rgba(122,154,90,0.25)', border: '1px solid #7a9a5a', color: '#7a9a5a' }}
                  >
                    {t('terrainPlacement.placed')}
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="px-4 py-3 font-mono text-xs"
                    style={{ background: 'rgba(150,80,20,0.2)', border: '1px solid #6a4a2a', color: '#aa7a4a' }}
                    title={t('terrainPlacement.noValidLocation')}
                  >
                    {t('terrainPlacement.noValidLocation')}
                  </button>
                </div>
              </div>
            )}

            {/* End phase / undo */}
            <div className="flex items-center justify-between gap-3">
              {placed.length > 0 && (
                <button onClick={handleUndo} className="font-mono text-xs px-3 py-2"
                  style={{ color: '#7a5a2a', border: '1px solid #4a3a1a', background: 'rgba(100,70,20,0.15)' }}>
                  {t('terrainPlacement.undo')}
                </button>
              )}
              {pile.length === 0 && (
                <button onClick={onNextStage} className="ml-auto px-8 py-3 font-mono text-base"
                  style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}>
                  {t('terrainPlacement.nextPhase')}
                </button>
              )}
            </div>
          </div>

          {/* Right: on battlefield */}
          <div>
            <div className="border sticky top-8" style={{ borderColor: '#3a4a2a', background: 'rgba(0,0,0,0.4)' }}>
              <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: '#3a4a2a' }}>
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#7a9a5a' }}>{t('terrainPlacement.onField')}</span>
                <span className="font-mono text-xs" style={{ color: '#7a9a5a' }}>{placed.length}</span>
              </div>
              {placed.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="font-mono text-xs" style={{ color: '#2a3a1a' }}>{t('terrainPlacement.noneYet')}</p>
                </div>
              ) : (
                <div className="px-3 py-3 space-y-1">
                  {placed.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 py-1">
                      <span className="font-mono text-[10px] w-4 text-right shrink-0" style={{ color: '#3a5a2a' }}>{idx + 1}.</span>
                      <span className="font-mono text-xs font-bold" style={{ color: '#4a6a3a' }}>{item.code}</span>
                      <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
