'use client'

import { useState, useEffect } from 'react'
import type { Draft } from '@/lib/api'
import { 
  type PreparationState, 
  type PreparationStage, 
  nextPreparationStage,
  type BattlefieldSetup as BattlefieldSetupType 
} from '@/lib/gameMode'
import PlayerAliases from './PlayerAliases'
import BattlefieldSetup from './BattlefieldSetup'
import TerrainPlacement from './TerrainPlacement'
import FirstPlayerRoll from './FirstPlayerRoll'
import BattleforceDeployment from './BattleforceDeployment'
import { safeLocalStorage } from '@/lib/storage'

interface PreparationPhaseProps {
  draft: Draft
  onComplete: () => void
  onUpdateDraft?: (draft: Draft) => void
}

const STORAGE_KEY = (draftId: string) => `preparation-state-${draftId}`

export default function PreparationPhase({ draft, onComplete, onUpdateDraft }: PreparationPhaseProps) {
  const [preparationState, setPreparationState] = useState<PreparationState>(() => {
    // Load from localStorage if available
    const saved = safeLocalStorage.getItem(STORAGE_KEY(draft.id))
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Omit<PreparationState, 'terrainPile' | 'diceRolls' | 'deployedUnits'> & {
          terrainPile?: Record<string, number>
          diceRolls?: Record<string, number>
          deployedUnits?: Record<string, string[]>
        }
        // Reconstruct Maps from plain objects
        return {
          ...parsed,
          terrainPile: new Map(Object.entries(parsed.terrainPile ?? {}).map(([k, v]) => [parseInt(k), v])),
          diceRolls: new Map(Object.entries(parsed.diceRolls ?? {}).map(([k, v]) => [parseInt(k), v])),
          deployedUnits: new Map(Object.entries(parsed.deployedUnits ?? {}).map(([k, v]) => [parseInt(k), v]))
        }
      } catch {
        // If invalid, return default
      }
    }

    // Default initial state
    return {
      stage: 'player_aliases',
      battlefieldSetup: {
        battlefieldSize: 36,
        deploymentZoneDepth: 3,
        deploymentZoneMinEdgeDistance: 8,
        terrainMinDistance: 3
      } as BattlefieldSetupType,
      terrainFeatures: [],
      terrainPile: new Map(),
      firstPlayerId: null,
      diceRolls: new Map(),
      deployedUnits: new Map(),
      currentDeployingPlayer: null
    }
  })

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return
    safeLocalStorage.setItem(STORAGE_KEY(draft.id), JSON.stringify(preparationState))
  }, [preparationState, draft.id, isClient])

  const handleUpdateState = (updates: Partial<PreparationState>) => {
    setPreparationState(prev => ({ ...prev, ...updates }))
  }

  const handleNextStage = () => {
    const nextStage = nextPreparationStage(preparationState.stage)
    handleUpdateState({ stage: nextStage })
  }

  const handleComplete = () => {
    // Clear preparation state from localStorage
    safeLocalStorage.removeItem(STORAGE_KEY(draft.id))
    onComplete()
  }

  const STAGE_LABELS: Record<PreparationStage, string> = {
    player_aliases: 'Aliases dos Jogadores',
    battlefield_setup: 'Setup do Campo de Batalha',
    first_player_roll: 'Determinar Primeiro Jogador',
    terrain_placement: 'Colocação de Terreno',
    battleforce_deployment: 'Deploy da Battleforce'
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0d1208' }}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">[ CARREGANDO... ]</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0d1208' }}>
      {/* Stage Progress Bar */}
      <div className="border-b p-4" style={{ background: 'rgba(0,0,0,0.4)', borderColor: '#3a4a2a' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>
              FASE PREPARATÓRIA
            </span>
            <span className="font-mono text-xs" style={{ color: '#c9a84c' }}>
              {STAGE_LABELS[preparationState.stage]}
            </span>
          </div>
          <div className="flex gap-1">
            {(['player_aliases', 'battlefield_setup', 'first_player_roll', 'terrain_placement', 'battleforce_deployment'] as PreparationStage[]).map((stage, index) => {
              const isCompleted = ['player_aliases', 'battlefield_setup', 'first_player_roll', 'terrain_placement', 'battleforce_deployment'].indexOf(preparationState.stage) > index
              const isCurrent = preparationState.stage === stage
              
              return (
                <div
                  key={stage}
                  className="flex-1 h-1 transition-all"
                  style={{
                    background: isCompleted 
                      ? '#7a9a5a' 
                      : isCurrent 
                        ? '#c9a84c' 
                        : 'rgba(58,74,42,0.3)'
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Render current stage component */}
      {preparationState.stage === 'player_aliases' && (
        <PlayerAliases
          draft={draft}
          preparationState={preparationState}
          onUpdateState={handleUpdateState}
          onUpdateDraft={onUpdateDraft || (() => {})}
          onNextStage={handleNextStage}
        />
      )}

      {preparationState.stage === 'battlefield_setup' && (
        <BattlefieldSetup
          draft={draft}
          preparationState={preparationState}
          onUpdateState={handleUpdateState}
          onNextStage={handleNextStage}
        />
      )}

      {preparationState.stage === 'first_player_roll' && (
        <FirstPlayerRoll
          draft={draft}
          preparationState={preparationState}
          onUpdateState={handleUpdateState}
          onNextStage={handleNextStage}
        />
      )}

      {preparationState.stage === 'terrain_placement' && (
        <TerrainPlacement
          draft={draft}
          preparationState={preparationState}
          onUpdateState={handleUpdateState}
          onNextStage={handleNextStage}
        />
      )}

      {preparationState.stage === 'battleforce_deployment' && (
        <BattleforceDeployment
          draft={draft}
          preparationState={preparationState}
          onUpdateState={handleUpdateState}
          onNextStage={handleComplete}
        />
      )}
    </div>
  )
}
