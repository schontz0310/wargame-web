// src/components/game-mode/ArmyGrid.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Draft, DraftUnit } from '@/lib/api'
import { useGameSession } from '@/hooks/useGameSession'
import { getInstanceKey, type OrderType } from '@/lib/gameMode'
import GameDialCard from './GameDialCard'
import OrderTypeMenu from './OrderTypeMenu'
import AttackSequenceOverlay from './AttackSequenceOverlay'
import ArtilleryOrderOverlay from './ArtilleryOrderOverlay'
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
  orderType: 'ranged' | 'close'
}

export default function ArmyGrid({ draft, viewedPlayerId, page }: ArmyGridProps) {
  const router = useRouter()
  const { session, getPlayerState, setDialClicks, setUnitOrder, placeArtilleryOrder } = useGameSession(draft.id, draft.results)
  const { appendEvent } = useBattleLog(draft.id)
  const [activeAttack, setActiveAttack] = useState<ActiveAttack | null>(null)
  const [activeArtillery, setActiveArtillery] = useState<{ instanceKey: string; draftUnit: DraftUnit } | null>(null)
  const result = draft.results.find(r => r.playerId === viewedPlayerId)

  if (!session || !result) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0d1208' }}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">[ CARREGANDO... ]</div>
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

  const logOrderEvent = (instanceKey: string, unitName: string, type: OrderType) => {
    const existing = playerState.unitOrders[instanceKey]
    const alreadyHadOrder = existing?.status === 'ordered' || existing?.status === 'pushed'
    appendEvent({
      turn: session.turn,
      stage: session.stage,
      playerId: viewedPlayerId,
      type: alreadyHadOrder ? 'order_pushed' : 'order_given',
      payload: { unitName, orderType: type },
    })
  }

  const handleSelectOrderType = (instanceKey: string, draftUnit: DraftUnit, type: OrderType) => {
    if (type === 'ranged' || type === 'close') {
      setActiveAttack({ instanceKey, draftUnit, orderType: type })
      return
    }
    if (type === 'artillery') {
      setActiveArtillery({ instanceKey, draftUnit })
      return
    }
    if (type === 'move' || type === 'run' || type === 'vent' || type === 'charge' || type === 'death_from_above' || type === 'ram') {
      logOrderEvent(instanceKey, draftUnit.name, type)
      setUnitOrder(viewedPlayerId, instanceKey, type)
    }
  }

  const handleArtilleryConfirm = (attack: Omit<PendingArtilleryAttack, 'id'>) => {
    if (!session || !activeArtillery) return
    placeArtilleryOrder(attack, viewedPlayerId, activeArtillery.instanceKey)
    logOrderEvent(activeArtillery.instanceKey, activeArtillery.draftUnit.name, 'artillery')
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
        <div className="font-mono text-sm" style={{ color: '#c9a84c' }}>{result.playerName} não tem unidades no army</div>
        <a href="/drafts" className="font-mono text-xs" style={{ color: '#7a9a5a' }}>← Voltar para /drafts</a>
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
          ← Painel de Controle
        </button>
        <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>{result.playerName} · Página {clampedPage}/{totalPages}</span>
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
          return (
            <GameDialCard
              key={instanceKey}
              draftUnit={draftUnit}
              instanceKey={instanceKey}
              damageClicks={dialState.damageClicks}
              heatClicks={dialState.heatClicks}
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
                  <button
                    onClick={() => setDialClicks(viewedPlayerId, instanceKey, { hasArtillery: !dialState.hasArtillery })}
                    title="Marcar se esta unidade tem a característica Artilharia (número entre parênteses no alcance máximo)"
                    className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm"
                    style={{
                      background: dialState.hasArtillery ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.3)',
                      border: '1px solid #3a4a2a',
                      color: dialState.hasArtillery ? '#c9a84c' : '#4a5e3a',
                    }}
                  >
                    ART
                  </button>
                  <OrderTypeMenu
                    unitType={draftUnit.type}
                    hasArtillery={dialState.hasArtillery ?? false}
                    orderState={orderState}
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
            logOrderEvent(activeAttack.instanceKey, activeAttack.draftUnit.name, activeAttack.orderType)
            setUnitOrder(viewedPlayerId, activeAttack.instanceKey, activeAttack.orderType)
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
    </div>
  )
}
