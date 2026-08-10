'use client'

import { useCallback, useEffect, useState } from 'react'
import { safeLocalStorage } from '@/lib/storage'
import { nextStage as computeNextStage, nextPlayerId, type OrderStage, type OrderType } from '@/lib/gameMode'
import type { DraftResult } from '@/lib/api'

export type UnitOrderStatus = 'none' | 'ordered' | 'pushed'

export interface UnitOrderState {
  status: UnitOrderStatus
  orderType?: OrderType
}

export interface UnitDialState {
  damageClicks: number
  heatClicks: number
}

export interface PlayerSessionState {
  ordersUsed: number
  unitOrders: Record<string, UnitOrderState>
  units: Record<string, UnitDialState>
}

export interface GameSessionState {
  turn: number
  stage: OrderStage
  activePlayerId: number
  buildTotalOverride: Record<number, number>
  players: Record<number, PlayerSessionState>
}

function storageKey(draftId: string): string {
  return `wargame_game_session_${draftId}`
}

function emptyPlayerState(): PlayerSessionState {
  return { ordersUsed: 0, unitOrders: {}, units: {} }
}

function firstPlayerId(results: DraftResult[]): number {
  return [...results.map(r => r.playerId)].sort((a, b) => a - b)[0] ?? 1
}

function createInitialState(results: DraftResult[]): GameSessionState {
  return {
    turn: 1,
    stage: 'command',
    activePlayerId: firstPlayerId(results),
    buildTotalOverride: {},
    players: {},
  }
}

export function useGameSession(draftId: string | null, results: DraftResult[]) {
  const [state, setState] = useState<GameSessionState | null>(null)

  useEffect(() => {
    if (!draftId || results.length === 0) {
      setState(null)
      return
    }
    const raw = safeLocalStorage.getItem(storageKey(draftId))
    if (raw) {
      try {
        setState(JSON.parse(raw) as GameSessionState)
        return
      } catch {
        // fall through to a fresh session
      }
    }
    setState(createInitialState(results))
    // Only re-run when the draft identity or its player list changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, results.map(r => r.playerId).join(',')])

  const persist = useCallback((next: GameSessionState) => {
    setState(next)
    if (draftId) {
      safeLocalStorage.setItem(storageKey(draftId), JSON.stringify(next))
    }
  }, [draftId])

  const getPlayerState = useCallback((playerId: number): PlayerSessionState => {
    return state?.players[playerId] ?? emptyPlayerState()
  }, [state])

  const advanceStage = useCallback(() => {
    if (!state) return
    const leavingCleanup = state.stage === 'cleanup'
    const newStage = computeNextStage(state.stage)
    const newActivePlayerId = leavingCleanup ? nextPlayerId(results, state.activePlayerId) : state.activePlayerId
    const newTurn = leavingCleanup ? state.turn + 1 : state.turn

    const players = { ...state.players }
    if (leavingCleanup) {
      const current = players[state.activePlayerId] ?? emptyPlayerState()
      players[state.activePlayerId] = { ...current, ordersUsed: 0, unitOrders: {} }
    }

    persist({ ...state, stage: newStage, activePlayerId: newActivePlayerId, turn: newTurn, players })
  }, [state, results, persist])

  const setUnitOrder = useCallback((playerId: number, instanceKey: string, orderType: OrderType) => {
    if (!state) return
    const player = state.players[playerId] ?? emptyPlayerState()
    const existing = player.unitOrders[instanceKey]
    const alreadyHadOrder = existing?.status === 'ordered' || existing?.status === 'pushed'
    const nextStatus: UnitOrderStatus = alreadyHadOrder ? 'pushed' : 'ordered'
    const unitOrders = { ...player.unitOrders, [instanceKey]: { status: nextStatus, orderType } }
    const ordersUsed = alreadyHadOrder ? player.ordersUsed : player.ordersUsed + 1
    const players = { ...state.players, [playerId]: { ...player, unitOrders, ordersUsed } }
    persist({ ...state, players })
  }, [state, persist])

  const setDialClicks = useCallback((playerId: number, instanceKey: string, clicks: Partial<UnitDialState>) => {
    if (!state) return
    const player = state.players[playerId] ?? emptyPlayerState()
    const current = player.units[instanceKey] ?? { damageClicks: 0, heatClicks: 0 }
    const units = { ...player.units, [instanceKey]: { ...current, ...clicks } }
    const players = { ...state.players, [playerId]: { ...player, units } }
    persist({ ...state, players })
  }, [state, persist])

  const setBuildTotalOverride = useCallback((playerId: number, value: number) => {
    if (!state) return
    persist({ ...state, buildTotalOverride: { ...state.buildTotalOverride, [playerId]: value } })
  }, [state, persist])

  const resetSession = useCallback(() => {
    if (!draftId || results.length === 0) return
    persist(createInitialState(results))
  }, [draftId, results, persist])

  return {
    session: state,
    getPlayerState,
    advanceStage,
    setUnitOrder,
    setDialClicks,
    setBuildTotalOverride,
    resetSession,
  }
}
