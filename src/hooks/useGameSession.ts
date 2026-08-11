'use client'

import { useCallback, useEffect, useState } from 'react'
import { safeLocalStorage } from '@/lib/storage'
import { nextStage as computeNextStage, nextPlayerId, type OrderStage, type OrderType, type PendingArtilleryAttack, type VictoryCondition } from '@/lib/gameMode'
import type { DraftResult } from '@/lib/api'

export type UnitOrderStatus = 'none' | 'ordered' | 'pushed'

export interface UnitOrderState {
  status: UnitOrderStatus
  orderType?: OrderType
}

export interface UnitDialState {
  damageClicks: number
  heatClicks: number
  // Manually set by the player: the unit data model has no field indicating the
  // Artillery special ability (rulebook p.25: "a unit is an artillery unit if it
  // has a number in parentheses printed after its maximum range value"), so this
  // gates the Artillery order option instead of trying to infer it.
  hasArtillery?: boolean
}

// Free-text reminder for a Command-stage effect (SEC/pilot card/faction ability, etc.)
// the player wants to remember to resolve. Checked state resets each time this
// player's Command stage begins again; the item itself persists across turns.
export interface CommandReminder {
  id: string
  text: string
  checked: boolean
}

export interface PlayerSessionState {
  ordersUsed: number
  ordersTotal?: number       // override for this player's order total this turn
  unitOrders: Record<string, UnitOrderState>
  units: Record<string, UnitDialState>
  commandReminders: CommandReminder[]
}

// Per-player victory point totals, broken down by the rulebook's 3 victory
// conditions (p.38-40): VC1 eliminating opposing units, VC2 controlling the
// battlefield (scored at game end), VC3 controlling the opponent's deployment zone.
export interface VictoryPointsBreakdown {
  vc1: number
  vc2: number
  vc3: number
}

function emptyVictoryPoints(): VictoryPointsBreakdown {
  return { vc1: 0, vc2: 0, vc3: 0 }
}

export interface GameSessionState {
  turn: number
  stage: OrderStage
  activePlayerId: number
  buildTotal: number                          // agreed game build total (rulebook p.13)
  buildTotalOverride: Record<number, number>  // legacy per-player override, kept for compat
  victoryPoints: Record<number, VictoryPointsBreakdown>  // playerId -> VC1/VC2/VC3 totals
  pendingArtillery: PendingArtilleryAttack[]  // placed in Order stage, resolved in Command
  players: Record<number, PlayerSessionState>
}

function storageKey(draftId: string): string {
  return `wargame_game_session_${draftId}`
}

function emptyPlayerState(): PlayerSessionState {
  return { ordersUsed: 0, unitOrders: {}, units: {}, commandReminders: [] }
}

// Sessions saved before victoryPoints was broken down by VC stored a plain
// number per player; treat that legacy value as VC3 (the only VC previously
// scorable in the app) so old in-progress sessions don't lose their totals.
function normalizeVictoryPoints(raw: unknown): Record<number, VictoryPointsBreakdown> {
  if (!raw || typeof raw !== 'object') return {}
  const result: Record<number, VictoryPointsBreakdown> = {}
  for (const [playerIdStr, value] of Object.entries(raw as Record<string, unknown>)) {
    const playerId = Number(playerIdStr)
    if (typeof value === 'number') {
      result[playerId] = { ...emptyVictoryPoints(), vc3: value }
    } else if (value && typeof value === 'object') {
      result[playerId] = { ...emptyVictoryPoints(), ...(value as Partial<VictoryPointsBreakdown>) }
    }
  }
  return result
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
          victoryPoints: normalizeVictoryPoints(parsed.victoryPoints),
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
    // Spread over emptyPlayerState() so sessions saved before a field existed
    // (e.g. commandReminders) still get a safe default instead of undefined.
    return { ...emptyPlayerState(), ...(state?.players[playerId] ?? {}) }
  }, [state])

  const advanceStage = useCallback(() => {
    if (!state) return
    const leavingCommand = state.stage === 'command'
    const leavingCleanup = state.stage === 'cleanup'
    const newStage = computeNextStage(state.stage)
    const newActivePlayerId = leavingCleanup ? nextPlayerId(results, state.activePlayerId) : state.activePlayerId
    const newTurn = leavingCleanup ? state.turn + 1 : state.turn

    const players = { ...state.players }
    if (leavingCommand) {
      // Command reminders are a recurring checklist: uncheck everything when this
      // player's Command stage ends, but keep the items themselves for next time.
      const current = { ...emptyPlayerState(), ...(players[state.activePlayerId] ?? {}) }
      players[state.activePlayerId] = {
        ...current,
        commandReminders: current.commandReminders.map(r => ({ ...r, checked: false })),
      }
    }
    if (leavingCleanup) {
      const current = { ...emptyPlayerState(), ...(players[state.activePlayerId] ?? {}) }
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

  const addCommandReminder = useCallback((playerId: number, text: string) => {
    if (!state) return
    const trimmed = text.trim()
    if (!trimmed) return
    const player = { ...emptyPlayerState(), ...(state.players[playerId] ?? {}) }
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `rem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const commandReminders = [...player.commandReminders, { id, text: trimmed, checked: false }]
    const players = { ...state.players, [playerId]: { ...player, commandReminders } }
    persist({ ...state, players })
  }, [state, persist])

  const toggleCommandReminder = useCallback((playerId: number, reminderId: string) => {
    if (!state) return
    const player = { ...emptyPlayerState(), ...(state.players[playerId] ?? {}) }
    const commandReminders = player.commandReminders.map(r =>
      r.id === reminderId ? { ...r, checked: !r.checked } : r
    )
    const players = { ...state.players, [playerId]: { ...player, commandReminders } }
    persist({ ...state, players })
  }, [state, persist])

  const removeCommandReminder = useCallback((playerId: number, reminderId: string) => {
    if (!state) return
    const player = { ...emptyPlayerState(), ...(state.players[playerId] ?? {}) }
    const commandReminders = player.commandReminders.filter(r => r.id !== reminderId)
    const players = { ...state.players, [playerId]: { ...player, commandReminders } }
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

  const addVictoryPoints = useCallback((playerId: number, vc: VictoryCondition, points: number) => {
    if (!state) return
    const current = state.victoryPoints[playerId] ?? emptyVictoryPoints()
    const key = `vc${vc}` as keyof VictoryPointsBreakdown
    const updated = { ...current, [key]: current[key] + points }
    persist({ ...state, victoryPoints: { ...state.victoryPoints, [playerId]: updated } })
  }, [state, persist])

  const setVictoryPoints = useCallback((playerId: number, vc: VictoryCondition, value: number) => {
    if (!state) return
    const current = state.victoryPoints[playerId] ?? emptyVictoryPoints()
    const key = `vc${vc}` as keyof VictoryPointsBreakdown
    const updated = { ...current, [key]: Math.max(0, value) }
    persist({ ...state, victoryPoints: { ...state.victoryPoints, [playerId]: updated } })
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
    addCommandReminder,
    toggleCommandReminder,
    removeCommandReminder,
    setBuildTotal,
    setBuildTotalOverride,
    addVictoryPoints,
    setVictoryPoints,
    addArtilleryAttack,
    placeArtilleryOrder,
    resolveArtilleryAttack,
    resetSession,
  }
}
