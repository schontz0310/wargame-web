'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { AppDial } from "@/components/app-dial"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useUnits } from "@/hooks/useUnits"
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useCallback, useEffect } from 'react';

import { apiService } from '@/lib/api';
import { Unit } from '@/lib/api';

const DAMAGE_EXAMPLE =  {
  primaryDamage: {
    type: 'melee',
    targets: 1,
    range: {
      minimum: 0,
      maximum: 14,
    }
  },
  secondaryDamage: {
    type: 'energetic',
    targets: 3,
    range: {
      minimum: 0,
      maximum: 12,
    }
  }
}

const HEAT_EXAMPLE =  {
  primaryDamage: {
    value: 0,
    collor: {
      hasColor: true,
      hexValue: "#009000"
    }, 
  },
  secondaryDamage: {
    value: 0,
    collor: {
      hasColor: true,
      hexValue: "#009000"
    }, 
  },
  movement: {
    value: 0,
    collor: {
      hasColor: true,
      hexValue: "#009000"
    }, 
  }
}

const EXAMPLE = {
  marker: {
    hasMarker: true,
    markerColor: "#009000"
  },
  values: {
    primaryAttack:  +3,
    secondaryAttack: 10,
    movement: 10,
    attack: 10,
    defense: 1
  },
  colors: {
    primaryAttack: {
      hasCollor: true,
      collorHex: "#000000",
      singleUse: false,
    },
    secondaryAttack: {
      hasCollor: true,
      collorHex: "#000000",
      singleUse: false,
    },
    movement: {
      hasCollor: true,
      collorHex: "#000000",
      singleUse: false,
    },
    attack: {
      hasCollor: true,
      collorHex: "#f2f",
      singleUse: false,
    },
    defense: {
      hasCollor: true,
      collorHex: "#000000",
      singleUse: false,
    }
  }
}


export default function List() {
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
      
      // Fetch individual unit with complete data including attackStats
      const response = await fetch(`/api/units/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch unit details');
      }
      
      const foundUnit = await response.json();
      setSelectedUnit(foundUnit);
    } catch (err) {
      console.error('Failed to fetch unit details, using mock data:', err);
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
            <img 
              src={selectedUnit.imageUrl} 
              alt={selectedUnit.name}
              className="w-40 h-40 rounded-lg object-contain border border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-unit.png';
              }}
            />
          </div>
          
          {/* Right side - Basic info */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {selectedUnit.name} {selectedUnit.isUnique && "★"}
            </h1>
            <p className="text-sm text-gray-500 mb-1">#{selectedUnit.collectionNumber}</p>
            <p className="text-sm text-gray-600 mb-3">{selectedUnit.variant}</p>
            
            {/* Key stats in header */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-sm text-gray-500">Pontos</div>
                <div className="font-bold text-xl text-blue-600">{selectedUnit.points}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Rank</div>
                <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                  selectedUnit.rank === 'Elite' ? 'bg-purple-100 text-purple-800' :
                  selectedUnit.rank === 'Veteran' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedUnit.rank}
                </span>
              </div>
            </div>
          </div>
        </div>
          
        {/* Stats grid */}
        <div className="space-y-4 flex-shrink-0 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-sm text-gray-500">Facção</div>
              <div className="font-medium text-base">{selectedUnit.faction}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Expansão</div>
              <div className="font-medium text-base">{selectedUnit.expansion}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tipo</div>
              <div className="font-medium text-base capitalize">{selectedUnit.type}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Modo</div>
              <div className="font-medium text-base">{selectedUnit.speedMode}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-3 text-center">
            <div>
              <div className="text-sm text-gray-500">HP</div>
              <div className="font-bold text-lg">{selectedUnit.health}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">ATK</div>
              <div className="font-bold text-lg">{selectedUnit.maxAttack}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">DEF</div>
              <div className="font-bold text-lg">{selectedUnit.maxDefense}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">DMG</div>
              <div className="font-bold text-lg">{selectedUnit.maxDamage}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">VENT</div>
              <div className="font-bold text-lg">{selectedUnit.ventCapacity}</div>
            </div>
          </div>
        </div>

        {/* Attack Stats Section - Enhanced */}
        {selectedUnit.attackStats && selectedUnit.attackStats.length > 0 && (
          <div className="border-t pt-3 flex-shrink-0 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Estatísticas de Ataque</h3>
            
            {selectedUnit.attackStats.map((attack, index) => (
              <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700 text-sm">
                    {attack.attackType === 'primary' ? 'Ataque Primário' : 'Ataque Secundário'}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    attack.damageType === 'ballistic' ? 'bg-blue-100 text-blue-800' : 
                    attack.damageType === 'melee' ? 'bg-red-100 text-red-800' : 
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {attack.damageType === 'ballistic' ? 'Balístico' : 
                     attack.damageType === 'melee' ? 'Melee' : 
                     'Energético'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Alcance:</span>
                    <span className="ml-1 font-medium text-base">{attack.minRange}-{attack.maxRange}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Alvos:</span>
                    <span className="ml-1 font-medium text-base">{attack.targetCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-3 text-sm flex-shrink-0 mt-4">
          <div className="flex justify-between">
            <span>Arco Frontal: <span className="font-medium">{selectedUnit.frontArc}°</span></span>
            <span>Arco Traseiro: <span className="font-medium">{selectedUnit.rearArc}°</span></span>
          </div>
        </div>
      </div>

      {/* Right Column - Dial and Controls */}
      <div className="flex flex-col gap-4 w-full lg:w-3/5 h-[90vh]">
        {/* Dial Control Buttons */}
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
            heatClick={HEAT_EXAMPLE}
            dialSide="stats"
            frontArc={parseInt(selectedUnit.frontArc)}
            rearArc={parseInt(selectedUnit.rearArc)}
            name={selectedUnit.name}
            unique={selectedUnit.isUnique}
            points={selectedUnit.points.toString()}
            variant={selectedUnit.variant}
            rank={selectedUnit.rank}
            ventRating={selectedUnit.ventCapacity}
            dialRotation={dialRotation}
            damageTypes={DAMAGE_EXAMPLE}
            click={EXAMPLE}
          />
        </div>
      </div>
    </div>
  ) 
}