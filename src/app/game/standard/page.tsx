/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Unit, DraftUnit, Draft, DraftSettings, apiService } from '@/lib/api'
import { safeLocalStorage } from '@/lib/storage'
import { useT } from '@/hooks/useT'

interface StandardPlayer {
  id: number
  units: DraftUnit[]
  totalPoints: number
}

interface StandardSession {
  id: string
  name: string
  settings: {
    numberOfPlayers: number
    pointLimit: number
    useCollection: boolean
  }
  players: StandardPlayer[]
  phase: 'building' | 'done'
  createdAt: string
  updatedAt: string
}

const LS_KEY = 'myStandardSessions'

export default function StandardPage() {
  const router = useRouter()
  const t = useT()
  const [isClient, setIsClient] = useState(false)
  const [sessions, setSessions] = useState<StandardSession[]>([])
  const [selected, setSelected] = useState<StandardSession | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formPlayers, setFormPlayers] = useState(2)
  const [formPointLimit, setFormPointLimit] = useState(300)
  const [formUseCollection, setFormUseCollection] = useState(false)

  // Building phase state
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [activePlayer, setActivePlayer] = useState(0)
  const [unitFilter, setUnitFilter] = useState('')

  useEffect(() => { setIsClient(true) }, [])

  useEffect(() => {
    if (!isClient) return
    const saved = safeLocalStorage.getItem(LS_KEY)
    if (saved) {
      const parsed: StandardSession[] = JSON.parse(saved)
      setSessions(parsed)
      if (parsed.length > 0) setSelected(parsed[0])
    }
  }, [isClient])

  const persist = (updated: StandardSession[]) => {
    setSessions(updated)
    if (isClient) safeLocalStorage.setItem(LS_KEY, JSON.stringify(updated))
  }

  const updateSession = (session: StandardSession) => {
    const updated = sessions.map(s => s.id === session.id ? session : s)
    persist(updated)
    setSelected(session)
  }

  // Load units when entering building phase
  useEffect(() => {
    if (!selected || selected.phase !== 'building' || availableUnits.length > 0) return
    const load = async () => {
      setLoadingUnits(true)
      try {
        if (selected.settings.useCollection && isClient) {
          const saved = safeLocalStorage.getItem('myHaveCollection')
          if (saved) {
            const col = JSON.parse(saved)
            const units: Unit[] = []
            col.forEach((entry: any) => {
              for (let i = 0; i < (entry.quantity || 1); i++) units.push(entry as Unit)
            })
            setAvailableUnits(units)
          }
        } else {
          const all = await apiService.getAllUnits()
          setAvailableUnits(all)
        }
      } finally {
        setLoadingUnits(false)
      }
    }
    load()
  }, [selected, isClient, availableUnits.length])

  const launchGameMode = (session: StandardSession) => {
    const settings: DraftSettings = {
      numberOfPlayers: session.settings.numberOfPlayers,
      boostersPerPlayer: 0,
      boosterConfigs: [],
      useCollection: session.settings.useCollection,
      respectFilters: false,
    }
    const gameDraftId = `std-${session.id}`
    const gameDraft: Draft = {
      id: gameDraftId,
      name: session.name,
      settings,
      availableUnits: [],
      results: session.players.map(p => ({
        playerId: p.id,
        playerName: `${t('standard.player')} ${p.id}`,
        units: [],
        armyUnits: p.units,
        secretCards: [],
        totalPoints: 0,
        armyPoints: p.totalPoints,
        armyPointsLimit: session.settings.pointLimit,
      })),
      createdAt: session.createdAt,
      updatedAt: new Date().toISOString(),
    }
    const existing: Draft[] = JSON.parse(safeLocalStorage.getItem('myDrafts') || '[]')
    const merged = [gameDraft, ...existing.filter(d => d.id !== gameDraftId)]
    safeLocalStorage.setItem('myDrafts', JSON.stringify(merged))
    router.push(`/game-mode?draftId=${gameDraftId}`)
  }

  const createSession = () => {
    if (!formName.trim()) return
    const players: StandardPlayer[] = Array.from({ length: formPlayers }, (_, i) => ({
      id: i + 1,
      units: [],
      totalPoints: 0,
    }))
    const session: StandardSession = {
      id: Date.now().toString(),
      name: formName.trim(),
      settings: { numberOfPlayers: formPlayers, pointLimit: formPointLimit, useCollection: formUseCollection },
      players,
      phase: 'building',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const updated = [session, ...sessions]
    persist(updated)
    setSelected(session)
    setIsCreating(false)
    setFormName('')
    setAvailableUnits([])
    setActivePlayer(0)
  }

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id)
    persist(updated)
    setSelected(updated.length > 0 ? updated[0] : null)
    setShowDeleteModal(false)
    setSessionToDelete(null)
  }

  const isUnitTaken = (unit: Unit) => {
    if (!unit.isUnique || !selected) return false
    return selected.players.some(p => p.units.some(u => u.id === unit.id))
  }

  const addUnit = (unit: Unit) => {
    if (!selected) return
    const player = selected.players[activePlayer]
    const limit = selected.settings.pointLimit
    if (player.totalPoints + unit.points > limit) return
    if (isUnitTaken(unit)) return

    const draftUnit: DraftUnit = {
      id: unit.id,
      name: unit.name,
      type: unit.type,
      points: unit.points,
      faction: unit.faction,
      expansion: unit.expansion,
      collectionNumber: String(unit.collectionNumber),
      quantity: 1,
    }
    const updatedPlayers = selected.players.map((p, i) =>
      i === activePlayer
        ? { ...p, units: [...p.units, draftUnit], totalPoints: p.totalPoints + unit.points }
        : p
    )
    updateSession({ ...selected, players: updatedPlayers, updatedAt: new Date().toISOString() })
  }

  const removeUnit = (playerIdx: number, unitId: string) => {
    if (!selected) return
    const target = selected.players[playerIdx]
    const unit = target.units.find(u => u.id === unitId)
    if (!unit) return
    const updatedPlayers = selected.players.map((p, i) =>
      i === playerIdx
        ? { ...p, units: p.units.filter(u => u.id !== unitId), totalPoints: p.totalPoints - unit.points }
        : p
    )
    updateSession({ ...selected, players: updatedPlayers, updatedAt: new Date().toISOString() })
  }

  const finishBuilding = () => {
    if (!selected) return
    updateSession({ ...selected, phase: 'done', updatedAt: new Date().toISOString() })
  }

  const resumeBuilding = () => {
    if (!selected) return
    updateSession({ ...selected, phase: 'building', updatedAt: new Date().toISOString() })
  }

  const filteredUnits = useMemo(() => {
    const q = unitFilter.toLowerCase()
    return availableUnits.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.faction.toLowerCase().includes(q) ||
      u.type.toLowerCase().includes(q)
    )
  }, [availableUnits, unitFilter])

  const cardBg = { background: 'linear-gradient(135deg, #0d1208 0%, #141a0e 100%)', border: '1px solid #3a4a2a' }
  const highlightBg = { background: 'linear-gradient(135deg, #0f1a0a 0%, #1a2a0f 100%)', border: '1px solid #c9a84c55' }

  return (
    <div className="flex flex-col h-screen overflow-hidden scanline-bg" style={{ background: 'linear-gradient(160deg, #080c05 0%, #0d1208 40%, #0a0f06 100%)' }}>
      {/* Top bar */}
      <div className="shrink-0 border-b border-[#3a4a2a] px-6 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/game')} className="font-mono text-xs text-[#4a5e3a] hover:text-[#7a9a5a] transition-colors tracking-widest uppercase">
            ← {t('game.back')}
          </button>
          <span className="font-mono text-xs text-[#c9a84c] tracking-widest uppercase">{t('standard.title')}</span>
        </div>
        <button
          onClick={() => { setIsCreating(true); setFormName(''); setFormPlayers(2); setFormPointLimit(300); setFormUseCollection(false) }}
          className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors"
          style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
        >
          {t('standard.newSession')}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Session list */}
        <div className="w-56 shrink-0 border-r border-[#3a4a2a] overflow-y-auto" style={{ background: '#0a0f06' }}>
          {sessions.length === 0 && (
            <p className="font-mono text-[10px] text-[#3a4a2a] p-4 tracking-widest">{t('standard.noSessions')}</p>
          )}
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => { setSelected(s); setIsCreating(false); setAvailableUnits([]); setActivePlayer(0) }}
              className="w-full text-left px-3 py-3 border-b border-[#2a3a1a] transition-colors hover:bg-[#0d1208]"
              style={selected?.id === s.id ? { background: '#0f1a0a', borderLeft: '2px solid #c9a84c' } : { borderLeft: '2px solid transparent' }}
            >
              <div className="font-mono text-xs text-[#e8d5a0] truncate mb-1">{s.name}</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-[#4a5e3a]">{s.settings.numberOfPlayers} {t('standard.playerCount')}</span>
                <span className="font-mono text-[9px] text-[#4a5e3a]">·</span>
                <span className="font-mono text-[9px] text-[#4a5e3a]">{s.settings.pointLimit} {t('standard.pts')}</span>
              </div>
              <span className="font-mono text-[9px] tracking-widest" style={{ color: s.phase === 'done' ? '#7a9a5a' : '#c9a84c' }}>
                {s.phase === 'done' ? t('standard.phaseDoneBadge') : t('standard.phaseBuildingBadge')}
              </span>
            </button>
          ))}
        </div>

        {/* Main panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Create session form */}
          {isCreating && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-md corner-clip p-6" style={highlightBg}>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#c9a84c33] via-[#c9a84c] to-[#c9a84c33]" />
                <h2 className="font-mono text-sm text-[#c9a84c] tracking-widest uppercase mb-5">{t('standard.newSession')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-[10px] text-[#7a9a5a] tracking-widest uppercase block mb-1">{t('standard.sessionName')}</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createSession()}
                      className="w-full px-3 py-2 font-mono text-xs text-[#e8d5a0] bg-transparent outline-none"
                      style={{ border: '1px solid #3a4a2a' }}
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-[10px] text-[#7a9a5a] tracking-widest uppercase block mb-1">{t('standard.numPlayers')}</label>
                      <input
                        type="number" min={2} max={8}
                        value={formPlayers}
                        onChange={e => setFormPlayers(Math.min(8, Math.max(2, Number(e.target.value))))}
                        className="w-full px-3 py-2 font-mono text-xs text-[#e8d5a0] bg-transparent outline-none"
                        style={{ border: '1px solid #3a4a2a' }}
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-[#7a9a5a] tracking-widest uppercase block mb-1">{t('standard.pointLimit')}</label>
                      <input
                        type="number" min={50} step={50}
                        value={formPointLimit}
                        onChange={e => setFormPointLimit(Math.max(50, Number(e.target.value)))}
                        className="w-full px-3 py-2 font-mono text-xs text-[#e8d5a0] bg-transparent outline-none"
                        style={{ border: '1px solid #3a4a2a' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-[#7a9a5a] tracking-widest uppercase block mb-2">{t('standard.source')}</label>
                    <div className="flex gap-2">
                      {[false, true].map(val => (
                        <button
                          key={String(val)}
                          onClick={() => setFormUseCollection(val)}
                          className="flex-1 px-3 py-2 font-mono text-[10px] tracking-widest transition-colors"
                          style={formUseCollection === val ? { background: 'rgba(201,168,76,0.2)', border: '1px solid #c9a84c', color: '#c9a84c' } : { background: 'transparent', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                        >
                          {val ? t('standard.sourceCollection') : t('standard.sourceAll')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createSession}
                    disabled={!formName.trim()}
                    className="flex-1 px-4 py-2 font-mono text-xs tracking-widest uppercase disabled:opacity-40"
                    style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid #c9a84c', color: '#c9a84c' }}
                  >
                    {t('standard.start')}
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 font-mono text-xs tracking-widest uppercase"
                    style={{ background: 'transparent', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                  >
                    {t('standard.cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No session selected */}
          {!isCreating && !selected && (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-mono text-xs text-[#3a4a2a] tracking-widest">{t('standard.noSessions')}</p>
            </div>
          )}

          {/* Session detail */}
          {!isCreating && selected && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Session header */}
              <div className="shrink-0 px-5 py-3 flex items-center justify-between border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-[#e8d5a0]">{selected.name}</span>
                  <span className="font-mono text-[10px] text-[#4a5e3a]">{selected.settings.pointLimit} {t('standard.pts')} {t('standard.limit')}</span>
                  <span className="font-mono text-[9px] tracking-widest px-2 py-0.5" style={{ border: selected.phase === 'done' ? '1px solid #7a9a5a' : '1px solid #c9a84c', color: selected.phase === 'done' ? '#7a9a5a' : '#c9a84c' }}>
                    {selected.phase === 'done' ? t('standard.phaseDoneBadge') : t('standard.phaseBuildingBadge')}
                  </span>
                </div>
                <div className="flex gap-2">
                  {selected.phase === 'building' && (
                    <button onClick={finishBuilding} className="px-3 py-1.5 font-mono text-xs tracking-widest uppercase" style={{ background: 'rgba(122,154,90,0.2)', border: '1px solid #7a9a5a', color: '#7a9a5a' }}>
                      {t('standard.finish')}
                    </button>
                  )}
                  {selected.phase === 'done' && (
                    <>
                      <button
                        onClick={() => launchGameMode(selected)}
                        className="px-3 py-1.5 font-mono text-xs tracking-widest uppercase"
                        style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c', color: '#c9a84c' }}
                      >
                        {t('drafts.btnGameMode')}
                      </button>
                      <button onClick={resumeBuilding} className="px-3 py-1.5 font-mono text-xs tracking-widest uppercase" style={{ background: 'rgba(122,154,90,0.1)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}>
                        {t('standard.phaseBuildingBadge')}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSessionToDelete(selected.id); setShowDeleteModal(true) }}
                    className="px-3 py-1.5 font-mono text-xs tracking-widest uppercase"
                    style={{ background: 'rgba(180,60,60,0.1)', border: '1px solid #5a2a2a', color: '#8a4a4a' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Building phase */}
              {selected.phase === 'building' && (
                <div className="flex-1 overflow-hidden flex">
                  {/* Unit browser */}
                  <div className="w-72 shrink-0 border-r border-[#2a3a1a] flex flex-col overflow-hidden">
                    <div className="shrink-0 p-3 border-b border-[#2a3a1a]">
                      <div className="font-mono text-[10px] text-[#c9a84c] tracking-widest uppercase mb-2">{t('standard.unitList')}</div>
                      <input
                        type="text"
                        placeholder={t('standard.filter')}
                        value={unitFilter}
                        onChange={e => setUnitFilter(e.target.value)}
                        className="w-full px-2 py-1.5 font-mono text-[10px] text-[#e8d5a0] bg-transparent outline-none"
                        style={{ border: '1px solid #3a4a2a' }}
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {loadingUnits && (
                        <div className="flex items-center justify-center py-8">
                          <span className="font-mono text-[10px] text-[#3a4a2a] animate-pulse tracking-widest">{t('common.loading')}</span>
                        </div>
                      )}
                      {!loadingUnits && filteredUnits.length === 0 && (
                        <p className="font-mono text-[10px] text-[#3a4a2a] p-4 tracking-widest">{t('standard.noUnits')}</p>
                      )}
                      {!loadingUnits && filteredUnits.map((unit, idx) => {
                        const player = selected.players[activePlayer]
                        const atLimit = player.totalPoints + unit.points > selected.settings.pointLimit
                        const taken = isUnitTaken(unit)
                        const disabled = atLimit || taken
                        return (
                          <div
                            key={`${unit.id}-${idx}`}
                            className="flex items-center justify-between px-3 py-2 border-b border-[#1a2a12] hover:bg-[#0d1208] transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-mono text-[10px] text-[#e8d5a0] truncate">{unit.name}</div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] text-[#4a5e3a]">{unit.type}</span>
                                <span className="font-mono text-[9px] text-[#4a5e3a]">·</span>
                                <span className="font-mono text-[9px] text-[#c9a84c]">{unit.points} {t('standard.pts')}</span>
                                {unit.isUnique && <span className="font-mono text-[8px] text-[#8a6a2a]">★</span>}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {unit.faction && <span className="font-mono text-[8px] text-[#3a5a2a] truncate max-w-[80px]">{unit.faction}</span>}
                                {unit.expansion && (
                                  <>
                                    <span className="font-mono text-[8px] text-[#2a3a1a]">·</span>
                                    <span className="font-mono text-[8px] text-[#3a5a2a]">{unit.expansion}</span>
                                  </>
                                )}
                                {unit.collectionNumber && (
                                  <>
                                    <span className="font-mono text-[8px] text-[#2a3a1a]">·</span>
                                    <span className="font-mono text-[8px] text-[#3a5a2a]">#{unit.collectionNumber}</span>
                                  </>
                                )}
                              </div>
                              {taken && <div className="font-mono text-[8px] text-[#8a4a2a]">{t('standard.uniqueTaken')}</div>}
                              {atLimit && !taken && <div className="font-mono text-[8px] text-[#5a3a1a]">{t('standard.limitReached')}</div>}
                            </div>
                            <button
                              onClick={() => addUnit(unit)}
                              disabled={disabled}
                              className="ml-2 px-2 py-1 font-mono text-[9px] tracking-widest shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ border: '1px solid #3a4a2a', color: '#7a9a5a' }}
                            >
                              +
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Player armies */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Player tabs */}
                    <div className="shrink-0 flex border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      {selected.players.map((p, i) => (
                        <button
                          key={p.id}
                          onClick={() => setActivePlayer(i)}
                          className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase border-r border-[#2a3a1a] transition-colors"
                          style={activePlayer === i
                            ? { color: '#c9a84c', borderBottom: '2px solid #c9a84c', background: 'rgba(201,168,76,0.08)' }
                            : { color: '#4a5e3a', borderBottom: '2px solid transparent' }
                          }
                        >
                          {t('standard.player')} {p.id}
                          <span className="ml-2 text-[9px]" style={{ color: p.totalPoints >= selected.settings.pointLimit ? '#7a9a5a' : '#4a5e3a' }}>
                            {p.totalPoints}/{selected.settings.pointLimit}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Active player army */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {(() => {
                        const player = selected.players[activePlayer]
                        if (!player) return null
                        const pct = Math.min(100, Math.round((player.totalPoints / selected.settings.pointLimit) * 100))
                        return (
                          <>
                            {/* Point bar */}
                            <div className="mb-4">
                              <div className="flex justify-between font-mono text-[10px] mb-1" style={{ color: '#7a9a5a' }}>
                                <span>{t('standard.army')} — {t('standard.player')} {player.id}</span>
                                <span>{player.totalPoints} / {selected.settings.pointLimit} {t('standard.pts')}</span>
                              </div>
                              <div className="h-1 rounded-full" style={{ background: '#1a2a12' }}>
                                <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? '#7a9a5a' : '#c9a84c' }} />
                              </div>
                            </div>

                            {player.units.length === 0 && (
                              <p className="font-mono text-[10px] text-[#2a3a1a] tracking-widest">{t('standard.noUnits')}</p>
                            )}

                            <div className="space-y-1">
                              {player.units.map((u, ui) => (
                                <div key={`${u.id}-${ui}`} className="flex items-center justify-between px-3 py-2" style={cardBg}>
                                  <div>
                                    <div className="font-mono text-[10px] text-[#e8d5a0]">{u.name}</div>
                                    <div className="font-mono text-[9px] text-[#4a5e3a]">{u.type} · {u.points} {t('standard.pts')}</div>
                                  </div>
                                  <button
                                    onClick={() => removeUnit(activePlayer, u.id)}
                                    className="font-mono text-[10px] text-[#5a3a3a] hover:text-[#8a4a4a] transition-colors ml-3"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Done phase — army summary */}
              {selected.phase === 'done' && (
                <div className="flex-1 overflow-auto p-5">
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(selected.players.length, 3)}, 1fr)` }}>
                    {selected.players.map(player => (
                      <div key={player.id} className="corner-clip" style={cardBg}>
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#c9a84c33] via-[#c9a84c] to-[#c9a84c33]" />
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-xs text-[#c9a84c] tracking-widest uppercase">{t('standard.player')} {player.id}</span>
                            <span className="font-mono text-[10px] text-[#7a9a5a]">{player.totalPoints} {t('standard.pts')}</span>
                          </div>
                          {/* Point bar */}
                          <div className="h-1 rounded-full mb-3" style={{ background: '#1a2a12' }}>
                            <div className="h-1 rounded-full" style={{ width: `${Math.min(100, Math.round((player.totalPoints / selected.settings.pointLimit) * 100))}%`, background: '#7a9a5a' }} />
                          </div>
                          <div className="space-y-1">
                            {player.units.map((u, i) => (
                              <div key={`${u.id}-${i}`} className="flex items-center justify-between py-1 border-b border-[#1a2a12]">
                                <span className="font-mono text-[10px] text-[#b8c5a0] truncate">{u.name}</span>
                                <span className="font-mono text-[9px] text-[#4a5e3a] ml-2 shrink-0">{u.points}</span>
                              </div>
                            ))}
                            {player.units.length === 0 && (
                              <p className="font-mono text-[9px] text-[#2a3a1a]">{t('standard.noUnits')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="corner-clip p-6 w-80" style={highlightBg}>
            <p className="font-mono text-sm text-[#e8d5a0] mb-5">{t('standard.confirmDelete')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => sessionToDelete && deleteSession(sessionToDelete)}
                className="flex-1 px-4 py-2 font-mono text-xs tracking-widest uppercase"
                style={{ background: 'rgba(180,60,60,0.2)', border: '1px solid #8a3a3a', color: '#c07070' }}
              >
                {t('standard.delete')}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setSessionToDelete(null) }}
                className="flex-1 px-4 py-2 font-mono text-xs tracking-widest uppercase"
                style={{ border: '1px solid #3a4a2a', color: '#7a9a5a' }}
              >
                {t('standard.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
