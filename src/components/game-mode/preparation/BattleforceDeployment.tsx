'use client'

import { useState, useEffect } from 'react'
import { apiService, type Draft, type DraftUnit, type Unit } from '@/lib/api'
import { type PreparationState, nextPlayerId, getInstanceKey } from '@/lib/gameMode'
import { useT } from '@/hooks/useT'

interface BattleforceDeploymentProps {
  draft: Draft
  preparationState: PreparationState
  onUpdateState: (state: Partial<PreparationState>) => void
  onNextStage: () => void
}

interface BoardingModal {
  playerId: number
  transportKey: string
  transportDraftUnit: DraftUnit
  cargoCapacity: number
}

function slotCost(type: string) { return type.toLowerCase() === 'infantry' ? 1 : 3 }

export default function BattleforceDeployment({ draft, preparationState, onUpdateState, onNextStage }: BattleforceDeploymentProps) {
  const t = useT()
  const [dialResetConfirmed, setDialResetConfirmed] = useState(false)
  const [unitCache, setUnitCache] = useState<Record<string, Unit>>({})
  const [boardingModal, setBoardingModal] = useState<BoardingModal | null>(null)
  const [selectedPassengers, setSelectedPassengers] = useState<Set<string>>(new Set())

  // Load unit data for every vehicle in any player's army so we can show capacity.
  useEffect(() => {
    const vehicleIds = new Set<string>()
    for (const result of draft.results) {
      for (const du of result.armyUnits) {
        if (du.type.toLowerCase() === 'vehicle') vehicleIds.add(du.id)
      }
    }
    for (const id of vehicleIds) {
      if (!unitCache[id]) {
        apiService.getUnit(id).then(u => {
          if (u && (u.cargoCapacity ?? 0) > 0) {
            setUnitCache(c => ({ ...c, [id]: u }))
          }
        }).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id])

  const getPassengersFor = (playerId: number, transportKey: string): string[] =>
    preparationState.initialPassengers?.[playerId]?.[transportKey] ?? []

  const isPassengerAnywhere = (playerId: number, instanceKey: string): boolean => {
    for (const [tKey, pKeys] of Object.entries(preparationState.initialPassengers?.[playerId] ?? {})) {
      if (tKey !== instanceKey && pKeys.includes(instanceKey)) return true
    }
    return false
  }

  const openBoardingModal = (playerId: number, transportKey: string, du: DraftUnit, capacity: number) => {
    setBoardingModal({ playerId, transportKey, transportDraftUnit: du, cargoCapacity: capacity })
    setSelectedPassengers(new Set(getPassengersFor(playerId, transportKey)))
  }

  const confirmBoarding = () => {
    if (!boardingModal) return
    const { playerId, transportKey } = boardingModal
    const passengerKeys = [...selectedPassengers]
    const updated: Record<number, Record<string, string[]>> = {
      ...(preparationState.initialPassengers ?? {}),
      [playerId]: {
        ...(preparationState.initialPassengers?.[playerId] ?? {}),
        [transportKey]: passengerKeys,
      },
    }
    // Clean up empty entries
    if (passengerKeys.length === 0) delete updated[playerId][transportKey]
    onUpdateState({ initialPassengers: updated })
    setBoardingModal(null)
  }

  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `${t('control.player')} ${playerId}`
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

  const handleDeployAll = (playerId: number, unitIds: string[]) => {
    const deployedUnits = new Map(preparationState.deployedUnits)
    deployedUnits.set(playerId, unitIds)
    onUpdateState({ deployedUnits })
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
          {t('deployment.title')}
        </h1>

        <div className="space-y-6">
          {/* Dial Reset Instructions */}
          {!dialResetConfirmed ? (
            <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
              <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                {t('deployment.dialResetTitle')}
              </h2>
              <p className="font-mono text-sm mb-2" style={{ color: '#a0a090' }}>
                {t('deployment.dialResetDesc1')}
              </p>
              <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
                {t('deployment.dialResetDesc2')}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleConfirmDialReset}
                  className="px-8 py-3 font-mono text-lg"
                  style={{ background: 'rgba(122,154,90,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                >
                  {t('deployment.confirmDialReset')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Deployment Instructions */}
              <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
                <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                  {t('deployment.instructionsTitle')}
                </h2>
                <p className="font-mono text-sm mb-2" style={{ color: '#a0a090' }}>
                  {t('deployment.instructionsDesc1')}
                </p>
                <p className="font-mono text-sm" style={{ color: '#a0a090' }}>
                  {t('deployment.instructionsDesc2')}
                </p>
              </div>

              {/* Current Deploying Player */}
              {currentPlayer && (
                <div className="p-4 border text-center" style={{ background: 'rgba(122,154,90,0.1)', borderColor: '#3a4a2a' }}>
                  <div className="font-mono text-sm mb-1" style={{ color: '#5a7a4a' }}>
                    {t('deployment.deploying')}
                  </div>
                  <div className="font-mono text-xl font-bold" style={{ color: '#c9a84c' }}>
                    {getPlayerDisplayName(currentPlayer.playerId)}
                  </div>
                  <div className="font-mono text-xs mt-1" style={{ color: '#5a7a4a' }}>
                    {currentPlayerDeployed.length} / {currentPlayerArmy.length} {t('deployment.unitsDeployed')}
                  </div>
                </div>
              )}

              {/* Current Player's Units */}
              {currentPlayer && (
                <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-mono text-lg" style={{ color: '#7a9a5a' }}>
                      {t('deployment.playerUnits')} {getPlayerDisplayName(currentPlayer.playerId)}
                    </h2>
                    {!isCurrentPlayerFinished && (
                      <button
                        onClick={() => handleDeployAll(currentDeployingPlayer, currentPlayerArmy.map(unit => unit.id))}
                        className="px-3 py-1 font-mono text-xs"
                        style={{ background: 'rgba(122,154,90,0.2)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                      >
                        {t('deployment.deployAll')}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {currentPlayerArmy.map((unit, idx) => {
                      const isDeployed = currentPlayerDeployed.includes(unit.id)
                      const instanceKey = getInstanceKey(idx, unit.id)
                      const loadedUnit = unitCache[unit.id]
                      const capacity = loadedUnit?.cargoCapacity ?? 0
                      const passengers = getPassengersFor(currentDeployingPlayer, instanceKey)
                      const isAboard = isPassengerAnywhere(currentDeployingPlayer, instanceKey)
                      return (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between p-2 gap-2"
                          style={{
                            background: isAboard
                              ? 'rgba(40,80,120,0.1)'
                              : isDeployed ? 'rgba(122,154,90,0.2)' : 'rgba(90,90,90,0.1)',
                            border: `1px solid ${isAboard ? '#3a6090' : '#3a4a2a'}`,
                            opacity: isAboard ? 0.7 : 1,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
                              {unit.name}
                              {isAboard && <span className="ml-2 font-mono text-[10px]" style={{ color: '#7aaad8' }}>{t('deployment.aboard')}</span>}
                            </div>
                            <div className="font-mono text-xs" style={{ color: '#5a7a4a' }}>
                              {unit.type} / {unit.points} pts
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {capacity > 0 && (
                              <button
                                onClick={() => openBoardingModal(currentDeployingPlayer, instanceKey, unit, capacity)}
                                className="px-2 py-1 font-mono text-[10px] corner-clip-sm"
                                style={{
                                  background: passengers.length > 0 ? 'rgba(40,80,120,0.3)' : 'rgba(0,0,0,0.2)',
                                  border: `1px solid ${passengers.length > 0 ? '#3a6090' : '#3a4a2a'}`,
                                  color: passengers.length > 0 ? '#7aaad8' : '#5a7a4a',
                                }}
                                title={`Capacidade: ${capacity} slots`}
                              >
                                {passengers.length > 0 ? `${passengers.length}P` : 'PASS'}
                              </button>
                            )}
                            {!isAboard && (
                              <button
                                onClick={() => isDeployed
                                  ? handleUndeployUnit(currentDeployingPlayer, unit.id)
                                  : handleDeployUnit(currentDeployingPlayer, unit.id)
                                }
                                className="px-3 py-1 font-mono text-xs"
                                style={{
                                  background: isDeployed ? 'rgba(150,50,50,0.2)' : 'rgba(122,154,90,0.2)',
                                  border: '1px solid #3a4a2a',
                                  color: isDeployed ? '#c06060' : '#7a9a5a',
                                }}
                              >
                                {isDeployed ? t('deployment.btnRemove') : t('deployment.btnDeploy')}
                              </button>
                            )}
                          </div>
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
                    {t('deployment.nextPlayer')}
                  </button>
                </div>
              )}

              {/* All Players Status */}
              <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
                <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
                  {t('deployment.statusTitle')}
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
                              {t('deployment.current')}
                            </span>
                          )}
                          {isFinished && (
                            <span className="px-2 py-1 font-mono text-xs" style={{ background: 'rgba(122,154,90,0.3)', color: '#7a9a5a' }}>
                              {t('deployment.complete')}
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
                    {t('deployment.startBattle')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pre-game boarding modal */}
      {boardingModal && (() => {
        const { playerId, transportKey, transportDraftUnit, cargoCapacity } = boardingModal
        const playerArmy = draft.results.find(r => r.playerId === playerId)?.armyUnits ?? []
        const currentPassengers = getPassengersFor(playerId, transportKey)

        const eligible = playerArmy
          .map((du, i) => ({ du, key: getInstanceKey(i, du.id) }))
          .filter(({ du, key }) => {
            const t = du.type.toLowerCase()
            return (
              (t === 'infantry' || t === 'vehicle') &&
              key !== transportKey &&
              !isPassengerAnywhere(playerId, key)
            )
          })

        const slotsUsed = (keys: string[]) =>
          keys.reduce((sum, k) => {
            const du = playerArmy.find((u, i) => getInstanceKey(i, u.id) === k)
            return sum + (du ? slotCost(du.type) : 0)
          }, 0)

        const existingSlots = slotsUsed(currentPassengers.filter(k => !selectedPassengers.has(k)))
        const selectedSlots = slotsUsed([...selectedPassengers])
        const totalSlots = existingSlots + selectedSlots
        const overCapacity = totalSlots > cargoCapacity

        const toggle = (key: string) => {
          setSelectedPassengers(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
          })
        }

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)' }}
          >
            <div
              className="overflow-hidden flex flex-col"
              style={{ background: '#111608', border: '1px solid #4a6a3a', width: 420, maxHeight: '80vh' }}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a3a1a' }}>
                <div>
                  <div className="font-mono text-sm font-bold" style={{ color: '#e8d5a0' }}>{t('deployment.preBoardingTitle')}</div>
                  <div className="font-mono text-xs" style={{ color: '#5a7a4a' }}>{transportDraftUnit.name}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono text-xs px-2 py-1"
                    style={{
                      background: overCapacity ? 'rgba(150,50,50,0.2)' : 'rgba(40,80,120,0.2)',
                      border: `1px solid ${overCapacity ? '#7a3a3a' : '#3a6090'}`,
                      color: overCapacity ? '#c06060' : '#7aaad8',
                    }}
                  >
                    {totalSlots} / {cargoCapacity} slots
                  </span>
                  <button onClick={() => setBoardingModal(null)} className="font-mono text-xs" style={{ color: '#5a7a4a' }}>✕</button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: '#1a2a12' }}>
                {eligible.length === 0 && (
                  <div className="px-4 py-6 text-center font-mono text-xs" style={{ color: '#4a5e3a' }}>
                    {t('deployment.noEligible')}
                  </div>
                )}
                {eligible.map(({ du, key }) => {
                  const cost = slotCost(du.type)
                  const checked = selectedPassengers.has(key)
                  const wouldExceed = !checked && (totalSlots + cost) > cargoCapacity
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                      style={{
                        opacity: wouldExceed ? 0.4 : 1,
                        background: checked ? 'rgba(40,80,120,0.1)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={wouldExceed && !checked}
                        onChange={() => toggle(key)}
                        className="accent-blue-400"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-bold truncate" style={{ color: '#e8d5a0' }}>{du.name}</div>
                        <div className="font-mono text-[10px]" style={{ color: '#4a5e3a' }}>
                          {du.type.toUpperCase()} · {cost} slot{cost !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>

              <div className="px-4 py-3 flex justify-between items-center" style={{ borderTop: '1px solid #2a3a1a' }}>
                <button
                  onClick={() => setSelectedPassengers(new Set())}
                  className="font-mono text-[10px]"
                  style={{ color: '#5a7a4a' }}
                >
                  {t('deployment.clear')}
                </button>
                <button
                  onClick={confirmBoarding}
                  disabled={overCapacity}
                  className="font-mono text-xs px-3 py-1.5 disabled:opacity-30"
                  style={{ background: 'rgba(40,80,120,0.3)', border: '1px solid #3a6090', color: '#7aaad8' }}
                >
                  {t('deployment.confirm')}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
