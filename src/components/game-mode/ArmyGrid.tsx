// src/components/game-mode/ArmyGrid.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiService, type Draft, type DraftUnit, type Unit, type ColorMeaning } from '@/lib/api'
import { useGameSession } from '@/hooks/useGameSession'
import { getInstanceKey, type OrderType } from '@/lib/gameMode'
import GameDialCard from './GameDialCard'
import OrderTypeMenu from './OrderTypeMenu'
import AttackSequenceOverlay from './AttackSequenceOverlay'
import ArtilleryOrderOverlay from './ArtilleryOrderOverlay'
import TransportOverlay from './TransportOverlay'
import HeatEffectRollModal, { type HeatEffectItem, GREEN_HEX } from './HeatEffectRollModal'
import { useT } from '@/hooks/useT'
import { useBattleLog } from '@/hooks/useBattleLog'
import type { AttackResolutionResult } from './AttackSequenceOverlay'
import type { PendingArtilleryAttack } from '@/lib/gameMode'

const PAGE_SIZE = 6

interface ArmyGridProps {
  draft: Draft
  viewedPlayerId: number
  page: number
}

interface ActiveAttack {
  instanceKey: string
  draftUnit: DraftUnit
  orderType: 'ranged' | 'close' | 'assault'
}

interface ActiveTransport {
  instanceKey: string
  draftUnit: DraftUnit
  action: 'board' | 'disembark'
}

export default function ArmyGrid({ draft, viewedPlayerId, page }: ArmyGridProps) {
  const t = useT()
  const router = useRouter()
  const { session, getPlayerState, setDialClicks, giveOrder, placeArtilleryOrder, boardTransport, disembarkTransport } = useGameSession(draft.id, draft.results)
  const { appendEvent } = useBattleLog(draft.id)
  const [activeAttack, setActiveAttack] = useState<ActiveAttack | null>(null)
  const [activeArtillery, setActiveArtillery] = useState<{ instanceKey: string; draftUnit: DraftUnit } | null>(null)
  const [activeTransport, setActiveTransport] = useState<ActiveTransport | null>(null)
  // Keyed by instanceKey; populated as GameDialCards load their unit data.
  const [unitCache, setUnitCache] = useState<Record<string, Unit>>({})
  const [colorMeaningsById, setColorMeaningsById] = useState<Record<string, ColorMeaning>>({})
  const [heatEffectPending, setHeatEffectPending] = useState<{ unitName: string; effects: HeatEffectItem[] } | null>(null)
  const result = draft.results.find(r => r.playerId === viewedPlayerId)

  useEffect(() => {
    apiService.getColorMeanings().then(meanings => {
      const byId: Record<string, ColorMeaning> = {}
      for (const m of meanings) byId[m.id] = m
      setColorMeaningsById(byId)
    }).catch(() => {})
  }, [])

  if (!session || !result) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0d1208' }}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">{t('common.loading')}</div>
      </div>
    )
  }

  const armyUnits = result.armyUnits
  const totalPages = Math.max(1, Math.ceil(armyUnits.length / PAGE_SIZE))
  const clampedPage = Math.min(Math.max(1, page), totalPages)
  const pageUnits = armyUnits.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)
  const playerState = getPlayerState(viewedPlayerId)
  const isActivePlayerOrderStage = viewedPlayerId === session.activePlayerId && session.stage === 'order'

  const goToPage = (nextPage: number) => {
    router.push(`/game-mode?draftId=${draft.id}&view=army&player=${viewedPlayerId}&page=${nextPage}`)
  }

  const logOrderEvent = (unitName: string, type: OrderType) => {
    appendEvent({
      turn: session.turn,
      stage: session.stage,
      playerId: viewedPlayerId,
      type: 'order_given',
      payload: { unitName, orderType: type },
    })
  }

  const handleSelectOrderType = (instanceKey: string, draftUnit: DraftUnit, type: OrderType) => {
    if (type === 'ranged' || type === 'close' || type === 'assault') {
      setActiveAttack({ instanceKey, draftUnit, orderType: type })
      return
    }
    if (type === 'artillery') {
      setActiveArtillery({ instanceKey, draftUnit })
      return
    }
    if (type === 'board' || type === 'disembark') {
      setActiveTransport({ instanceKey, draftUnit, action: type })
      return
    }
    if (type === 'move' || type === 'run' || type === 'vent' || type === 'charge' || type === 'death_from_above' || type === 'ram') {
      logOrderEvent(draftUnit.name, type)
      giveOrder(viewedPlayerId, instanceKey, type, draftUnit.type)
    }
  }

  const handleTransportConfirm = (passengerKeys: string[]) => {
    if (!session || !activeTransport) return
    const { instanceKey, draftUnit, action } = activeTransport
    if (action === 'board') {
      boardTransport(viewedPlayerId, instanceKey, passengerKeys, draftUnit.type)
    } else {
      disembarkTransport(viewedPlayerId, instanceKey, passengerKeys, draftUnit.type)
    }
    appendEvent({
      turn: session.turn,
      stage: session.stage,
      playerId: viewedPlayerId,
      type: 'order_given',
      payload: { unitName: draftUnit.name, orderType: action },
    })
    setActiveTransport(null)
  }

  const handleArtilleryConfirm = (attack: Omit<PendingArtilleryAttack, 'id'>) => {
    if (!session || !activeArtillery) return
    placeArtilleryOrder(attack, viewedPlayerId, activeArtillery.instanceKey, activeArtillery.draftUnit.type)
    logOrderEvent(activeArtillery.draftUnit.name, 'artillery')
    appendEvent({
      turn: session.turn,
      stage: session.stage,
      playerId: viewedPlayerId,
      type: 'artillery_placed',
      payload: {
        unitName: activeArtillery.draftUnit.name,
        markerDescription: attack.markerDescription,
      },
    })
    setActiveArtillery(null)
  }

  if (armyUnits.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0d1208' }}>
        <div className="font-mono text-sm" style={{ color: '#c9a84c' }}>{result.playerName} {t('army.noUnits')}</div>
        <a href="/game" className="font-mono text-xs" style={{ color: '#7a9a5a' }}>{t('army.backToGame')}</a>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col p-3 gap-3" style={{ background: 'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)' }}>
      <div className="flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=control`)}
          className="font-mono text-xs tracking-widest uppercase"
          style={{ color: '#c9a84c' }}
        >
          {t('army.backToControl')}
        </button>
        <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>{result.playerName} · {t('army.page')} {clampedPage}/{totalPages}</span>
        <div className="flex gap-2">
          <button onClick={() => goToPage(clampedPage - 1)} disabled={clampedPage <= 1} className="px-2 py-1 font-mono text-xs disabled:opacity-30" style={{ color: '#7a9a5a' }}>◀</button>
          <button onClick={() => goToPage(clampedPage + 1)} disabled={clampedPage >= totalPages} className="px-2 py-1 font-mono text-xs disabled:opacity-30" style={{ color: '#7a9a5a' }}>▶</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)' }}>
        {pageUnits.map((draftUnit, idxOnPage) => {
          const index = (clampedPage - 1) * PAGE_SIZE + idxOnPage
          const instanceKey = getInstanceKey(index, draftUnit.id)
          const dialState = playerState.units[instanceKey] ?? { damageClicks: 0, heatClicks: 0 }
          const orderState = playerState.unitOrders[instanceKey] ?? { status: 'none' as const }
          const isPassenger = !!dialState.aboard
          const loadedUnit = unitCache[instanceKey]
          const cargoCapacity = loadedUnit?.cargoCapacity ?? 0
          const hasArtillery = loadedUnit?.hasArtillery ?? false
          const hasPassengers = (dialState.passengers?.length ?? 0) > 0

          return (
            <GameDialCard
              key={instanceKey}
              draftUnit={draftUnit}
              instanceKey={instanceKey}
              damageClicks={dialState.damageClicks}
              heatClicks={dialState.heatClicks}
              onUnitLoaded={u => setUnitCache(c => ({ ...c, [instanceKey]: u }))}
              onHeatEffectClick={() => {
                // Rulebook p.21: when multiple effects appear simultaneously,
                // roll a separate die for each and apply results at the same time.
                // So any rect click opens a modal with ALL effects on the current step.
                const heatDialArr = loadedUnit?.heatDial
                if (!heatDialArr || heatDialArr.length === 0) return
                const stepIdx = Math.min(dialState.heatClicks, heatDialArr.length - 1)
                const step = heatDialArr[stepIdx]
                const effects: HeatEffectItem[] = []
                const addEffect = (colorId: string | undefined, slot: HeatEffectItem['slot']) => {
                  if (!colorId) return
                  const meaning = colorMeaningsById[colorId]
                  if (meaning && meaning.color.hexCode !== GREEN_HEX) effects.push({ slot, meaning })
                }
                addEffect(step.primaryHeatColorMeaningId, 'primary')
                addEffect(step.secondaryHeatColorMeaningId, 'secondary')
                addEffect(step.movementHeatColorMeaningId, 'movement')
                if (effects.length > 0) {
                  setHeatEffectPending({ unitName: draftUnit.name, effects })
                }
              }}
              onDamageChange={clicks => {
                appendEvent({
                  turn: session.turn,
                  stage: session.stage,
                  playerId: viewedPlayerId,
                  type: 'dial_adjusted',
                  payload: { unitName: draftUnit.name, field: 'damage', before: dialState.damageClicks, after: clicks },
                })
                setDialClicks(viewedPlayerId, instanceKey, { damageClicks: clicks })
              }}
              onHeatChange={clicks => {
                appendEvent({
                  turn: session.turn,
                  stage: session.stage,
                  playerId: viewedPlayerId,
                  type: 'dial_adjusted',
                  payload: { unitName: draftUnit.name, field: 'heat', before: dialState.heatClicks, after: clicks },
                })
                setDialClicks(viewedPlayerId, instanceKey, { heatClicks: clicks })
              }}
              headerRight={
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasPassengers && (
                    <span
                      className="font-mono text-[9px] px-1 corner-clip-sm"
                      style={{ background: 'rgba(40,80,120,0.2)', border: '1px solid #3a6090', color: '#7aaad8' }}
                      title={`${dialState.passengers!.length} passageiro(s) a bordo`}
                    >
                      {dialState.passengers!.length}P
                    </span>
                  )}
                  {hasArtillery && (
                    <span
                      className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm"
                      style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid #3a4a2a', color: '#c9a84c' }}
                    >
                      ART
                    </span>
                  )}
                  <OrderTypeMenu
                    unitType={draftUnit.type}
                    hasArtillery={hasArtillery}
                    cargoCapacity={cargoCapacity}
                    hasPassengers={hasPassengers}
                    isPassenger={isPassenger}
                    orderState={orderState}
                    markerCount={dialState.markerCount ?? 0}
                    interactive={isActivePlayerOrderStage}
                    onSelect={type => handleSelectOrderType(instanceKey, draftUnit, type)}
                  />
                </div>
              }
            />
          )
        })}
      </div>

      {activeAttack && (
        <AttackSequenceOverlay
          draft={draft}
          attackerPlayerId={viewedPlayerId}
          attackerUnit={activeAttack.draftUnit}
          attackerInstanceKey={activeAttack.instanceKey}
          orderType={activeAttack.orderType}
          getDialState={(playerId, instanceKey) => getPlayerState(playerId).units[instanceKey] ?? { damageClicks: 0, heatClicks: 0 }}
          setDialClicks={setDialClicks}
          onOrderMarked={() => {
            logOrderEvent(activeAttack.draftUnit.name, activeAttack.orderType)
            giveOrder(viewedPlayerId, activeAttack.instanceKey, activeAttack.orderType, activeAttack.draftUnit.type)
          }}
          onComplete={(result: AttackResolutionResult) => {
            appendEvent({
              turn: session.turn,
              stage: session.stage,
              playerId: viewedPlayerId,
              type: 'attack_resolved',
              payload: {
                attackerName: result.attacker.name,
                targetNames: result.targets.map(t => t.name),
                orderType: result.orderType,
                damageDelta: result.targets.reduce((sum, t) => sum + Math.max(0, t.damageDelta), 0),
                heatDelta: result.targets.reduce((sum, t) => sum + Math.max(0, t.heatDelta), 0),
                attackerPushDamage: result.attacker.damageDelta,
                attackerHeatGain: result.attacker.heatDelta,
              },
            })
            setActiveAttack(null)
          }}
          onClose={() => setActiveAttack(null)}
        />
      )}

      {activeArtillery && session && (
        <ArtilleryOrderOverlay
          attackerPlayerId={viewedPlayerId}
          attackerUnit={activeArtillery.draftUnit}
          attackerInstanceKey={activeArtillery.instanceKey}
          currentTurn={session.turn}
          onConfirm={handleArtilleryConfirm}
          onClose={() => setActiveArtillery(null)}
        />
      )}

      {activeTransport && (
        <TransportOverlay
          action={activeTransport.action}
          transportDraftUnit={activeTransport.draftUnit}
          transportInstanceKey={activeTransport.instanceKey}
          cargoCapacity={unitCache[activeTransport.instanceKey]?.cargoCapacity ?? 0}
          allArmyUnits={armyUnits}
          playerState={playerState}
          onConfirm={handleTransportConfirm}
          onClose={() => setActiveTransport(null)}
        />
      )}

      {heatEffectPending && (
        <HeatEffectRollModal
          unitName={heatEffectPending.unitName}
          effects={heatEffectPending.effects}
          onClose={() => setHeatEffectPending(null)}
        />
      )}
    </div>
  )
}
