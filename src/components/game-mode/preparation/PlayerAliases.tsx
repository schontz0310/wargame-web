'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import type { PreparationState } from '@/lib/gameMode'

interface PlayerAliasesProps {
  draft: Draft
  preparationState: PreparationState
  onUpdateState: (state: Partial<PreparationState>) => void
  onUpdateDraft: (draft: Draft) => void
  onNextStage: () => void
}

export default function PlayerAliases({ draft, onUpdateDraft, onNextStage }: PlayerAliasesProps) {
  const [aliases, setAliases] = useState<Record<number, string>>(() => {
    const initialAliases: Record<number, string> = {}
    draft.results.forEach(result => {
      initialAliases[result.playerId] = result.playerAlias || result.playerName
    })
    return initialAliases
  })

  const handleAliasChange = (playerId: number, alias: string) => {
    setAliases(prev => ({ ...prev, [playerId]: alias }))
  }

  const handleSave = () => {
    const updatedDraft = {
      ...draft,
      results: draft.results.map(result => ({
        ...result,
        playerAlias: aliases[result.playerId] || result.playerName
      })),
      updatedAt: new Date().toISOString()
    }
    onUpdateDraft(updatedDraft)
  }

  const handleNext = () => {
    handleSave()
    onNextStage()
  }

  return (
    <div className="min-h-screen p-8" style={{ background: '#0d1208' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-8 text-center" style={{ color: '#c9a84c' }}>
          ALIASES DOS JOGADORES
        </h1>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              Instruções
            </h2>
            <p className="font-mono text-sm mb-2" style={{ color: '#a0a090' }}>
              Defina aliases personalizados para cada jogador. Esses aliases serão usados em toda a interface
              e nos logs da partida para facilitar a identificação.
            </p>
            <p className="font-mono text-sm" style={{ color: '#a0a090' }}>
              Deixe em branco para usar o nome original do jogador.
            </p>
          </div>

          {/* Player Alias Inputs */}
          <div className="space-y-3">
            {draft.results.map((result) => (
              <div
                key={result.playerId}
                className="p-4 border"
                style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-mono text-xs mb-1" style={{ color: '#5a7a4a' }}>
                      Nome Original
                    </div>
                    <div className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
                      {result.playerName}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-xs mb-1" style={{ color: '#5a7a4a' }}>
                      Alias Personalizado
                    </div>
                    <input
                      type="text"
                      value={aliases[result.playerId] || ''}
                      onChange={(e) => handleAliasChange(result.playerId, e.target.value)}
                      placeholder={result.playerName}
                      className="w-full px-3 py-2 font-mono text-sm"
                      style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #3a4a2a', color: '#c9a84c', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="p-4 border" style={{ background: 'rgba(122,154,90,0.1)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              Preview dos Aliases
            </h2>
            <div className="flex flex-wrap gap-2">
              {draft.results.map((result) => {
                const alias = aliases[result.playerId] || result.playerName
                return (
                  <div
                    key={result.playerId}
                    className="px-3 py-2 font-mono text-xs"
                    style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid #c9a84c', color: '#c9a84c' }}
                  >
                    {alias}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next Stage Button */}
          <div className="flex justify-center pt-6">
            <button
              onClick={handleNext}
              className="px-8 py-3 font-mono text-lg"
              style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}
            >
              Próxima Fase →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
