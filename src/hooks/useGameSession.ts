'use client'

import { useCallback, useEffect, useState } from 'react'
import { safeLocalStorage } from '@/lib/storage'
import { nextStage as computeNextStage, nextPlayerId, type OrderStage, type OrderType, type PendingArtilleryAttack } from '@/lib/gameMode'
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
  ordersTotal?: number       // override for this player's order total this turn
  unitOrders: Record<string, UnitOrderState>
  units: Record<string, UnitDialState>
}

export interface GameSessionState {
  turn: number
  stage: OrderStage
  activePlayerId: number
  buildTotal: number                          // agreed game build total (rulebook p.13)
  buildTotalOverride: Record<number, number>  // legacy per-player override, kept for compat
  victoryPoints: Record<number, number>       // playerId -> cumulative VP
  pendingArtillery: PendingArtilleryAttack[]  // placed in Order stage, resolved in Command
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

function createInitialState(results: DraftResult[], buildTotal = 300): GameSessionState {
  return {
    turn: 1,
    stage: 'command',
    activePlayerId: firstPlayerId(results),
    buildTotal,
    buildTotalOverride: {},
    victoryPoints: {},
    pendingArtillery: [],
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
        const parsed = JSON.parse(raw) as GameSessionState
        // Normalize: backfill fields added after initial release so old sessions don't break
        setState({
          ...parsed,
          buildTotal: parsed.buildTotal ?? 300,
          buildTotalOverride: parsed.buildTotalOverride ?? {},
          victoryPoints: parsed.victoryPoints ?? {},
          pendingArtillery: parsed.pendingArtillery ?? [],
        })
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

  const setBuildTotal = useCallback((value: number) => {
    if (!state) return
    persist({ ...state, buildTotal: value })
  }, [state, persist])

  const addVictoryPoints = useCallback((playerId: number, points: number) => {
    if (!state) return
    const current = state.victoryPoints[playerId] ?? 0
    persist({ ...state, victoryPoints: { ...state.victoryPoints, [playerId]: current + points } })
  }, [state, persist])

  const addArtilleryAttack = useCallback((attack: Omit<PendingArtilleryAttack, 'id'>) => {
    if (!state) return
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    persist({ ...state, pendingArtillery: [...(state.pendingArtillery ?? []), { ...attack, id }] })
  }, [state, persist])

  // Atomic: add artillery + mark unit order in a single persist to avoid state overwrites
  const placeArtilleryOrder = useCallback((
    attack: Omit<PendingArtilleryAttack, 'id'>,
    playerId: number,
    instanceKey: string,
  ) => {
    if (!state) return
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const player = state.players[playerId] ?? emptyPlayerState()
    const existing = player.unitOrders[instanceKey]
    const alreadyHadOrder = existing?.status === 'ordered' || existing?.status === 'pushed'
    const nextStatus: UnitOrderStatus = alreadyHadOrder ? 'pushed' : 'ordered'
    const unitOrders = { ...player.unitOrders, [instanceKey]: { status: nextStatus, orderType: 'artillery' as OrderType } }
    const ordersUsed = alreadyHadOrder ? player.ordersUsed : player.ordersUsed + 1
    const players = { ...state.players, [playerId]: { ...player, unitOrders, ordersUsed } }
    persist({
      ...state,
      pendingArtillery: [...(state.pendingArtillery ?? []), { ...attack, id }],
      players,
    })
  }, [state, persist])

  const resolveArtilleryAttack = useCallback((attackId: string) => {
    if (!state) return
    persist({ ...state, pendingArtillery: (state.pendingArtillery ?? []).filter(a => a.id !== attackId) })
  }, [state, persist])

  const resetSession = useCallback((buildTotal?: number) => {
    if (!draftId || results.length === 0) return
    persist(createInitialState(results, buildTotal ?? state?.buildTotal ?? 300))
  }, [draftId, results, persist, state])

  return {
    session: state,
    getPlayerState,
    advanceStage,
    setUnitOrder,
    setDialClicks,
    setBuildTotal,
    setBuildTotalOverride,
    addVictoryPoints,
    addArtilleryAttack,
    placeArtilleryOrder,
    resolveArtilleryAttack,
    resetSession,
  }
}
