'use client'

import { AppDial, HeatModifiersTable } from '@/components/app-dial';
import { useSelectedUnit } from '@/hooks/useSelectedUnit';
import { useColorMeanings } from '@/hooks/useColorMeanings';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Unit3DModal from '@/components/Unit3DModal';

function ListContent() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unitId');
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  
  const {
    selectedUnit,
    loading,
    error,
    heatClicks,
    damageClicks,
    handleHeat,
    handleCooldown,
    handleDamage,
    handleRepair,
  } = useSelectedUnit(unitId);
  const { colorMapping } = useColorMeanings();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando detalhes da unidade...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Erro: {error}</div>
      </div>
    );
  }

  if (!selectedUnit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-gray-600">Nenhuma unidade selecionada</div>
        <div className="text-sm text-gray-500">Selecione uma unidade na página de busca para ver os detalhes</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden p-2 sm:p-4 lg:p-8 gap-2 sm:gap-4 lg:gap-8">
      {/* Left Column - Unit Card */}
      <div className="w-full lg:w-[55%] bg-white shadow-lg p-3 sm:p-4 space-y-3 overflow-y-auto max-h-screen lg:max-h-screen">
        {/* Unit Header */}
        <div className="border-b pb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:h-44">
            <div className="w-full sm:w-32 md:w-40 lg:w-44 h-32 sm:h-full bg-transparent rounded-lg flex items-center justify-center flex-shrink-0 p-2 overflow-hidden">
              {/* 3D Viewer Button */}
              <button
                onClick={() => setIs3DModalOpen(true)}
                className="absolute top-2 right-2 z-10 px-2 py-1 text-xs rounded font-medium transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                title="Ver modelo 3D"
              >
                🎮 3D
              </button>

              {selectedUnit.imageUrl ? (
                <img 
                  src={selectedUnit.imageUrl} 
                  alt={selectedUnit.name}
                  className="w-full h-full object-contain rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<span class="text-xs font-bold text-gray-600 text-center">IMG</span>';
                    }
                  }}
                />
              ) : (
                <span className="text-xs font-bold text-gray-600 text-center">IMG</span>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-evenly sm:pl-6 mt-3 sm:mt-0">
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 leading-tight">{selectedUnit.name}{selectedUnit.isUnique && ' ★'}</h2>
                <div className="text-xs sm:text-sm text-gray-600">{selectedUnit.variant}</div>
                <div className="text-xs sm:text-sm text-gray-600">#{selectedUnit.collectionNumber}</div>
                <div className="text-lg sm:text-xl font-bold bg-yellow-100 text-yellow-800 px-3 sm:px-4 py-1 sm:py-2 rounded inline-block">{selectedUnit.points} pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div className="sm:border-0 border-b border-gray-200 pb-2 sm:pb-0">
              <div className="text-gray-500 text-xs">Tipo</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded capitalize">{selectedUnit.type}</div>
            </div>
            <div className="sm:border-l border-gray-200 sm:pl-2 sm:border-0 border-b border-gray-200 pb-2 sm:pb-0">
              <div className="text-gray-500 text-xs">Classe</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.class}</div>
            </div>
            <div className="sm:border-l border-gray-200 sm:pl-2">
              <div className="text-gray-500 text-xs">Rank</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.rank}</div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div className="sm:border-0 border-b border-gray-200 pb-2 sm:pb-0">
              <div className="text-gray-500 text-xs">Modo</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded capitalize">{selectedUnit.speedMode}</div>
            </div>
            <div className="sm:border-l border-gray-200 sm:pl-2 sm:border-0 border-b border-gray-200 pb-2 sm:pb-0">
              <div className="text-gray-500 text-xs">Facção</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.faction}</div>
            </div>
            <div className="sm:border-l border-gray-200 sm:pl-2">
              <div className="text-gray-500 text-xs">Expansão</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.expansion}</div>
            </div>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-1 text-center">
            <div className="sm:border-l border-gray-200 sm:pl-1">
              <div className="text-gray-500 text-xs">ATK</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.maxAttack}</div>
            </div>
            <div className="sm:border-l border-gray-200 sm:pl-1">
              <div className="text-gray-500 text-xs">DEF</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.maxDefense}</div>
            </div>
            <div className="sm:border-l border-gray-200 sm:pl-1">
              <div className="text-gray-500 text-xs">DMG</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.maxDamage}</div>
            </div>
            <div className="sm:border-l border-gray-200 sm:pl-1">
              <div className="text-gray-500 text-xs">VENT</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.ventCapacity}</div>
            </div>
          </div>
        </div>

        {/* Arc Information */}
        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center">
            <div className="sm:border-0 border-b border-gray-200 pb-2 sm:pb-0">
              <div className="text-gray-500 text-xs">Arco Frontal</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.frontArc}°</div>
            </div>
            <div className="sm:border-l border-gray-200 sm:pl-2">
              <div className="text-gray-500 text-xs">Arco Traseiro</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.rearArc}°</div>
            </div>
          </div>
        </div>

        {/* Heat Modifiers Table */}
        {selectedUnit.heatDial && selectedUnit.heatDial.length > 0 && (
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border">
            <HeatModifiersTable
              heatDial={selectedUnit.heatDial}
              heatClicks={heatClicks}
              damageClicks={damageClicks}
              combatDial={selectedUnit.combatDial}
              colorMapping={colorMapping}
            />
          </div>
        )}
      </div>

      {/* Right Column - Dial and Controls */}
      <div className="w-full lg:flex-1 flex flex-col items-center justify-center min-h-0 mt-4 lg:mt-0">
        {selectedUnit.type.toLowerCase() === 'mech' && 
         selectedUnit.speedMode.toLowerCase() === 'mech' && 
         selectedUnit.class.toLowerCase() !== 'colossal' ? (
          <div className="w-full flex justify-center">
            <div className="scale-75 sm:scale-75 lg:scale-100 origin-center">
              <AppDial
                unitId={unitId || ''}
                dialSide="stats"
                externalHeatClicks={heatClicks}
                externalDamageClicks={damageClicks}
                onHeatChange={(clicks) => clicks > heatClicks ? handleHeat((selectedUnit?.heatDial?.length ?? 0) + 1) : handleCooldown()}
                onDamageChange={(clicks) => clicks > damageClicks ? handleDamage() : handleRepair()}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center max-w-md">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Dial em Desenvolvimento</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                O dial interativo para unidades do tipo <span className="font-semibold text-blue-600">{selectedUnit.type}</span>, 
                modo <span className="font-semibold text-blue-600">{selectedUnit.speedMode}</span> e 
                classe <span className="font-semibold text-blue-600">{selectedUnit.class}</span> está sendo desenvolvido.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-blue-800">
                  <span className="font-semibold">🚧 Estamos trabalhando nisso!</span><br />
                  Em breve você poderá visualizar o dial completo para este tipo de unidade.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 3D Modal - Outside all containers for full screen */}
      {selectedUnit && (
        <Unit3DModal
          unit={selectedUnit}
          isOpen={is3DModalOpen}
          onClose={() => setIs3DModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function List() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListContent />
    </Suspense>
  );
}
