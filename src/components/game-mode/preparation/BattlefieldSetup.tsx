'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import { type BattlefieldSetup, type PreparationState } from '@/lib/gameMode'
import { useT } from '@/hooks/useT'
import { type TimerConfig, loadTimerConfig, saveTimerConfig } from '@/hooks/useGameTimer'

interface BattlefieldSetupProps {
  draft: Draft
  preparationState: PreparationState
  onUpdateState: (state: Partial<PreparationState>) => void
  onNextStage: () => void
}

export default function BattlefieldSetup({ draft, preparationState, onUpdateState, onNextStage }: BattlefieldSetupProps) {
  const t = useT()
  const [confirmed, setConfirmed] = useState(false)
  const [timerConfig, setTimerConfig] = useState<TimerConfig>(() => loadTimerConfig(draft.id))

  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `${t('control.player')} ${playerId}`
  }

  const handleConfirm = () => {
    const defaultSetup: BattlefieldSetup = {
      battlefieldSize: 36, // 3 feet = 36 inches
      deploymentZoneDepth: 3, // 3 inches
      deploymentZoneMinEdgeDistance: 8, // 8 inches
      terrainMinDistance: 3 // 3 inches
    }

    // Ensure terrainPile is properly initialized with the current values
    const currentTerrainPile = new Map(preparationState.terrainPile)

    onUpdateState({
      battlefieldSetup: defaultSetup,
      terrainPile: currentTerrainPile
    })
    setConfirmed(true)
  }

  return (
    <div className="min-h-screen p-8" style={{ background: '#0d1208' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-8 text-center" style={{ color: '#c9a84c' }}>
          {t('battlefieldSetup.title')}
        </h1>

        <div className="space-y-6">
          {/* Battlefield Size */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              {t('battlefieldSetup.section1Title')}
            </h2>
            <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
              {t('battlefieldSetup.section1Desc')}
            </p>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm" style={{ color: '#5a7a4a' }}>
                {t('battlefieldSetup.defaultSize')}
              </span>
              <span className="font-mono text-lg font-bold" style={{ color: '#c9a84c' }}>
                36&quot; x 36&quot;
              </span>
            </div>
          </div>

          {/* Starting Edges */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              {t('battlefieldSetup.section2Title')}
            </h2>
            <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
              {t('battlefieldSetup.section2Desc')}
            </p>
            <div className="space-y-2">
              {draft.results.map((result) => (
                <div key={result.playerId} className="flex items-center justify-between p-2" style={{ background: 'rgba(122,154,90,0.1)' }}>
                  <span className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
                    {getPlayerDisplayName(result.playerId)}
                  </span>
                  <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>
                    {t('battlefieldSetup.selectEdge')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment Zones */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              {t('battlefieldSetup.section3Title')}
            </h2>
            <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
              {t('battlefieldSetup.section3Desc')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 text-center" style={{ background: 'rgba(122,154,90,0.1)' }}>
                <div className="font-mono text-xs mb-1" style={{ color: '#5a7a4a' }}>
                  {t('battlefieldSetup.zoneDepth')}
                </div>
                <div className="font-mono text-xl font-bold" style={{ color: '#c9a84c' }}>
                  3&quot;
                </div>
              </div>
              <div className="p-3 text-center" style={{ background: 'rgba(122,154,90,0.1)' }}>
                <div className="font-mono text-xs mb-1" style={{ color: '#5a7a4a' }}>
                  {t('battlefieldSetup.minEdgeDistance')}
                </div>
                <div className="font-mono text-xl font-bold" style={{ color: '#c9a84c' }}>
                  8&quot;
                </div>
              </div>
            </div>
          </div>

          {/* Game Timer */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              {t('battlefieldSetup.timerTitle')}
            </h2>
            <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
              {t('battlefieldSetup.timerDesc')}
            </p>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <div
                onClick={() => {
                  const updated = { ...timerConfig, enabled: !timerConfig.enabled }
                  setTimerConfig(updated)
                  saveTimerConfig(draft.id, updated)
                }}
                className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
                style={{ background: timerConfig.enabled ? '#7a9a5a' : '#2a3a1a', border: '1px solid #3a4a2a' }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    background: timerConfig.enabled ? '#c9a84c' : '#5a7a4a',
                    left: timerConfig.enabled ? '1.25rem' : '0.125rem',
                  }}
                />
              </div>
              <span className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
                {t('battlefieldSetup.timerEnable')}
              </span>
            </label>
            {timerConfig.enabled && (
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm" style={{ color: '#5a7a4a' }}>
                  {t('battlefieldSetup.timerMinutes')}
                </span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={timerConfig.totalSeconds > 0 ? Math.round(timerConfig.totalSeconds / 60) : ''}
                  onChange={e => {
                    const mins = parseInt(e.target.value) || 0
                    const updated = { ...timerConfig, totalSeconds: mins * 60 }
                    setTimerConfig(updated)
                    saveTimerConfig(draft.id, updated)
                  }}
                  className="w-20 px-2 py-1 font-mono text-sm text-center"
                  style={{ background: 'rgba(122,154,90,0.1)', border: '1px solid #3a4a2a', color: '#c9a84c' }}
                />
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <div className="flex justify-center pt-6">
            {!confirmed ? (
              <button
                onClick={handleConfirm}
                className="px-8 py-3 font-mono text-lg"
                style={{ background: 'rgba(122,154,90,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
              >
                {t('battlefieldSetup.confirm')}
              </button>
            ) : (
              <button
                onClick={onNextStage}
                className="px-8 py-3 font-mono text-lg"
                style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}
              >
                {t('battlefieldSetup.nextPhase')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
