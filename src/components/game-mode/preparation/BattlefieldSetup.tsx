'use client'

import { useState } from 'react'
import type { Draft } from '@/lib/api'
import { type BattlefieldSetup, type PreparationState } from '@/lib/gameMode'

interface BattlefieldSetupProps {
  draft: Draft
  preparationState: PreparationState
  onUpdateState: (state: Partial<PreparationState>) => void
  onNextStage: () => void
}

export default function BattlefieldSetup({ draft, preparationState, onUpdateState, onNextStage }: BattlefieldSetupProps) {
  const [confirmed, setConfirmed] = useState(false)

  // Helper to get display name (alias or original name)
  const getPlayerDisplayName = (playerId: number) => {
    const player = draft.results.find(r => r.playerId === playerId)
    return player?.playerAlias || player?.playerName || `Jogador ${playerId}`
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
          PREPARANDO O CAMPO DE BATALHA
        </h1>

        <div className="space-y-6">
          {/* Battlefield Size */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              1. Tamanho do Campo de Batalha
            </h2>
            <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
              Encontre uma área plana e quadrada de aproximadamente 3&apos; (36 polegadas) de cada lado.
            </p>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm" style={{ color: '#5a7a4a' }}>
                Tamanho padrão:
              </span>
              <span className="font-mono text-lg font-bold" style={{ color: '#c9a84c' }}>
                36&quot; x 36&quot;
              </span>
            </div>
          </div>

          {/* Starting Edges */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              2. Bordas de Início
            </h2>
            <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
              Cada jogador seleciona uma borda do campo de batalha como sua borda de início.
              Se houver apenas dois jogadores, essas bordas devem estar diretamente opostas.
            </p>
            <div className="space-y-2">
              {draft.results.map((result) => (
                <div key={result.playerId} className="flex items-center justify-between p-2" style={{ background: 'rgba(122,154,90,0.1)' }}>
                  <span className="font-mono text-sm" style={{ color: '#e8d5a0' }}>
                    {getPlayerDisplayName(result.playerId)}
                  </span>
                  <span className="font-mono text-xs" style={{ color: '#5a7a4a' }}>
                    Selecione sua borda
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment Zones */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              3. Zonas de Deploy
            </h2>
            <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
              Ao longo da borda de início de cada jogador está uma zona retangular imaginária chamada zona de deploy.
              Sua zona de deploy começa na sua borda de início e se estende 3&quot; para dentro do campo de batalha.
              Sua zona de deploy deve estar a pelo menos 8&quot; de qualquer outra borda do campo de batalha.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 text-center" style={{ background: 'rgba(122,154,90,0.1)' }}>
                <div className="font-mono text-xs mb-1" style={{ color: '#5a7a4a' }}>
                  Profundidade da Zona
                </div>
                <div className="font-mono text-xl font-bold" style={{ color: '#c9a84c' }}>
                  3&quot;
                </div>
              </div>
              <div className="p-3 text-center" style={{ background: 'rgba(122,154,90,0.1)' }}>
                <div className="font-mono text-xs mb-1" style={{ color: '#5a7a4a' }}>
                  Distância Mínima das Bordas
                </div>
                <div className="font-mono text-xl font-bold" style={{ color: '#c9a84c' }}>
                  8&quot;
                </div>
              </div>
            </div>
          </div>

          {/* Terrain Pile */}
          <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: '#3a4a2a' }}>
            <h2 className="font-mono text-lg mb-3" style={{ color: '#7a9a5a' }}>
              4. Pilha de Terreno
            </h2>
            <p className="font-mono text-sm mb-4" style={{ color: '#a0a090' }}>
              Cada jogador coloca até três características de terreno em uma pilha de terreno ao lado do campo de batalha.
              Se não estiver usando terreno, pule esta etapa.
            </p>
            <div className="flex gap-4">
              {draft.results.map((result) => (
                <div key={result.playerId} className="flex-1 p-3 text-center" style={{ background: 'rgba(122,154,90,0.1)' }}>
                  <div className="font-mono text-xs mb-2" style={{ color: '#e8d5a0' }}>
                    {getPlayerDisplayName(result.playerId)}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={preparationState.terrainPile.get(result.playerId) || 0}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0
                      const newPile = new Map(preparationState.terrainPile)
                      newPile.set(result.playerId, Math.min(3, Math.max(0, count)))
                      onUpdateState({ terrainPile: newPile })
                    }}
                    className="w-16 p-2 text-center font-mono"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4a2a', color: '#c9a84c' }}
                  />
                  <div className="font-mono text-xs mt-1" style={{ color: '#5a7a4a' }}>
                    / 3 terrenos
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <div className="flex justify-center pt-6">
            {!confirmed ? (
              <button
                onClick={handleConfirm}
                className="px-8 py-3 font-mono text-lg"
                style={{ background: 'rgba(122,154,90,0.3)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
              >
                Confirmar Setup
              </button>
            ) : (
              <button
                onClick={onNextStage}
                className="px-8 py-3 font-mono text-lg"
                style={{ background: 'rgba(201,168,76,0.3)', border: '1px solid #c9a84c', color: '#c9a84c' }}
              >
                Próxima Fase →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
