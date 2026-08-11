'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import { type TerrainFeature, type PreparationState } from '@/lib/gameMode'

interface TerrainPlacementProps {
  draft: Draft
  preparationState: PreparationState
  onUpdateState: (state: Partial<PreparationState>) => void
  onNextStage: () => void
}

export default function TerrainPlacement({ draft, preparationState, onUpdateState, onNextStage }: TerrainPlacementProps) {
  const [currentPlacingPlayer, setCurrentPlacingPlayer] = useState<number | null>(() => {
    // Initialize with first player immediately
    return preparationState.firstPlayerId ?? draft.results[0]?.playerId ?? 1
  })
  const [selectedTerrain, setSelectedTerrain] = useState<string | null>(null)

  // Helper to get display name (alias or original name)
  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `Jogador ${playerId}`
  }

  // Calculate total terrain in pile
  const totalTerrain = Array.from(preparationState.terrainPile.values()).reduce((sum, count) => sum + count, 0)
  const placedTerrain = preparationState.terrainFeatures.length
  const maxTerrain = placedTerrain + totalTerrain // Total terrain = placed + remaining

  // Determine next player to place terrain (clockwise from first player)
  const getNextPlacingPlayer = (currentPlayerId: number) => {
    const playerIds = draft.results.map(r => r.playerId)
    const currentIndex = playerIds.indexOf(currentPlayerId)
    const nextIndex = (currentIndex + 1) % playerIds.length
    return playerIds[nextIndex]
  }

  const handlePlaceTerrain = (terrainName: string) => {
    // Ensure we have a current player
    let placingPlayerId = currentPlacingPlayer
    if (placingPlayerId === null) {
      placingPlayerId = preparationState.firstPlayerId ?? draft.results[0]?.playerId ?? 1
      setCurrentPlacingPlayer(placingPlayerId)
    }

    // Check if this player has terrain left to place
    let playerTerrainCount = preparationState.terrainPile.get(placingPlayerId) ?? 0
    
    // If current player has no terrain, find next player who does
    let checkedPlayers = 0
    while (playerTerrainCount <= 0 && checkedPlayers < draft.results.length) {
      placingPlayerId = getNextPlacingPlayer(placingPlayerId)
      playerTerrainCount = preparationState.terrainPile.get(placingPlayerId) ?? 0
      checkedPlayers++
    }

    if (playerTerrainCount <= 0) {
      // No more terrain to place
      return
    }

    const newTerrain: TerrainFeature = {
      id: `terrain-${Date.now()}`,
      playerId: placingPlayerId,
      name: terrainName,
      x: 0, // Will be set by user on battlefield
      y: 0  // Will be set by user on battlefield
    }

    const updatedFeatures = [...preparationState.terrainFeatures, newTerrain]
    const updatedPile = new Map(preparationState.terrainPile)
    const currentCount = updatedPile.get(newTerrain.playerId) ?? 0
    updatedPile.set(newTerrain.playerId, Math.max(0, currentCount - 1))

    onUpdateState({
      terrainFeatures: updatedFeatures,
      terrainPile: updatedPile
    })

    // Move to next player who still has terrain to place
    if (updatedFeatures.length < maxTerrain) {
      let nextPlayerId = getNextPlacingPlayer(placingPlayerId)
      let nextPlayerTerrainCount = updatedPile.get(nextPlayerId) ?? 0
      
      // Find next player with terrain
      checkedPlayers = 0
      while (nextPlayerTerrainCount <= 0 && checkedPlayers < draft.results.length) {
        nextPlayerId = getNextPlacingPlayer(nextPlayerId)
        nextPlayerTerrainCount = updatedPile.get(nextPlayerId) ?? 0
        checkedPlayers++
      }

      if (nextPlayerTerrainCount > 0) {
        setCurrentPlacingPlayer(nextPlayerId)
      } else {
        setCurrentPlacingPlayer(null)
      }
    } else {
      setCurrentPlacingPlayer(null)
    }
  }

  const handleSkipTerrain = () => {
    if (totalTerrain === 0) {
      onNextStage()
    }
  }

  const currentPlayer = currentPlacingPlayer 
    ? draft.results.find(r => r.playerId === currentPlacingPlayer)
    : null

  const remainingTerrain = maxTerrain - placedTerrain

  return (
    <div className="min-h-screen p-8" style={{ background: '#0d1208' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-8 text-center" style={{ color: '#c9a84c' }}>
          COLOCAÇÃO DE TERRENO
        </h1>

        {maxTerrain === 0 ? (
          <div className="text-center p-8" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a' }}>
            <p className="font-mono text-lg mb-6" style={{ color: '#a0a090' }}>
              Nenhum terreno foi adicionado na fase anterior.
            </p>
            <button
              onClick={handleSkipTerrain}
              className="px-8 py-3 font-mono text-lg"
              style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}
            >
              Pular Fase →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
              <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                Instruções
              </h2>
              <p className="font-mono text-sm mb-2" style={{ color: '#a0a090' }}>
                Cada característica de terreno deve ser colocada a pelo menos 3" de qualquer outra característica de terreno
                já no campo de batalha, de qualquer borda do campo de batalha e de qualquer zona de deploy do jogador.
              </p>
              <p className="font-mono text-sm" style={{ color: '#a0a090' }}>
                Continue este processo no sentido horário até que todas as características
                de terreno da pilha tenham sido colocadas.
              </p>
            </div>

            {/* Progress */}
            <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-sm" style={{ color: '#5a7a4a' }}>
                  Progresso:
                </span>
                <span className="font-mono text-lg font-bold" style={{ color: '#c9a84c' }}>
                  {placedTerrain} / {maxTerrain}
                </span>
              </div>
              <div className="w-full h-2" style={{ background: 'rgba(58,74,42,0.3)' }}>
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(placedTerrain / maxTerrain) * 100}%`,
                    background: '#7a9a5a'
                  }}
                />
              </div>
            </div>

            {/* Current Player */}
            {currentPlayer && (
              <div className="p-4 border text-center" style={{ background: 'rgba(122,154,90,0.1)', borderColor: '#3a4a2a' }}>
                <div className="font-mono text-sm mb-1" style={{ color: '#5a7a4a' }}>
                  Colocando terreno:
                </div>
                <div className="font-mono text-xl font-bold" style={{ color: '#c9a84c' }}>
                  {getPlayerDisplayName(currentPlayer.playerId)}
                </div>
              </div>
            )}

            {/* Terrain Selection */}
            {remainingTerrain > 0 && (
              <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
                <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                  Selecione o Terreno
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {['Bloco', 'Árvore', 'Edifício', 'Água', 'Colina', 'Ruína'].map((terrain) => (
                    <button
                      key={terrain}
                      onClick={() => handlePlaceTerrain(terrain)}
                      disabled={placedTerrain >= maxTerrain}
                      className="p-4 font-mono text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: selectedTerrain === terrain ? 'rgba(201,168,76,0.2)' : 'rgba(122,154,90,0.1)',
                        border: '1px solid #3a4a2a',
                        color: '#e8d5a0'
                      }}
                    >
                      {terrain}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Placed Terrain List */}
            {preparationState.terrainFeatures.length > 0 && (
              <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
                <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                  Terrenos Colocados
                </h2>
                <div className="space-y-2">
                  {preparationState.terrainFeatures.map((terrain) => {
                    return (
                      <div
                        key={terrain.id}
                        className="flex items-center justify-between p-2"
                        style={{ background: 'rgba(122,154,90,0.1)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
                            {terrain.name}
                          </span>
                          <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>
                            por {getPlayerDisplayName(terrain.playerId)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const updatedFeatures = preparationState.terrainFeatures.filter(f => f.id !== terrain.id)
                            const updatedPile = new Map(preparationState.terrainPile)
                            const currentCount = updatedPile.get(terrain.playerId) ?? 0
                            updatedPile.set(terrain.playerId, currentCount + 1)
                            onUpdateState({
                              terrainFeatures: updatedFeatures,
                              terrainPile: updatedPile
                            })
                          }}
                          className="px-2 py-1 font-mono text-xs"
                          style={{ background: 'rgba(150,50,50,0.2)', border: '1px solid #5a2a2a', color: '#c06060' }}
                        >
                          Remover
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Next Stage Button */}
            {placedTerrain >= maxTerrain && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={onNextStage}
                  className="px-8 py-3 font-mono text-lg"
                  style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}
                >
                  Próxima Fase →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
