'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import { TERRAIN_CATEGORIES, terrainPdfUrl, type TerrainFeature, type PreparationState } from '@/lib/gameMode'
import { useT } from '@/hooks/useT'

interface TerrainPileSelectionProps {
  draft: Draft
  preparationState: PreparationState
  onUpdateState: (state: Partial<PreparationState>) => void
  onNextStage: () => void
}

const MAX_PER_PLAYER = 3

export default function TerrainPileSelection({ draft, preparationState, onUpdateState, onNextStage }: TerrainPileSelectionProps) {
  const t = useT()
  const playerIds = draft.results.map(r => r.playerId)

  // Track which player is currently selecting (index into playerIds)
  const [selectingIdx, setSelectingIdx] = useState(0)
  // Track confirmed players (their selections are locked and hidden)
  const [confirmedPlayerIds, setConfirmedPlayerIds] = useState<number[]>([])

  const currentPlayerId = playerIds[selectingIdx]
  const allConfirmed = confirmedPlayerIds.length === playerIds.length

  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `${t('control.player')} ${playerId}`
  }

  // Current player's in-progress selections (only visible to them)
  const currentSelections = preparationState.terrainPileItems.filter(t => t.playerId === currentPlayerId)
  const countForCurrent = currentSelections.length

  const handleAdd = (terrain: { name: string; code: string }) => {
    if (countForCurrent >= MAX_PER_PLAYER) return
    const newItem: TerrainFeature = {
      id: `pile-${currentPlayerId}-${Date.now()}`,
      playerId: currentPlayerId,
      name: terrain.name,
      code: terrain.code,
      x: 0,
      y: 0,
    }
    onUpdateState({ terrainPileItems: [...preparationState.terrainPileItems, newItem] })
  }

  const handleRemove = (id: string) => {
    onUpdateState({ terrainPileItems: preparationState.terrainPileItems.filter(t => t.id !== id) })
  }

  const handleConfirmPlayer = () => {
    const nextIdx = selectingIdx + 1
    setConfirmedPlayerIds(prev => [...prev, currentPlayerId])
    if (nextIdx >= playerIds.length) {
      // All players confirmed — proceed
      onNextStage()
    } else {
      setSelectingIdx(nextIdx)
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ background: '#0d1208' }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-2 text-center" style={{ color: '#c9a84c' }}>
          {t('terrainPile.title')}
        </h1>
        <p className="font-mono text-sm text-center mb-8" style={{ color: '#5a7a4a' }}>
          {t('terrainPile.subtitle')}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

          {/* Left: current player selection */}
          <div>
            {!allConfirmed ? (
              <div className="border" style={{ borderColor: '#c9a84c44', background: 'rgba(0,0,0,0.4)' }}>
                {/* Player header */}
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#3a4a2a', background: 'rgba(201,168,76,0.08)' }}>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#5a7a4a' }}>{t('terrainPile.selecting')}</div>
                    <div className="font-mono text-lg font-bold" style={{ color: '#c9a84c' }}>
                      {getPlayerDisplayName(currentPlayerId)}
                    </div>
                  </div>
                  <span className="font-mono text-sm px-3 py-1 rounded" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c44', color: '#c9a84c' }}>
                    {countForCurrent} / {MAX_PER_PLAYER}
                  </span>
                </div>

                {/* Current selections */}
                {currentSelections.length > 0 && (
                  <div className="px-4 py-3 border-b space-y-2" style={{ borderColor: '#2a3a1a' }}>
                    <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#5a7a4a' }}>
                      {t('terrainPile.yourSelections')}
                    </div>
                    {currentSelections.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-1 px-2" style={{ background: 'rgba(122,154,90,0.1)' }}>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold" style={{ color: '#c9a84c' }}>{item.code}</span>
                          <span className="font-mono text-sm" style={{ color: '#e8d5a0' }}>{item.name}</span>
                          <a href={terrainPdfUrl(item.code)} target="_blank" rel="noopener noreferrer"
                            className="font-mono text-[10px] px-1.5 py-0.5"
                            style={{ color: '#5a7a4a', border: '1px solid #3a4a2a' }}>
                            PDF
                          </a>
                        </div>
                        <button onClick={() => handleRemove(item.id)}
                          className="font-mono text-xs px-2 py-0.5"
                          style={{ color: '#c06060', border: '1px solid #5a2a2a', background: 'rgba(150,50,50,0.15)' }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Terrain picker */}
                {countForCurrent < MAX_PER_PLAYER ? (
                  <div className="px-4 py-4 space-y-4">
                    {TERRAIN_CATEGORIES.map(({ category, models }) => (
                      <div key={category}>
                        <div className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: '#4a5e3a' }}>{category}</div>
                        <div className="space-y-1">
                          {models.map(model => (
                            <div key={model.code} className="flex items-center gap-2">
                              <button
                                onClick={() => handleAdd(model)}
                                className="flex-1 flex items-center gap-3 px-3 py-2 text-left transition-colors"
                                style={{ border: '1px solid #3a4a2a', background: 'rgba(122,154,90,0.08)', color: '#e8d5a0' }}
                              >
                                <span className="font-mono text-xs font-bold" style={{ color: '#c9a84c' }}>{model.code}</span>
                                <span className="font-mono text-xs">{model.name}</span>
                              </button>
                              <a href={terrainPdfUrl(model.code)} target="_blank" rel="noopener noreferrer"
                                className="font-mono text-[10px] px-2 py-2 shrink-0"
                                style={{ border: '1px solid #3a4a2a', color: '#5a7a4a', background: 'rgba(0,0,0,0.3)' }}
                                onClick={e => e.stopPropagation()}>
                                PDF
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>{t('terrainPile.maxReached')}</span>
                  </div>
                )}

                {/* Confirm */}
                <div className="px-4 py-4 border-t" style={{ borderColor: '#3a4a2a' }}>
                  <button
                    onClick={handleConfirmPlayer}
                    className="w-full py-3 font-mono text-sm"
                    style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid #c9a84c', color: '#c9a84c' }}
                  >
                    {selectingIdx < playerIds.length - 1
                      ? `${t('terrainPile.confirmAndPassTo')} ${getPlayerDisplayName(playerIds[selectingIdx + 1])} →`
                      : t('terrainPile.confirmPile')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right: Pile summary (counts only, terrains hidden) */}
          <div>
            <div className="border sticky top-8" style={{ borderColor: '#3a4a2a', background: 'rgba(0,0,0,0.4)' }}>
              <div className="px-4 py-2 border-b" style={{ borderColor: '#3a4a2a' }}>
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#7a9a5a' }}>{t('terrainPile.sharedPile')}</span>
              </div>
              <div className="px-4 py-3 space-y-3">
                {playerIds.map(playerId => {
                  const isConfirmed = confirmedPlayerIds.includes(playerId)
                  const isCurrent = playerId === currentPlayerId && !allConfirmed
                  const count = isConfirmed
                    ? preparationState.terrainPileItems.filter(t => t.playerId === playerId).length
                    : isCurrent
                    ? countForCurrent
                    : 0

                  return (
                    <div key={playerId}>
                      <div className="font-mono text-[10px] mb-1" style={{ color: isConfirmed ? '#7a9a5a' : '#4a5e3a' }}>
                        {getPlayerDisplayName(playerId)}
                        {isConfirmed && <span className="ml-2" style={{ color: '#5a7a4a' }}>✓</span>}
                        {isCurrent && <span className="ml-2" style={{ color: '#c9a84c' }}>{t('terrainPile.selectingStatus')}</span>}
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: MAX_PER_PLAYER }).map((_, i) => (
                          <div key={i} className="w-8 h-8 flex items-center justify-center font-mono text-xs"
                            style={{
                              border: `1px solid ${i < count ? '#3a4a2a' : '#1a2a12'}`,
                              background: i < count ? 'rgba(122,154,90,0.15)' : 'rgba(0,0,0,0.2)',
                              color: i < count ? '#7a9a5a' : '#2a3a1a',
                            }}>
                            {i < count ? '?' : '·'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="px-4 py-2 border-t" style={{ borderColor: '#2a3a1a' }}>
                <p className="font-mono text-[10px]" style={{ color: '#3a4a2a' }}>
                  {t('terrainPile.revealedLater')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
