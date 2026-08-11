// src/components/game-mode/VictoryScoreboard.tsx
'use client'

import type { Draft } from '@/lib/api'
import type { VictoryPointsBreakdown } from '@/hooks/useGameSession'
import { VICTORY_CONDITION_DESCRIPTIONS, VICTORY_CONDITION_LABELS, vcWinner, type VictoryCondition } from '@/lib/gameMode'

interface VictoryScoreboardProps {
  draft: Draft
  victoryPoints: Record<number, VictoryPointsBreakdown>
  getPlayerDisplayName: (playerId: number) => string
  onAdjustVP: (playerId: number, vc: VictoryCondition, delta: number) => void
  onSetVP: (playerId: number, vc: VictoryCondition, value: number) => void
}

const ALL_VCS: VictoryCondition[] = [1, 2, 3]
const MANUAL_VCS: VictoryCondition[] = [1, 2] // VC3 is driven by the Command-stage counter instead

function emptyBreakdown(): VictoryPointsBreakdown {
  return { vc1: 0, vc2: 0, vc3: 0 }
}

export default function VictoryScoreboard({ draft, victoryPoints, getPlayerDisplayName, onAdjustVP, onSetVP }: VictoryScoreboardProps) {
  const playerIds = draft.results.map(r => r.playerId)
  const vpOf = (playerId: number) => victoryPoints[playerId] ?? emptyBreakdown()

  const winnerByVc: Record<VictoryCondition, number | null> = {
    1: vcWinner(playerIds, pid => vpOf(pid).vc1),
    2: vcWinner(playerIds, pid => vpOf(pid).vc2),
    3: vcWinner(playerIds, pid => vpOf(pid).vc3),
  }

  const vcsWonBy = (playerId: number) => ALL_VCS.filter(vc => winnerByVc[vc] === playerId).length

  // Tiebreak chain per rulebook: most VCs won → most VC2 points → most VC1 points → dice roll.
  let leaders = playerIds
  let maxWon = -1
  for (const pid of playerIds) {
    const won = vcsWonBy(pid)
    if (won > maxWon) { maxWon = won; leaders = [pid] }
    else if (won === maxWon) { leaders.push(pid) }
  }
  if (leaders.length > 1) {
    const maxVc2 = Math.max(...leaders.map(pid => vpOf(pid).vc2))
    const tiedByVc2 = leaders.filter(pid => vpOf(pid).vc2 === maxVc2)
    if (tiedByVc2.length === 1) {
      leaders = tiedByVc2
    } else {
      const maxVc1 = Math.max(...tiedByVc2.map(pid => vpOf(pid).vc1))
      const tiedByVc1 = tiedByVc2.filter(pid => vpOf(pid).vc1 === maxVc1)
      leaders = tiedByVc1
    }
  }
  const soleLeader = maxWon > 0 && leaders.length === 1 ? leaders[0] : null
  const tiedForLead = maxWon > 0 && leaders.length > 1

  return (
    <div className="corner-clip-sm flex-shrink-0" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}>
      <div className="px-3 py-2" style={{ borderBottom: '1px solid #1a2a0a' }}>
        <span className="font-mono text-xs tracking-widest uppercase font-bold" style={{ color: '#c9a84c' }}>
          Placar da Partida
        </span>
      </div>

      <div className="p-2 overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="text-left font-mono text-[10px] uppercase tracking-widest px-2 py-1" style={{ color: '#5a7a4a' }}>
                Jogador
              </th>
              {ALL_VCS.map(vc => (
                <th
                  key={vc}
                  className="text-center font-mono text-[10px] uppercase tracking-widest px-2 py-1 whitespace-nowrap"
                  style={{ color: '#5a7a4a', cursor: 'help' }}
                  title={VICTORY_CONDITION_DESCRIPTIONS[vc]}
                >
                  {VICTORY_CONDITION_LABELS[vc]}
                </th>
              ))}
              <th
                className="text-center font-mono text-[10px] uppercase tracking-widest px-2 py-1"
                style={{ color: '#c9a84c', cursor: 'help' }}
                title="Cada VC é vencida separadamente por quem tem mais pontos nela (empate = ninguém vence). Vence o jogo quem vencer mais VCs."
              >
                VCs Vencidas
              </th>
            </tr>
          </thead>
          <tbody>
            {draft.results.map(result => {
              const vp = vpOf(result.playerId)
              const won = vcsWonBy(result.playerId)
              const isSoleLeader = soleLeader === result.playerId
              return (
                <tr key={result.playerId} style={{ borderTop: '1px solid #1a2a0a' }}>
                  <td className="font-mono text-sm px-2 py-1.5 truncate max-w-[140px]" style={{ color: isSoleLeader ? '#c9a84c' : '#e8d5a0' }}>
                    {isSoleLeader && <span title="Liderando">★ </span>}
                    {getPlayerDisplayName(result.playerId)}
                  </td>
                  {MANUAL_VCS.map(vc => {
                    const value = vc === 1 ? vp.vc1 : vp.vc2
                    const winsThisVc = winnerByVc[vc] === result.playerId
                    return (
                      <td key={vc} className="px-2 py-1.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onAdjustVP(result.playerId, vc, -1)}
                            disabled={value <= 0}
                            className="w-5 h-5 font-mono text-sm corner-clip-sm disabled:opacity-30"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                          >
                            −
                          </button>
                          <input
                            key={`${result.playerId}-${vc}-${value}`}
                            type="number"
                            min={0}
                            defaultValue={value}
                            onBlur={e => {
                              const parsed = Number(e.target.value)
                              if (Number.isFinite(parsed) && parsed >= 0) onSetVP(result.playerId, vc, parsed)
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                            className="font-mono text-sm font-bold text-center px-1 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            style={{
                              color: '#c9a84c',
                              width: 56,
                              background: 'rgba(0,0,0,0.3)',
                              border: winsThisVc ? '1px solid #c9a84c' : '1px solid #3a4a2a',
                              boxShadow: winsThisVc ? '0 0 6px rgba(201,168,76,0.4)' : 'none',
                            }}
                          />
                          <button
                            onClick={() => onAdjustVP(result.playerId, vc, 1)}
                            className="w-5 h-5 font-mono text-sm corner-clip-sm"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    )
                  })}
                  <td
                    className="text-center font-mono text-sm px-2 py-1.5"
                    style={{
                      color: winnerByVc[3] === result.playerId ? '#c9a84c' : '#7a9a5a',
                      fontWeight: winnerByVc[3] === result.playerId ? 700 : 400,
                    }}
                  >
                    {vp.vc3}
                  </td>
                  <td className="text-center font-mono text-base font-bold px-2 py-1.5" style={{ color: isSoleLeader ? '#c9a84c' : '#e8d5a0' }}>
                    {won} / {ALL_VCS.length}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {tiedForLead && (
          <p className="font-mono text-[10px] px-2 pt-1" style={{ color: '#c06060' }}>
            Empate em VCs vencidas — desempate por pontos de VC2, depois VC1, depois dado.
          </p>
        )}
      </div>
    </div>
  )
}
