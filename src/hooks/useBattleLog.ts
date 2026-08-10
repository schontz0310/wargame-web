'use client'

import { useCallback, useEffect, useState } from 'react'
import { safeLocalStorage } from '@/lib/storage'
import { ORDER_TYPE_LABELS, type OrderStage, type OrderType } from '@/lib/gameMode'

export type BattleLogEventType =
  | 'stage_change'
  | 'order_given'
  | 'order_pushed'
  | 'attack_resolved'
  | 'dial_adjusted'
  | 'game_reset'

export interface BattleLogEvent {
  id: string
  timestamp: string
  turn: number
  stage: OrderStage
  playerId: number
  type: BattleLogEventType
  payload: Record<string, unknown>
}

function storageKey(draftId: string): string {
  return `wargame_game_log_${draftId}`
}

function generateEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // fall through to the manual fallback below (e.g. insecure context)
    }
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function useBattleLog(draftId: string | null) {
  const [events, setEvents] = useState<BattleLogEvent[]>([])

  useEffect(() => {
    if (!draftId) {
      setEvents([])
      return
    }
    const raw = safeLocalStorage.getItem(storageKey(draftId))
    if (raw) {
      try {
        setEvents(JSON.parse(raw) as BattleLogEvent[])
        return
      } catch {
        // fall through
      }
    }
    setEvents([])
  }, [draftId])

  const appendEvent = useCallback((event: Omit<BattleLogEvent, 'id' | 'timestamp'>) => {
    if (!draftId) return
    const full: BattleLogEvent = {
      ...event,
      id: generateEventId(),
      timestamp: new Date().toISOString(),
    }
    setEvents(prev => {
      const next = [...prev, full]
      safeLocalStorage.setItem(storageKey(draftId), JSON.stringify(next))
      return next
    })
  }, [draftId])

  const clearLog = useCallback(() => {
    setEvents([])
    if (draftId) {
      safeLocalStorage.setItem(storageKey(draftId), JSON.stringify([]))
    }
  }, [draftId])

  return { events, appendEvent, clearLog }
}

const STAGE_LABELS: Record<OrderStage, string> = {
  command: 'Comando',
  order: 'Ordens',
  cleanup: 'Limpeza',
}

export function eventToNarrativeLine(event: BattleLogEvent, playerName: string): string {
  const prefix = `Turno ${event.turn} — ${playerName}`
  switch (event.type) {
    case 'stage_change': {
      const stage = event.payload.toStage as OrderStage
      return `${prefix} entra no estágio de ${STAGE_LABELS[stage]}.`
    }
    case 'order_given': {
      const orderType = event.payload.orderType as OrderType
      const unitName = event.payload.unitName as string
      return `${prefix} deu ordem de ${ORDER_TYPE_LABELS[orderType]} à ${unitName}.`
    }
    case 'order_pushed': {
      const orderType = event.payload.orderType as OrderType
      const unitName = event.payload.unitName as string
      return `${prefix}: ${unitName} recebeu uma ordem adicional de ${ORDER_TYPE_LABELS[orderType]} e foi empurrada.`
    }
    case 'attack_resolved': {
      const attackerName = event.payload.attackerName as string
      const targetNames = (event.payload.targetNames as string[]).join(', ')
      const orderType = event.payload.orderType as OrderType
      const damageDelta = event.payload.damageDelta as number
      const heatDelta = event.payload.heatDelta as number
      const attackerPushDamage = event.payload.attackerPushDamage as number
      const attackerHeatGain = event.payload.attackerHeatGain as number
      const parts = [
        damageDelta > 0 ? `dano +${damageDelta}` : null,
        heatDelta > 0 ? `calor +${heatDelta}` : null,
        attackerPushDamage > 0 ? `atacante sofreu push +${attackerPushDamage}` : null,
        attackerHeatGain > 0 ? `atacante ganhou calor +${attackerHeatGain}` : null,
      ].filter((part): part is string => part !== null)
      const deltaText = parts.length > 0 ? parts.join(', ') : 'sem alteração registrada'
      return `${prefix} deu ordem de ${ORDER_TYPE_LABELS[orderType]} à ${attackerName} contra ${targetNames}. ${deltaText}.`
    }
    case 'dial_adjusted': {
      const unitName = event.payload.unitName as string
      const field = event.payload.field as string
      const before = event.payload.before as number
      const after = event.payload.after as number
      const fieldLabel = field === 'heat' ? 'calor' : 'dano'
      return `${prefix}: ${unitName} teve ${fieldLabel} ajustado manualmente de ${before} para ${after}.`
    }
    case 'game_reset':
      return `${prefix}: a partida foi reiniciada.`
    default:
      return `${prefix}: evento desconhecido.`
  }
}

export function buildNarrativeText(
  events: BattleLogEvent[],
  draftName: string,
  playerNameById: Record<number, string>,
): string {
  const lines = [`=== Relatório de Batalha — ${draftName} ===`, '']
  for (const event of events) {
    const playerName = playerNameById[event.playerId] ?? `Jogador ${event.playerId}`
    lines.push(eventToNarrativeLine(event, playerName))
  }
  return lines.join('\n')
}
