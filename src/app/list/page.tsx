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

  return(
    <div className="h-screen flex flex-col lg:flex-row w-full gap-4 p-4 overflow-hidden">
      {/* Left Column - Unit Details Card */}
      <div className="w-full lg:w-2/5 h-[90vh] bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col overflow-hidden">
        <div className="flex gap-4 flex-shrink-0">
          {/* Left side - Image */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-16 h-16 rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-500">IMG</span>
            </div>
          </div>
          
          {/* Right side - Basic info */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {selectedUnit.name} {selectedUnit.isUnique && "★"}
            </h1>
            <p className="text-sm text-gray-500 mb-1">#{selectedUnit.collectionNumber}</p>
            <p className="text-sm text-gray-600 mb-3">{selectedUnit.variant}</p>
            
            {/* Key stats in header */}
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Pontos</div>
                <div className="font-bold text-xl text-blue-600">{selectedUnit.points}</div>
              </div>
            </div>
          </div>
        </div>
          
        {/* Stats grid */}
        <div className="space-y-1 flex-shrink-0 mt-1">
          {/* Classification Section */}
          <div className="bg-gray-50 p-2 rounded border text-xs">
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <div className="text-gray-500">Tipo</div>
                <div className="font-medium capitalize bg-white px-1 py-0.5 rounded">{selectedUnit.type}</div>
              </div>
              <div className="border-l border-gray-200 pl-1">
                <div className="text-gray-500">Classe</div>
                <div className="font-medium bg-white px-1 py-0.5 rounded">{selectedUnit.class}</div>
              </div>
              <div className="border-l border-gray-200 pl-1">
                <div className="text-gray-500">Modo</div>
                <div className="font-medium bg-white px-1 py-0.5 rounded">
                  {selectedUnit.class === 'Colossal' && selectedUnit.speedMode === 'mech' 
                    ? 'Tripod' 
                    : selectedUnit.speedMode}
                </div>
              </div>
            </div>
          </div>
          
          {/* Origin Section */}
          <div className="bg-gray-50 p-2 rounded border text-xs">
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <div className="text-gray-500">Facção</div>
                <div className="font-medium bg-white px-1 py-0.5 rounded">{selectedUnit.faction}</div>
              </div>
              <div className="border-l border-gray-200 pl-1">
                <div className="text-gray-500">Rank</div>
                <div className="font-medium bg-white px-1 py-0.5 rounded">
                  {selectedUnit.rank}
                </div>
              </div>
              <div className="border-l border-gray-200 pl-1">
                <div className="text-gray-500">Expansão</div>
                <div className="font-medium bg-white px-1 py-0.5 rounded">{selectedUnit.expansion}</div>
              </div>
            </div>
          </div>
          
          {/* Combat Stats Section */}
          <div className="bg-gray-50 p-2 rounded border text-xs">
            <h4 className="text-xs font-semibold text-gray-700 mb-0.5 text-center">ESTATÍSTICAS</h4>
            <div className="grid grid-cols-5 gap-1 text-center">
              <div>
                <div className="text-gray-500">HP</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.health}</div>
              </div>
              <div className="border-l border-gray-200 pl-1">
                <div className="text-gray-500">ATK</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.maxAttack}</div>
              </div>
              <div className="border-l border-gray-200 pl-1">
                <div className="text-gray-500">DEF</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.maxDefense}</div>
              </div>
              <div className="border-l border-gray-200 pl-1">
                <div className="text-gray-500">DMG</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.maxDamage}</div>
              </div>
              <div className="border-l border-gray-200 pl-1">
                <div className="text-gray-500">VENT</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.ventCapacity}</div>
              </div>
            </div>
          </div>

          {/* Armor Arcs Section */}
          <div className="bg-gray-50 p-2 rounded border text-xs">
            <h4 className="text-xs font-semibold text-gray-700 mb-0.5 text-center">ARCOS</h4>
            <div className="grid grid-cols-2 gap-1 text-center">
              <div>
                <div className="text-gray-500">Frontal</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.frontArc}°</div>
              </div>
              <div className="border-l border-gray-200 pl-1">
                <div className="text-gray-500">Traseiro</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedUnit.rearArc}°</div>
              </div>
            </div>
          </div>

        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleDamage}
            disabled={damageClicks >= 17}
            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Dano (+20°)
          </button>
          <button
            onClick={handleRepair}
            disabled={damageClicks === 0}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Reparo (-20°)
          </button>
          <div className="px-3 py-2 bg-gray-200 rounded text-sm text-center">
            Posição: {damageClicks + 1}/18
          </div>
        </div>

        {/* AppDial Component */}
        <div className="flex-1 flex items-center justify-center">
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