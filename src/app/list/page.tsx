'use client'

import { AppDial } from '@/components/app-dial';
import { Unit, apiService } from '@/lib/api';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';




function ListContent() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unitId');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for dial rotation and damage tracking
  const [dialRotation, setDialRotation] = useState(0);
  const [damageClicks, setDamageClicks] = useState(0);

  useEffect(() => {
    if (unitId) {
      fetchUnitDetails(unitId);
    }
  }, [unitId]);

  // Function to handle damage (clockwise rotation)
  const handleDamage = useCallback(() => {
    if (damageClicks < 17) { // Prevent exceeding maximum damage (17 clicks - unit starts at position 1)
      const newDamageClicks = damageClicks + 1;
      const newRotation = dialRotation + 20; // 20 degrees per click (360/18 positions - max mech health)
      
      setDamageClicks(newDamageClicks);
      setDialRotation(newRotation);
    }
  }, [damageClicks, dialRotation]);

  // Function to handle repair (counter-clockwise rotation)
  const handleRepair = useCallback(() => {
    if (damageClicks > 0) { // Prevent going below 0 damage
      const newDamageClicks = damageClicks - 1;
      const newRotation = dialRotation - 20; // -20 degrees per repair
      
      setDamageClicks(newDamageClicks);
      setDialRotation(newRotation);
    }
  }, [damageClicks, dialRotation]);

  const fetchUnitDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use apiService to fetch unit details directly from API
      const foundUnit = await apiService.getUnit(id);
      if (foundUnit) {
        setSelectedUnit(foundUnit);
      } else {
        throw new Error('Unit not found');
      }
    } catch (err) {
      console.error('Failed to fetch unit details:', err);
      // Use mock data as fallback
      const mockUnit: Unit = {
        id: id,
        name: "Vulture Mk IV 'Le Yuan [Paradise]'",
        type: "mech",
        speedMode: "Walk",
        class: "Heavy",
        points: 211,
        health: 18,
        faction: "House Steiner",
        frontArc: "270",
        rearArc: "90",
        maxSpeed: 8,
        ventCapacity: 2,
        maxAttack: 10,
        maxDefense: 17,
        maxDamage: 3,
        variant: "VTR-V1-H",
        isUnique: true,
        rank: "Elite",
        expansion: "AOD",
        imageUrl: "",
        collectionNumber: 1
      };
      setSelectedUnit(mockUnit);
      setError(null); // Clear error since we're showing mock data
    } finally {
      setLoading(false);
    }
  };

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
    <div className="h-screen flex overflow-hidden p-8 gap-8">
      {/* Left Column - Unit Card (40%) */}
      <div className="w-[40%] bg-white shadow-lg p-4 space-y-3 overflow-y-auto max-h-screen">
          {/* Unit Header */}
          <div className="border-b pb-4">
            <div className="flex gap-3 h-44">
              <div className="w-44 bg-transparent rounded-lg flex items-center justify-center flex-shrink-0 p-2 overflow-hidden">
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
              <div className="flex-1 flex flex-col justify-evenly pl-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-gray-800 leading-tight">{selectedUnit.name}{selectedUnit.isUnique && ' ★'}</h2>
                  <div className="text-sm text-gray-600">{selectedUnit.variant}</div>
                  <div className="text-sm text-gray-600">#{selectedUnit.collectionNumber}</div>
                  <div className="text-xl font-bold bg-yellow-100 text-yellow-800 px-4 py-2 rounded inline-block">{selectedUnit.points} pts</div>
                </div>
              </div>
            </div>
          </div>

        {/* Basic Info */}
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-gray-500 text-xs">Tipo</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded capitalize">{selectedUnit.type}</div>
            </div>
            <div className="border-l border-gray-200 pl-2">
              <div className="text-gray-500 text-xs">Classe</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.class}</div>
            </div>
            <div className="border-l border-gray-200 pl-2">
              <div className="text-gray-500 text-xs">Rank</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.rank}</div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-gray-500 text-xs">Modo</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded capitalize">{selectedUnit.speedMode}</div>
            </div>
            <div className="border-l border-gray-200 pl-2">
              <div className="text-gray-500 text-xs">Facção</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.faction}</div>
            </div>
            <div className="border-l border-gray-200 pl-2">
              <div className="text-gray-500 text-xs">Expansão</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.expansion}</div>
            </div>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="grid grid-cols-4 gap-1 text-center">
            <div className="border-l border-gray-200 pl-1">
              <div className="text-gray-500 text-xs">ATK</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.maxAttack}</div>
            </div>
            <div className="border-l border-gray-200 pl-1">
              <div className="text-gray-500 text-xs">DEF</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.maxDefense}</div>
            </div>
            <div className="border-l border-gray-200 pl-1">
              <div className="text-gray-500 text-xs">DMG</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.maxDamage}</div>
            </div>
            <div className="border-l border-gray-200 pl-1">
              <div className="text-gray-500 text-xs">VENT</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.ventCapacity}</div>
            </div>
          </div>
        </div>

        {/* Arc Information */}
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-gray-500 text-xs">Arco Frontal</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.frontArc}°</div>
            </div>
            <div className="border-l border-gray-200 pl-2">
              <div className="text-gray-500 text-xs">Arco Traseiro</div>
              <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.rearArc}°</div>
            </div>
          </div>
        </div>

        {/* Attack Information */}
        {selectedUnit.attackStats && selectedUnit.attackStats.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="space-y-2">
              {selectedUnit.attackStats.map((attack, index) => (
                <div key={`${attack.unitId}-${attack.attackType}-${index}`} className={`grid grid-cols-4 gap-2 text-center ${index > 0 ? 'pt-2 border-t border-gray-200' : ''}`}>
                  <div className="flex items-center justify-center">
                    <div className="text-gray-500 text-xs">
                      {attack.attackType === 'primary' ? 'Ataque Primário' : 'Ataque Secundário'}
                    </div>
                  </div>
                  <div className="border-l border-gray-200 pl-2">
                    <div className="text-gray-500 text-xs">Tipo</div>
                    <div className="font-bold text-xs bg-white px-1 py-0.5 rounded capitalize">
                      {attack.damageType === 'ballistic' ? 'Balístico' : 
                       attack.damageType === 'energetic' ? 'Energético' : 
                       attack.damageType === 'melee' ? 'Corpo a Corpo' : 'N/A'}
                    </div>
                  </div>
                  <div className="border-l border-gray-200 pl-2">
                    <div className="text-gray-500 text-xs">Alvos</div>
                    <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{attack.targetCount}</div>
                  </div>
                  <div className="border-l border-gray-200 pl-2">
                    <div className="text-gray-500 text-xs">Alcance</div>
                    <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{attack.minRange}-{attack.maxRange}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Right Column - Dial and Controls */}
      <div className="flex-1 flex flex-col gap-4 h-full">
        {/* Action Buttons - Only for Mech units */}
        {selectedUnit.type.toLowerCase() === 'mech' && 
         selectedUnit.speedMode.toLowerCase() === 'mech' && 
         selectedUnit.class.toLowerCase() !== 'colossal' && (
          <div className="flex justify-center gap-3 flex-shrink-0">
            <button
              onClick={handleDamage}
              disabled={damageClicks >= 17}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Aplicar Dano (+20°)
            </button>
            <button
              onClick={handleRepair}
              disabled={damageClicks === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Reparar (-20°)
            </button>
            <div className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium text-center">
              Posição: {damageClicks + 1}/18
            </div>
          </div>
        )}

        {/* AppDial Component ou Fallback */}
        <div className="flex-1 flex items-center justify-center min-h-0 w-full">
          {selectedUnit.type.toLowerCase() === 'mech' && 
           selectedUnit.speedMode.toLowerCase() === 'mech' && 
           selectedUnit.class.toLowerCase() !== 'colossal' ? (
            <AppDial
              dialSide="stats"
              frontArc={parseInt(selectedUnit.frontArc)}
              rearArc={parseInt(selectedUnit.rearArc)}
              name={selectedUnit.name}
              unique={selectedUnit.isUnique}
              points={selectedUnit.points.toString()}
              variant={selectedUnit.variant}
              rank={selectedUnit.rank}
              faction={selectedUnit.faction}
              expansion={selectedUnit.expansion}
              collectionNumber={selectedUnit.collectionNumber}
              ventRating={selectedUnit.ventCapacity}
              dialRotation={dialRotation}
              damageTypes={{
                primaryDamage: {
                  type: 'ballistic',
                  targets: 1,
                  range: { minimum: 0, maximum: 14 }
                },
                secondaryDamage: {
                  type: 'energetic',
                  targets: 1,
                  range: { minimum: 0, maximum: 12 }
                }
              }}
              click={{
                marker: { hasMarker: false },
                values: {
                  primaryAttack: 10,
                  secondaryAttack: 8,
                  movement: 12,
                  attack: 11,
                  defense: 18
                },
                colors: {
                  primaryAttack: { hasCollor: false, collorHex: "#000000", singleUse: false },
                  secondaryAttack: { hasCollor: false, collorHex: "#000000", singleUse: false },
                  movement: { hasCollor: false, collorHex: "#000000", singleUse: false },
                  attack: { hasCollor: false, collorHex: "#000000", singleUse: false },
                  defense: { hasCollor: false, collorHex: "#000000", singleUse: false }
                }
              }}
              heatClick={{
                primaryDamage: {
                  value: 0,
                  collor: { hasColor: false, hexValue: "#000000" }
                },
                secondaryDamage: {
                  value: 0,
                  collor: { hasColor: false, hexValue: "#000000" }
                },
                movement: {
                  value: 0,
                  collor: { hasColor: false, hexValue: "#000000" }
                }
              }}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Dial em Desenvolvimento</h3>
                <p className="text-gray-600 mb-4">
                  O dial interativo para unidades do tipo <span className="font-semibold text-blue-600">{selectedUnit.type}</span>, 
                  modo <span className="font-semibold text-blue-600">{selectedUnit.speedMode}</span> e 
                  classe <span className="font-semibold text-blue-600">{selectedUnit.class}</span> está sendo desenvolvido.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">🚧 Estamos trabalhando nisso!</span><br />
                    Em breve você poderá visualizar o dial completo para este tipo de unidade.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function List() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListContent />
    </Suspense>
  )
}