'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import { type PreparationState } from '@/lib/gameMode'

interface FirstPlayerRollProps {
  draft: Draft
  preparationState: PreparationState
  onUpdateState: (state: Partial<PreparationState>) => void
  onNextStage: () => void
}

export default function FirstPlayerRoll({ draft, preparationState, onUpdateState, onNextStage }: FirstPlayerRollProps) {
  const [rolling, setRolling] = useState(false)
  const [currentRollingPlayer, setCurrentRollingPlayer] = useState<number | null>(null)
  const [manualRollInputs, setManualRollInputs] = useState<Record<number, string>>({})

  // Helper to get display name (alias or original name)
  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `Jogador ${playerId}`
  }

  const rollDice = (playerId: number) => {
    setRolling(true)
    setCurrentRollingPlayer(playerId)

    // Snapshot rolls once, mutate this local accumulator for the whole animation
    // instead of re-reading the (possibly stale) preparationState prop on every
    // tick — see rollAllDice for why that matters once multiple players are involved.
    const rollsAccumulator = new Map(preparationState.diceRolls)

    let rollCount = 0
    const maxRolls = 10
    const rollInterval = setInterval(() => {
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      const dice3 = Math.floor(Math.random() * 6) + 1
      const total = dice1 + dice2 + dice3

      rollsAccumulator.set(playerId, total)
      onUpdateState({ diceRolls: new Map(rollsAccumulator) })

      rollCount++
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval)
        setRolling(false)
        setCurrentRollingPlayer(null)
      }
    }, 100)
  }

  const rollAllDice = () => {
    setRolling(true)
    let playerIndex = 0

    // Accumulate all players' rolls in this single local Map across the whole
    // sequence. Reading preparationState.diceRolls again for each player would
    // use the stale snapshot from when rollAllDice was first called — onUpdateState
    // triggers a re-render with a new preparationState, but this closure never
    // sees it, so every player after the first would silently wipe out the
    // previous players' already-rolled totals.
    const rollsAccumulator = new Map(preparationState.diceRolls)

    const rollNextPlayer = () => {
      if (playerIndex >= draft.results.length) {
        setRolling(false)
        setCurrentRollingPlayer(null)
        return
      }

      const player = draft.results[playerIndex]
      setCurrentRollingPlayer(player.playerId)

      let rollCount = 0
      const maxRolls = 10
      const rollInterval = setInterval(() => {
        const dice1 = Math.floor(Math.random() * 6) + 1
        const dice2 = Math.floor(Math.random() * 6) + 1
        const dice3 = Math.floor(Math.random() * 6) + 1
        const total = dice1 + dice2 + dice3

        rollsAccumulator.set(player.playerId, total)
        onUpdateState({ diceRolls: new Map(rollsAccumulator) })

        rollCount++
        if (rollCount >= maxRolls) {
          clearInterval(rollInterval)
          playerIndex++
          setTimeout(rollNextPlayer, 300)
        }
      }, 100)
    }

    rollNextPlayer()
  }

  const handleManualRollSubmit = (playerId: number) => {
    const raw = manualRollInputs[playerId]
    const value = Number(raw)
    if (!raw || !Number.isFinite(value) || value < 3 || value > 18) return
    const updatedRolls = new Map(preparationState.diceRolls)
    updatedRolls.set(playerId, value)
    onUpdateState({ diceRolls: updatedRolls })
    setManualRollInputs(prev => {
      const next = { ...prev }
      delete next[playerId]
      return next
    })
  }

  const determineFirstPlayer = () => {
    const rolls = Array.from(preparationState.diceRolls.entries())
    if (rolls.length === 0) return null

    // Find highest roll
    let maxRoll = -1
    let maxRollPlayers: number[] = []

    rolls.forEach(([playerId, roll]) => {
      if (roll > maxRoll) {
        maxRoll = roll
        maxRollPlayers = [playerId]
      } else if (roll === maxRoll) {
        maxRollPlayers.push(playerId)
      }
    })

    // If tie, need reroll (for now, just pick first)
    if (maxRollPlayers.length > 1) {
      return maxRollPlayers[0]
    }

    return maxRollPlayers[0]
  }

  const handleSetFirstPlayer = () => {
    const firstPlayerId = determineFirstPlayer()
    if (firstPlayerId) {
      onUpdateState({ firstPlayerId })
    }
  }

  const allPlayersRolled = draft.results.every(r => preparationState.diceRolls.has(r.playerId))
  const isTie = Array.from(preparationState.diceRolls.values()).filter((roll, _, arr) =>
    arr.indexOf(roll) !== arr.lastIndexOf(roll)
  ).length > 0

  return (
    <div className="min-h-screen p-8" style={{ background: '#0d1208' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-8 text-center" style={{ color: '#c9a84c' }}>
          DETERMINAR PRIMEIRO JOGADOR
        </h1>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              Instruções
            </h2>
            <p className="font-mono text-sm mb-2" style={{ color: '#a0a090' }}>
              Cada jogador rola três dados de seis lados e soma os resultados; empates são rerolados.
            </p>
            <p className="font-mono text-sm" style={{ color: '#a0a090' }}>
              Quem rolar o total mais alto é chamado de primeiro jogador.
            </p>
          </div>

          {/* Roll All Button — stays visible after rolling so ties can be rerolled */}
          <div className="flex justify-center">
            <button
              onClick={rollAllDice}
              disabled={rolling}
              className="px-8 py-3 font-mono text-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'rgba(122,154,90,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
            >
              {rolling ? 'Rolando...' : allPlayersRolled ? 'Rolar Todos Novamente' : 'Rolar Todos os Dados'}
            </button>
          </div>

          {/* Player Rolls */}
          <div className="space-y-3">
            {draft.results.map((result) => {
              const roll = preparationState.diceRolls.get(result.playerId)
              const isRolling = currentRollingPlayer === result.playerId
              const isFirstPlayer = preparationState.firstPlayerId === result.playerId

              return (
                <div
                  key={result.playerId}
                  className="p-4 border"
                  style={{
                    background: isFirstPlayer ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.3)',
                    borderColor: isFirstPlayer ? '#c9a84c' : '#3a4a2a'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-lg" style={{ color: '#e8d5a0' }}>
                        {getPlayerDisplayName(result.playerId)}
                      </div>
                      {isFirstPlayer && (
                        <span className="px-2 py-1 font-mono text-xs" style={{ background: 'rgba(201,168,76,0.3)', color: '#c9a84c' }}>
                          PRIMEIRO JOGADOR
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {roll !== undefined && (
                        <div className="font-mono text-2xl font-bold" style={{ color: '#c9a84c' }}>
                          {roll}
                        </div>
                      )}
                      <button
                        onClick={() => rollDice(result.playerId)}
                        disabled={rolling}
                        className="px-4 py-2 font-mono text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'rgba(122,154,90,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                      >
                        {roll !== undefined ? 'Rerolar' : 'Rolar'}
                      </button>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={3}
                          max={18}
                          value={manualRollInputs[result.playerId] ?? ''}
                          onChange={e => setManualRollInputs(prev => ({ ...prev, [result.playerId]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleManualRollSubmit(result.playerId) }}
                          placeholder="3-18"
                          disabled={rolling}
                          className="w-16 px-2 py-2 font-mono text-sm disabled:opacity-40"
                          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#e8d5a0' }}
                        />
                        <button
                          onClick={() => handleManualRollSubmit(result.playerId)}
                          disabled={rolling || !manualRollInputs[result.playerId]}
                          className="px-3 py-2 font-mono text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                          title="Usar valor rolado manualmente (dados físicos)"
                        >
                          Definir
                        </button>
                      </div>
                      {isRolling && (
                        <div className="flex gap-1">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs animate-pulse"
                              style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}
                            >
                              ?
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tie Warning */}
          {isTie && allPlayersRolled && (
            <div className="p-4 border text-center" style={{ background: 'rgba(150,50,50,0.2)', borderColor: '#5a2a2a' }}>
              <p className="font-mono text-sm" style={{ color: '#c06060' }}>
                Empate detectado! Reroll os dados dos jogadores empatados.
              </p>
            </div>
          )}

          {/* Set First Player Button */}
          {allPlayersRolled && !isTie && !preparationState.firstPlayerId && (
            <div className="flex justify-center">
              <button
                onClick={handleSetFirstPlayer}
                className="px-8 py-3 font-mono text-lg"
                style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}
              >
                Definir Primeiro Jogador
              </button>
            </div>
          )}

          {/* Next Stage Button */}
          {preparationState.firstPlayerId && (
            <div className="flex justify-center">
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
      </div>
    </div>
  )
}
