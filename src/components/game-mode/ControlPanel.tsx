'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Draft } from '@/lib/api'
import { useGameSession } from '@/hooks/useGameSession'
import { computeOrdersTotal, getInstanceKey, nextStage, vcWinner, VICTORY_CONDITION_LABELS, type OrderStage, type VictoryCondition } from '@/lib/gameMode'
import { useBattleLog } from '@/hooks/useBattleLog'
import { safeLocalStorage } from '@/lib/storage'
import { useGameTimer, formatSeconds } from '@/hooks/useGameTimer'
import CommandPhasePanel from './CommandPhasePanel'
import { useT } from '@/hooks/useT'
import VictoryScoreboard from './VictoryScoreboard'
import OpponentUnitsPanel from './OpponentUnitsPanel'


interface ControlPanelProps {
  draft: Draft
}

export default function ControlPanel({ draft }: ControlPanelProps) {
  const t = useT()
  const router = useRouter()
  const {
    session,
    getPlayerState,
    advanceStage,
    setDialClicks,
    addVictoryPoints,
    setVictoryPoints,
    resolveArtilleryAttack,
    addCommandReminder,
    toggleCommandReminder,
    removeCommandReminder,
    resetSession,
  } = useGameSession(draft.id, draft.results)
  const { appendEvent, clearLog } = useBattleLog(draft.id)
  const timer = useGameTimer(draft.id, session?.activePlayerId ?? draft.results[0]?.playerId ?? 1)
  const [viewedPlayerId, setViewedPlayerId] = useState<number>(draft.results[0]?.playerId ?? 1)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isClient, setIsClient] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Tracks which Mechs already had their one cleanup heat click applied this phase
  const [cleanupHeatApplied, setCleanupHeatApplied] = useState<Set<string>>(new Set())
  // Static + custom cleanup checklist
  const [cleanupChecked, setCleanupChecked] = useState<Set<string>>(new Set())
  const [cleanupCustomItems, setCleanupCustomItems] = useState<{ id: string; text: string }[]>([])
  const [cleanupReminderInput, setCleanupReminderInput] = useState('')
  const [orderPanelTab, setOrderPanelTab] = useState<'opponent' | 'mine'>('opponent')

  const STAGE_LABELS: Record<OrderStage, string> = {
    command: t('control.stage.command'),
    order: t('control.stage.order'),
    cleanup: t('control.stage.cleanup'),
  }

  const VC_REASON_LABELS: Record<VictoryCondition, string> = {
    1: `${VICTORY_CONDITION_LABELS[1]}: ${t('control.vc.vc1').toLowerCase()}`,
    2: `${VICTORY_CONDITION_LABELS[2]}: ${t('control.vc.vc2').toLowerCase()}`,
    3: `${VICTORY_CONDITION_LABELS[3]}: ${t('control.vc.vc3').toLowerCase()}`,
  }

  useEffect(() => { setIsClient(true) }, [])

  // Sync viewed player to active player whenever the turn advances
  useEffect(() => {
    if (session?.activePlayerId) setViewedPlayerId(session.activePlayerId)
  }, [session?.activePlayerId])

  // Reset cleanup transient state whenever the cleanup phase (re-)starts
  useEffect(() => {
    if (session?.stage === 'cleanup') {
      setCleanupHeatApplied(new Set())
      setCleanupChecked(new Set())
    }
  }, [session?.stage, session?.turn])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    if (!isClient) return
    const raw = safeLocalStorage.getItem('myDrafts')
    if (raw) {
      try { setDrafts(JSON.parse(raw) as Draft[]) } catch { setDrafts([]) }
    }
  }, [isClient])

  const handleResetToPreparation = () => {
    const updatedDrafts = drafts.map(d =>
      d.id === draft.id ? { ...d, preparationCompleted: false } : d
    )
    setDrafts(updatedDrafts)
    if (isClient) safeLocalStorage.setItem('myDrafts', JSON.stringify(updatedDrafts))
    safeLocalStorage.removeItem(`preparation-state-${draft.id}`)
    resetSession()
    clearLog()
    setConfirmingReset(false)
    window.location.reload()
  }

  const handleResetBattleOnly = () => {
    resetSession()
    clearLog()
    setConfirmingReset(false)
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0d1208' }}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">{t('common.loadingSession')}</div>
      </div>
    )
  }

  const activePlayerState = getPlayerState(session.activePlayerId)
  const round = Math.ceil(session.turn / Math.max(1, draft.results.length))

  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `${t('control.player')} ${playerId}`
  }

  const goToArmy = (playerId: number) => {
    router.push(`/game-mode?draftId=${draft.id}&view=army&player=${playerId}&page=1`)
  }

  const handleAdvanceStage = () => {
    const toStage = nextStage(session.stage)
    appendEvent({
      turn: session.turn,
      stage: session.stage,
      playerId: session.activePlayerId,
      type: 'stage_change',
      payload: { toStage },
    })
    advanceStage()
  }

  const handleProceedToOrders = () => {
    appendEvent({
      turn: session.turn,
      stage: 'command',
      playerId: session.activePlayerId,
      type: 'stage_change',
      payload: { toStage: 'order' },
    })
    advanceStage()
  }

  const handleResolveArtillery = (attackId: string) => {
    const attack = session.pendingArtillery.find(a => a.id === attackId)
    if (attack) {
      appendEvent({
        turn: session.turn,
        stage: 'command',
        playerId: session.activePlayerId,
        type: 'artillery_resolved',
        payload: {
          attackerUnitName: attack.attackerUnitName,
          hit: true,
          drifted: false,
          damageDelta: 0,
        },
      })
    }
    resolveArtilleryAttack(attackId)
  }

  const handleAddVP = (playerId: number, vc: VictoryCondition, points: number) => {
    if (points === 0) return
    addVictoryPoints(playerId, vc, points)
    appendEvent({
      turn: session.turn,
      stage: session.stage,
      playerId,
      type: 'vp_scored',
      payload: { points, vc, reason: VC_REASON_LABELS[vc] },
    })
  }

  const handleSetVP = (playerId: number, vc: VictoryCondition, value: number) => {
    const key = `vc${vc}` as 'vc1' | 'vc2' | 'vc3'
    const current = session.victoryPoints[playerId]?.[key] ?? 0
    const delta = value - current
    if (delta === 0) return
    setVictoryPoints(playerId, vc, value)
    appendEvent({
      turn: session.turn,
      stage: session.stage,
      playerId,
      type: 'vp_scored',
      payload: { points: delta, vc, reason: VC_REASON_LABELS[vc] },
    })
  }

  return (
    <div
      className="h-screen overflow-hidden flex flex-col p-4 sm:p-6 gap-4"
      style={{ background: 'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-widest uppercase" style={{ color: '#e8d5a0' }}>
            {draft.name}
          </h1>
          <p className="font-mono text-sm mt-0.5" style={{ color: '#5a7a4a' }}>
            {t('control.turn')} {session.turn} · {t('control.round')} {round}
          </p>
          {timer.config.enabled && (() => {
            const remaining = timer.getRemainingSeconds()
            const isLow = remaining < 300
            return (
              <p className="font-mono text-xs mt-0.5 tracking-widest" style={{ color: isLow ? '#c06060' : '#c9a84c' }}>
                ⏱ {formatSeconds(remaining)} {t('control.timer.remaining')}
              </p>
            )
          })()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 font-mono text-sm corner-clip-sm"
            style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
            title={isFullscreen ? t('control.exitFullscreen') : t('control.enterFullscreen')}
          >
            {isFullscreen ? t('control.exitFullscreenBtn') : t('control.enterFullscreenBtn')}
          </button>
          <button
            onClick={() => router.push(`/game-mode?draftId=${draft.id}&view=log`)}
            className="px-3 py-1.5 font-mono text-sm corner-clip-sm"
            style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
          >
            {t('control.viewLog')}
          </button>
          <button
            onClick={() => setConfirmingReset(true)}
            className="px-3 py-1.5 font-mono text-sm corner-clip-sm"
            style={{ background: 'rgba(150,50,50,0.15)', border: '1px solid #5a2a2a', color: '#c06060' }}
          >
            {t('control.reset')}
          </button>
        </div>
      </div>

      {/* Victory scoreboard — visible on every stage tab */}
      <VictoryScoreboard
        draft={draft}
        victoryPoints={session.victoryPoints}
        getPlayerDisplayName={getPlayerDisplayName}
        onAdjustVP={(playerId, vc, delta) => handleAddVP(playerId, vc, delta)}
        onSetVP={(playerId, vc, value) => handleSetVP(playerId, vc, value)}
      />

      {/* Status Strip — phase + active player + orders in one colored bar */}
      {(() => {
        const STAGE_THEME = {
          command: { bg: 'rgba(201,168,76,0.10)', border: '#c9a84c', text: '#c9a84c', dim: 'rgba(201,168,76,0.25)' },
          order:   { bg: 'rgba(74,154,58,0.10)',  border: '#4a9a3a', text: '#7aba5a', dim: 'rgba(74,154,58,0.25)' },
          cleanup: { bg: 'rgba(176,80,48,0.10)',  border: '#c06050', text: '#d07858', dim: 'rgba(176,80,48,0.25)' },
        } as const
        const theme = STAGE_THEME[session.stage]
        const activeResult = draft.results.find(r => r.playerId === session.activePlayerId)
        const activeOrdersTotal = computeOrdersTotal(activeResult?.armyPoints ?? 0)
        const activeOrdersUsed = getPlayerState(session.activePlayerId).ordersUsed
        return (
          <div
            className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
            style={{ background: theme.bg, borderLeft: `4px solid ${theme.border}` }}
          >
            {/* Fase */}
            <span className="font-mono text-xl font-bold tracking-widest uppercase flex-1" style={{ color: theme.text }}>
              {STAGE_LABELS[session.stage]}
            </span>
            {/* Jogador ativo */}
            <span className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
              {getPlayerDisplayName(session.activePlayerId)}
            </span>
            {/* Ordens — só na fase de ordens */}
            {session.stage === 'order' && (
              <span
                className="font-mono text-base font-bold px-2 py-0.5"
                style={{ background: theme.dim, color: theme.text }}
              >
                {activeOrdersUsed}/{activeOrdersTotal}
              </span>
            )}
          </div>
        )
      })()}

      {/* Player tabs */}
      <div className="flex gap-2 flex-wrap flex-shrink-0">
        {(() => {
          const playerIds = draft.results.map(r => r.playerId)
          const vpOf = (playerId: number) => session.victoryPoints[playerId]
          const winnerByVc: Record<VictoryCondition, number | null> = {
            1: vcWinner(playerIds, pid => vpOf(pid)?.vc1 ?? 0),
            2: vcWinner(playerIds, pid => vpOf(pid)?.vc2 ?? 0),
            3: vcWinner(playerIds, pid => vpOf(pid)?.vc3 ?? 0),
          }
          return draft.results.map(result => {
            const isActive = result.playerId === session.activePlayerId
            const isViewed = result.playerId === viewedPlayerId
            const vcsWon = ([1, 2, 3] as VictoryCondition[]).filter(vc => winnerByVc[vc] === result.playerId).length
            const displayName = getPlayerDisplayName(result.playerId)
            const playerOrdersTotal = computeOrdersTotal(result.armyPoints)
            const playerOrdersUsed = getPlayerState(result.playerId).ordersUsed
            return (
              <button
                key={result.playerId}
                onClick={() => setViewedPlayerId(result.playerId)}
                className="px-4 py-2 font-mono text-sm corner-clip-sm transition-colors text-left"
                style={{
                  background: isActive ? 'rgba(201,168,76,0.15)' : isViewed ? 'rgba(122,154,90,0.1)' : 'rgba(0,0,0,0.3)',
                  border: isActive ? '1px solid #c9a84c' : '1px solid #3a4a2a',
                  color: isActive ? '#c9a84c' : '#7a9a5a',
                  boxShadow: isActive ? '0 0 8px rgba(201,168,76,0.4)' : 'none',
                }}
              >
                <div className="flex items-center gap-2">
                  <span>{displayName}</span>
                  {session.stage === 'order' && (
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5"
                      style={{
                        background: isActive ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${isActive ? '#c9a84c66' : '#2a3a1a'}`,
                        color: isActive ? '#c9a84c' : '#5a7a4a',
                      }}
                    >
                      {playerOrdersUsed}/{playerOrdersTotal}
                    </span>
                  )}
                </div>
                {vcsWon > 0 && (
                  <div className="font-mono text-[10px] opacity-70">{vcsWon}/3 VCs</div>
                )}
              </button>
            )
          })
        })()}
      </div>

      {/* Stage-specific body */}
      {session.stage === 'command' ? (
        <CommandPhasePanel
          draft={draft}
          session={session}
          getPlayerDisplayName={getPlayerDisplayName}
          onResolveArtillery={handleResolveArtillery}
          onAddVictoryPoints={handleAddVP}
          onProceedToOrders={handleProceedToOrders}
          reminders={activePlayerState.commandReminders}
          onAddReminder={text => addCommandReminder(session.activePlayerId, text)}
          onToggleReminder={id => toggleCommandReminder(session.activePlayerId, id)}
          onRemoveReminder={id => removeCommandReminder(session.activePlayerId, id)}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
            {/* Order phase unit panel with OPONENTE / MINHAS toggle */}
            {session.stage === 'order' && (() => {
              const opponentResult = draft.results.find(r => r.playerId !== session.activePlayerId)
              if (!opponentResult) return null
              return (
                <div className="flex flex-col gap-2">
                  <div
                    className="flex flex-shrink-0"
                    style={{ border: '1px solid #2a3a1a', background: 'rgba(0,0,0,0.3)' }}
                  >
                    {(['opponent', 'mine'] as const).map(tab => {
                      const isSelected = orderPanelTab === tab
                      return (
                        <button
                          key={tab}
                          onClick={() => setOrderPanelTab(tab)}
                          className="flex-1 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors"
                          style={{
                            background: isSelected ? 'rgba(74,154,58,0.15)' : 'transparent',
                            color: isSelected ? '#7aba5a' : '#3a4a2a',
                            borderBottom: isSelected ? '2px solid #4a9a3a' : '2px solid transparent',
                          }}
                        >
                          {tab === 'opponent' ? t('control.opponent') : t('control.mine')}
                        </button>
                      )
                    })}
                  </div>
                  {orderPanelTab === 'opponent' ? (
                    <OpponentUnitsPanel
                      draft={draft}
                      opponentPlayerId={opponentResult.playerId}
                      opponentState={getPlayerState(opponentResult.playerId)}
                      label={t('control.opponentUnits')}
                    />
                  ) : (
                    <OpponentUnitsPanel
                      draft={draft}
                      opponentPlayerId={session.activePlayerId}
                      opponentState={activePlayerState}
                      label={t('control.myUnits')}
                    />
                  )}
                </div>
              )
            })()}
            {/* Cleanup info */}
            {session.stage === 'cleanup' && (() => {
              const activeResult = draft.results.find(r => r.playerId === session.activePlayerId)
              const armyUnits = activeResult?.armyUnits ?? []

              // Build per-unit cleanup data
              const unitsWithMarkers: { instanceKey: string; name: string; markerCount: number }[] = []
              const mechsToVent: { instanceKey: string; name: string; heatClicks: number }[] = []

              armyUnits.forEach((draftUnit, index) => {
                const instanceKey = getInstanceKey(index, draftUnit.id)
                const wasOrdered = activePlayerState.unitOrders[instanceKey]?.status === 'ordered'
                if (wasOrdered) return
                const unitState = activePlayerState.units[instanceKey] ?? { damageClicks: 0, heatClicks: 0 }
                const markerCount = unitState.markerCount ?? 0
                if (markerCount > 0) {
                  unitsWithMarkers.push({ instanceKey, name: draftUnit.name, markerCount })
                }
                if (draftUnit.type.toLowerCase() === 'mech') {
                  mechsToVent.push({ instanceKey, name: draftUnit.name, heatClicks: unitState.heatClicks })
                }
              })

              const STATIC_ITEMS = [
                { id: 'shallow_water', text: t('control.cleanup.shallowWater') },
                { id: 'unused_orders', text: t('control.cleanup.unusedOrders') },
              ]
              const allItems = [...STATIC_ITEMS, ...cleanupCustomItems]

              const toggleChecked = (id: string) => setCleanupChecked(prev => {
                const next = new Set(prev)
                if (prev.has(id)) next.delete(id); else next.add(id)
                return next
              })

              const handleAddCleanupItem = () => {
                const text = cleanupReminderInput.trim()
                if (!text) return
                const id = `custom-${Date.now()}`
                setCleanupCustomItems(prev => [...prev, { id, text }])
                setCleanupReminderInput('')
              }

              return (
                <div className="corner-clip-sm flex-shrink-0 space-y-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #2a3a1a' }}>
                  <div className="px-3 pt-3 font-mono text-xs uppercase tracking-widest font-bold" style={{ color: '#c9a84c' }}>
                    {t('control.cleanup.title')}
                  </div>

                  {/* Marker removal */}
                  <div className="px-3">
                    <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#5a7a4a' }}>
                      {t('control.cleanup.removeMarkers')}
                    </div>
                    {unitsWithMarkers.length === 0 ? (
                      <p className="font-mono text-xs" style={{ color: '#3a4a2a' }}>{t('control.cleanup.noUnitsToClean')}</p>
                    ) : (
                      <div className="space-y-1.5">
                        {unitsWithMarkers.map(u => (
                          <div key={u.instanceKey} className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs truncate" style={{ color: '#e8d5a0' }}>{u.name}</span>
                            <span className="font-mono text-base leading-none shrink-0" style={{ color: u.markerCount >= 2 ? '#c06060' : '#c9a84c' }}>
                              {u.markerCount >= 2 ? '●●→○○' : '●○→○○'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mech heat removal — one click per unit per cleanup */}
                  <div className="px-3" style={{ borderTop: '1px solid #1a2a12', paddingTop: 12 }}>
                    <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#5a7a4a' }}>
                      {t('control.cleanup.mechsWithoutOrder')}
                    </div>
                    {mechsToVent.length === 0 ? (
                      <p className="font-mono text-xs" style={{ color: '#3a4a2a' }}>{t('control.cleanup.noMechsToVent')}</p>
                    ) : (
                      <div className="space-y-1.5">
                        {mechsToVent.map(u => {
                          const applied = cleanupHeatApplied.has(u.instanceKey)
                          return (
                            <div key={u.instanceKey} className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs truncate" style={{ color: '#e8d5a0' }}>{u.name}</span>
                              {applied ? (
                                <span className="font-mono text-xs px-1.5 py-0.5 shrink-0" style={{ color: '#5a7a4a' }}>{t('control.cleanup.applied')}</span>
                              ) : (
                                <button
                                  disabled={u.heatClicks <= 0}
                                  onClick={() => {
                                    setDialClicks(session.activePlayerId, u.instanceKey, { heatClicks: Math.max(0, u.heatClicks - 1) })
                                    setCleanupHeatApplied(prev => new Set([...prev, u.instanceKey]))
                                  }}
                                  className="font-mono text-xs px-2 py-0.5 shrink-0 corner-clip-sm disabled:opacity-30"
                                  style={{ border: '1px solid #4a6a3a', color: '#7a9a5a', background: 'rgba(122,154,90,0.1)' }}
                                >
                                  −1 ☀ ({u.heatClicks})
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Cleanup checklist with static + custom items */}
                  <div className="px-3 pb-3 space-y-3" style={{ borderTop: '1px solid #1a2a12', paddingTop: 12 }}>
                    <div className="font-mono text-xs uppercase tracking-widest" style={{ color: '#5a7a4a' }}>
                      {t('control.cleanup.check')}
                    </div>

                    <div className="space-y-1.5">
                      {allItems.map(item => {
                        const checked = cleanupChecked.has(item.id)
                        const isCustom = !STATIC_ITEMS.find(s => s.id === item.id)
                        return (
                          <div key={item.id} className="flex items-start gap-2 p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <button
                              onClick={() => toggleChecked(item.id)}
                              className="w-5 h-5 flex-shrink-0 flex items-center justify-center font-mono text-sm corner-clip-sm"
                              style={{
                                background: checked ? 'rgba(122,154,90,0.3)' : 'rgba(0,0,0,0.3)',
                                border: checked ? '1px solid #7a9a5a' : '1px solid #3a4a2a',
                                color: '#c9a84c',
                              }}
                            >
                              {checked ? '✓' : ''}
                            </button>
                            <span
                              className="flex-1 font-mono text-xs leading-relaxed"
                              style={{ color: checked ? '#4a5e3a' : '#e8d5a0', textDecoration: checked ? 'line-through' : 'none' }}
                            >
                              {item.text}
                            </span>
                            {isCustom && (
                              <button
                                onClick={() => setCleanupCustomItems(prev => prev.filter(c => c.id !== item.id))}
                                className="px-1 font-mono text-sm flex-shrink-0"
                                style={{ color: '#6a3a3a' }}
                                title="Remover"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cleanupReminderInput}
                        onChange={e => setCleanupReminderInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddCleanupItem() }}
                        placeholder={t('control.cleanup.reminderPlaceholder')}
                        className="flex-1 px-2 py-1.5 font-mono text-sm"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#e8d5a0' }}
                      />
                      <button
                        onClick={handleAddCleanupItem}
                        disabled={!cleanupReminderInput.trim()}
                        className="px-3 py-1.5 font-mono text-sm corner-clip-sm disabled:opacity-40"
                        style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                      >
                        {t('common.add')}
                      </button>
                    </div>
                  </div>

                  <div className="px-3 pb-2 font-mono text-xs" style={{ color: '#3a4a2a', borderTop: '1px solid #1a2a12', paddingTop: 6 }}>
                    {t('control.cleanup.autoCleanup')}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap flex-shrink-0">
            <button
              onClick={handleAdvanceStage}
              className="px-4 py-2 font-mono text-sm corner-clip-sm"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
            >
              {session.stage === 'order' ? t('control.startCleanup') : t('control.nextTurn')}
            </button>
            <button
              onClick={() => goToArmy(viewedPlayerId)}
              className="px-4 py-2 font-mono text-sm corner-clip-sm"
              style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
            >
              {t('control.viewArmy')}
            </button>
          </div>
        </div>
      )}

      {/* Reset dialog */}
      {confirmingReset && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="p-6 corner-clip-sm max-w-sm w-full mx-4" style={{ background: '#111608', border: '1px solid #5a2a2a' }}>
            <p className="font-mono text-base mb-4" style={{ color: '#e8d5a0' }}>{t('control.resetDialog.title')}</p>
            {timer.config.enabled && (
              <div className="mb-4 p-3" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid #3a4a2a' }}>
                <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: '#c9a84c' }}>
                  {t('control.resetDialog.timerSummary')}
                </p>
                {draft.results.map(r => (
                  <div key={r.playerId} className="flex justify-between font-mono text-xs mb-1">
                    <span style={{ color: '#e8d5a0' }}>{getPlayerDisplayName(r.playerId)}</span>
                    <span style={{ color: '#c9a84c' }}>{formatSeconds(timer.getPlayerSeconds(r.playerId))}</span>
                  </div>
                ))}
                {timer.config.totalSeconds > 0 && (
                  <div className="flex justify-between font-mono text-xs mt-2 pt-2" style={{ borderTop: '1px solid #3a4a2a' }}>
                    <span style={{ color: '#5a7a4a' }}>{t('control.timer.remaining')}</span>
                    <span style={{ color: timer.getRemainingSeconds() < 300 ? '#c06060' : '#7a9a5a' }}>
                      {formatSeconds(timer.getRemainingSeconds())}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3 mb-4">
              <button
                onClick={handleResetToPreparation}
                className="w-full p-3 font-mono text-sm corner-clip-sm text-left"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid #c9a84c', color: '#c9a84c' }}
              >
                <div className="font-bold mb-1">{t('control.resetDialog.toPrep')}</div>
                <div className="opacity-70">{t('control.resetDialog.toPrepDesc')}</div>
              </button>
              <button
                onClick={handleResetBattleOnly}
                className="w-full p-3 font-mono text-sm corner-clip-sm text-left"
                style={{ background: 'rgba(150,50,50,0.1)', border: '1px solid #5a2a2a', color: '#c06060' }}
              >
                <div className="font-bold mb-1">{t('control.resetDialog.battleOnly')}</div>
                <div className="opacity-70">{t('control.resetDialog.battleOnlyDesc')}</div>
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setConfirmingReset(false)}
                className="px-3 py-1.5 font-mono text-sm"
                style={{ color: '#7a9a5a' }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
