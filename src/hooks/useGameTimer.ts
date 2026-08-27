'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeLocalStorage } from '@/lib/storage'

export interface TimerConfig {
  enabled: boolean
  totalSeconds: number
}

interface TimerState {
  playerSeconds: Record<number, number>
  currentStart: number | null
  activePlayerId: number | null
}

const configKey = (draftId: string) => `wargame_timer_config_${draftId}`
const stateKey = (draftId: string) => `wargame_timer_state_${draftId}`

const emptyState = (): TimerState => ({ playerSeconds: {}, currentStart: null, activePlayerId: null })

export function useGameTimer(draftId: string, activePlayerId: number) {
  const [config, setConfig] = useState<TimerConfig>({ enabled: false, totalSeconds: 0 })
  const [timerState, setTimerState] = useState<TimerState>(emptyState())
  const [now, setNow] = useState(Date.now())
  const [ready, setReady] = useState(false)

  // Load config and state from localStorage once
  useEffect(() => {
    const rawCfg = safeLocalStorage.getItem(configKey(draftId))
    if (rawCfg) {
      try { setConfig(JSON.parse(rawCfg)) } catch { /* ignore */ }
    }

    const rawState = safeLocalStorage.getItem(stateKey(draftId))
    let loaded = emptyState()
    if (rawState) {
      try { loaded = JSON.parse(rawState) } catch { /* ignore */ }
    }

    // On (re)mount: save elapsed time for active player but reset currentStart
    // so the time the page was closed doesn't count
    if (loaded.currentStart !== null && loaded.activePlayerId !== null) {
      const elapsed = Math.min(Math.floor((Date.now() - loaded.currentStart) / 1000), 7200)
      loaded = {
        ...loaded,
        playerSeconds: {
          ...loaded.playerSeconds,
          [loaded.activePlayerId]: (loaded.playerSeconds[loaded.activePlayerId] ?? 0) + elapsed,
        },
        currentStart: null,
      }
      safeLocalStorage.setItem(stateKey(draftId), JSON.stringify(loaded))
    }

    setTimerState(loaded)
    setReady(true)
  }, [draftId])

  // Tick every second when timer is enabled and running
  useEffect(() => {
    if (!config.enabled) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [config.enabled])

  // Start or switch timer when ready or activePlayerId changes
  useEffect(() => {
    if (!ready || !config.enabled) return

    const nowTs = Date.now()
    setTimerState(prev => {
      const updated: TimerState = {
        playerSeconds: { ...prev.playerSeconds },
        currentStart: prev.currentStart,
        activePlayerId: prev.activePlayerId,
      }

      // Stop previous player if switching
      if (
        prev.activePlayerId !== null &&
        prev.activePlayerId !== activePlayerId &&
        prev.currentStart !== null
      ) {
        const elapsed = Math.floor((nowTs - prev.currentStart) / 1000)
        updated.playerSeconds[prev.activePlayerId] =
          (updated.playerSeconds[prev.activePlayerId] ?? 0) + elapsed
        updated.currentStart = null
      }

      // Start current player's segment
      if (updated.activePlayerId !== activePlayerId || updated.currentStart === null) {
        updated.currentStart = nowTs
        updated.activePlayerId = activePlayerId
      }

      safeLocalStorage.setItem(stateKey(draftId), JSON.stringify(updated))
      return updated
    })
  }, [ready, activePlayerId, config.enabled, draftId])

  const getPlayerSeconds = useCallback(
    (playerId: number): number => {
      const stored = timerState.playerSeconds[playerId] ?? 0
      if (config.enabled && timerState.activePlayerId === playerId && timerState.currentStart !== null) {
        return stored + Math.floor((now - timerState.currentStart) / 1000)
      }
      return stored
    },
    [config.enabled, timerState, now]
  )

  const getRemainingSeconds = useCallback((): number => {
    if (!config.enabled || config.totalSeconds <= 0) return 0
    const storedTotal = Object.values(timerState.playerSeconds).reduce((a, b) => a + b, 0)
    const liveElapsed =
      timerState.currentStart !== null ? Math.floor((now - timerState.currentStart) / 1000) : 0
    return Math.max(0, config.totalSeconds - storedTotal - liveElapsed)
  }, [config, timerState, now])

  return { config, getPlayerSeconds, getRemainingSeconds }
}

export function loadTimerConfig(draftId: string): TimerConfig {
  const raw = safeLocalStorage.getItem(configKey(draftId))
  if (raw) {
    try { return JSON.parse(raw) as TimerConfig } catch { /* ignore */ }
  }
  return { enabled: false, totalSeconds: 0 }
}

export function saveTimerConfig(draftId: string, config: TimerConfig) {
  safeLocalStorage.setItem(configKey(draftId), JSON.stringify(config))
}

export function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
