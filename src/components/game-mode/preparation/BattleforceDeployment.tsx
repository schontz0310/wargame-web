'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import { type PreparationState, nextPlayerId } from '@/lib/gameMode'

interface BattleforceDeploymentProps {
  draft: Draft
  preparationState: PreparationState
  onUpdateState: (state: Partial<PreparationState>) => void
  onNextStage: () => void
}

export default function BattleforceDeployment({ draft, preparationState, onUpdateState, onNextStage }: BattleforceDeploymentProps) {
  const [dialResetConfirmed, setDialResetConfirmed] = useState(false)

  // Helper to get display name (alias or original name)
  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `Jogador ${playerId}`
  }

  // Start with first player if not set
  const currentDeployingPlayer = preparationState.currentDeployingPlayer ?? preparationState.firstPlayerId ?? draft.results[0]?.playerId

  const handleConfirmDialReset = () => {
    setDialResetConfirmed(true)
  }

  const handleDeployUnit = (playerId: number, unitId: string) => {
    const deployedUnits = new Map(preparationState.deployedUnits)
    const playerDeployed = deployedUnits.get(playerId) ?? []
    
    if (!playerDeployed.includes(unitId)) {
      playerDeployed.push(unitId)
      deployedUnits.set(playerId, playerDeployed)
      onUpdateState({ deployedUnits })
    }
  }

  const handleUndeployUnit = (playerId: number, unitId: string) => {
    const deployedUnits = new Map(preparationState.deployedUnits)
    const playerDeployed = deployedUnits.get(playerId) ?? []
    const updated = playerDeployed.filter(id => id !== unitId)
    deployedUnits.set(playerId, updated)
    onUpdateState({ deployedUnits })
  }

  const handleNextPlayer = () => {
    const nextId = nextPlayerId(draft.results, currentDeployingPlayer)
    onUpdateState({ currentDeployingPlayer: nextId })
  }

  const handleFinishDeployment = () => {
    const allDeployed = draft.results.every(result => {
      const playerDeployed = preparationState.deployedUnits.get(result.playerId) ?? []
      const armyUnits = result.armyUnits ?? []
      return playerDeployed.length === armyUnits.length
    })

    if (allDeployed) {
      onNextStage()
    }
  }

  const currentPlayer = draft.results.find(r => r.playerId === currentDeployingPlayer)
  const currentPlayerArmy = currentPlayer?.armyUnits ?? []
  const currentPlayerDeployed = preparationState.deployedUnits.get(currentDeployingPlayer) ?? []
  const isCurrentPlayerFinished = currentPlayerDeployed.length === currentPlayerArmy.length

  const allPlayersFinished = draft.results.every(result => {
    const playerDeployed = preparationState.deployedUnits.get(result.playerId) ?? []
    const armyUnits = result.armyUnits ?? []
    return playerDeployed.length === armyUnits.length
  })

  return (
    <div className="min-h-screen p-8" style={{ background: '#0d1208' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-8 text-center" style={{ color: '#c9a84c' }}>
          DEPLOY DA BATTLEFORCE
        </h1>

        <div className="space-y-6">
          {/* Dial Reset Instructions */}
          {!dialResetConfirmed ? (
            <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
              <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                Reset dos Dials
              </h2>
              <p className="font-mono text-sm mb-2" style={{ color: '#a0a090' }}>
                Após o terreno ter sido colocado, cada jogador gira os dials de combate de suas unidades
                para que o marcador inicial (seta verde) apareça no slot de estatísticas de cada unidade.
              </p>
              <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
                &apos;Mechs devem ter seus dials de calor girados para que três quadrados verdes estejam visíveis.
                Esta é a posição inicial de calor do &apos;Mech.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleConfirmDialReset}
                  className="px-8 py-3 font-mono text-lg"
                  style={{ background: 'rgba(122,154,90,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                >
                  Confirmar Reset dos Dials
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Deployment Instructions */}
              <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
                <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                  Instruções de Deploy
                </h2>
                <p className="font-mono text-sm mb-2" style={{ color: '#a0a090' }}>
                  O primeiro jogador faz o deploy de sua battleforce primeiro. Cada unidade deve ser colocada
                  com seu ponto central - ou o centro de sua base se o ponto central não puder ser visto -
                  dentro da zona de deploy do primeiro jogador; cada base da unidade deve descansar completamente
                  no campo de batalha.
                </p>
                <p className="font-mono text-sm" style={{ color: '#a0a090' }}>
                  Após o primeiro jogador terminar o deploy, o jogador à esquerda do primeiro jogador faz o deploy
                  de sua battleforce em sua zona de deploy. Se houver mais de dois jogadores, continue este processo
                  no sentido horário.
                </p>
              </div>

              {/* Current Deploying Player */}
              {currentPlayer && (
                <div className="p-4 border text-center" style={{ background: 'rgba(122,154,90,0.1)', borderColor: '#3a4a2a' }}>
                  <div className="font-mono text-sm mb-1" style={{ color: '#5a7a4a' }}>
                    Fazendo deploy:
                  </div>
                  <div className="font-mono text-xl font-bold" style={{ color: '#c9a84c' }}>
                    {getPlayerDisplayName(currentPlayer.playerId)}
                  </div>
                  <div className="font-mono text-xs mt-1" style={{ color: '#5a7a4a' }}>
                    {currentPlayerDeployed.length} / {currentPlayerArmy.length} unidades deployadas
                  </div>
                </div>
              )}

              {/* Current Player's Units */}
              {currentPlayer && (
                <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
                  <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                    Unidades de {getPlayerDisplayName(currentPlayer.playerId)}
                  </h2>
                  <div className="space-y-2">
                    {currentPlayerArmy.map((unit) => {
                      const isDeployed = currentPlayerDeployed.includes(unit.id)
                      return (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between p-2"
                          style={{
                            background: isDeployed ? 'rgba(122,154,90,0.2)' : 'rgba(90,90,90,0.1)',
                            border: '1px solid #3a4a2a'
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
                              {unit.name}
                            </div>
                            <div className="font-mono text-xs" style={{ color: '#5a7a4a' }}>
                              {unit.type} / {unit.points} pts
                            </div>
                          </div>
                          <button
                            onClick={() => isDeployed 
                              ? handleUndeployUnit(currentDeployingPlayer, unit.id)
                              : handleDeployUnit(currentDeployingPlayer, unit.id)
                            }
                            className="px-3 py-1 font-mono text-xs"
                            style={{
                              background: isDeployed 
                                ? 'rgba(150,50,50,0.2)' 
                                : 'rgba(122,154,90,0.2)',
                              border: '1px solid #3a4a2a',
                              color: isDeployed ? '#c06060' : '#7a9a5a'
                            }}
                          >
                            {isDeployed ? 'Remover' : 'Deploy'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Next Player Button */}
              {isCurrentPlayerFinished && !allPlayersFinished && (
                <div className="flex justify-center">
                  <button
                    onClick={handleNextPlayer}
                    className="px-8 py-3 font-mono text-lg"
                    style={{ background: 'rgba(122,154,90,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                  >
                    Próximo Jogador →
                  </button>
                </div>
              )}

              {/* All Players Status */}
              <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
                <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                  Status do Deploy
                </h2>
                <div className="space-y-2">
                  {draft.results.map((result) => {
                    const playerDeployed = preparationState.deployedUnits.get(result.playerId) ?? []
                    const armyUnits = result.armyUnits ?? []
                    const isFinished = playerDeployed.length === armyUnits.length
                    const isCurrent = result.playerId === currentDeployingPlayer

                    return (
                      <div
                        key={result.playerId}
                        className="flex items-center justify-between p-2"
                        style={{
                          background: isCurrent ? 'rgba(201,168,76,0.1)' : 'rgba(90,90,90,0.05)',
                          border: '1px solid #3a4a2a'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
                            {getPlayerDisplayName(result.playerId)}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-1 font-mono text-xs" style={{ background: 'rgba(201,168,76,0.3)', color: '#c9a84c' }}>
                              Atual
                            </span>
                          )}
                          {isFinished && (
                            <span className="px-2 py-1 font-mono text-xs" style={{ background: 'rgba(122,154,90,0.3)', color: '#7a9a5a' }}>
                              Completo
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-sm" style={{ color: '#c9a84c' }}>
                          {playerDeployed.length} / {armyUnits.length}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Finish Button */}
              {allPlayersFinished && (
                <div className="flex justify-center">
                  <button
                    onClick={handleFinishDeployment}
                    className="px-8 py-3 font-mono text-lg"
                    style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}
                  >
                    Iniciar Batalha →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
