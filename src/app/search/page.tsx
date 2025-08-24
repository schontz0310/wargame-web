'use client'

import { useState } from 'react'
import { useUnits } from '@/hooks/useUnits'
import { useRouter } from 'next/navigation'
import { Unit } from '@/lib/api';

// Mock data for dial component
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
    type: 'ballistic',
    targets: 1,
    range: {
      minimum: 0,
      maximum: 14,
    }
  }
}

const HEAT_EXAMPLE = {
  primaryDamage: {
    value: 0,
    collor: {
      hasColor: false,
      hexValue: "#000000"
    }
  },
  secondaryDamage: {
    value: 0,
    collor: {
      hasColor: false,
      hexValue: "#000000"
    }
  },
  movement: {
    value: 0,
    collor: {
      hasColor: false,
      hexValue: "#000000"
    }
  }
}

const EXAMPLE = {
  marker: {
    hasMarker: false,
    markerColor: "#000000"
  },
  values: {
    primaryAttack: 10,
    secondaryAttack: 8,
    tertiaryAttack: 6,
    movement: 12,
    attack: 11,
    defense: 18
  },
  colors: {
    primaryAttack: {
      hasCollor: false,
      collorHex: "#000000",
      singleUse: false
    },
    secondaryAttack: {
      hasCollor: false,
      collorHex: "#000000",
      singleUse: false
    },
    tertiaryAttack: {
      hasCollor: false,
      collorHex: "#000000",
      singleUse: false
    },
    movement: {
      hasCollor: false,
      collorHex: "#000000",
      singleUse: false
    },
    attack: {
      hasCollor: false,
      collorHex: "#000000",
      singleUse: false
    },
    defense: {
      hasCollor: false,
      collorHex: "#000000",
      singleUse: false
    }
  }
}

export default function SearchPage() {
  const { units, loading } = useUnits();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  const router = useRouter();

  const handleUnitClick = (unitId: string) => {
    router.push(`/list?unitId=${unitId}`);
  };

  // Create mock unit data as fallback
  const mockUnit: Unit = {
    id: "mock-1",
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
    collectionNumber: 0
  };

  // Use API units if available, otherwise use mock data
  const displayUnits = units.length > 0 ? units : [mockUnit];

  // Get unique values for filters
  const uniqueTypes = [...new Set(displayUnits.map(unit => unit.type))].sort();
  const uniqueExpansions = [...new Set(displayUnits.map(unit => unit.expansion))].sort();
  const uniqueFactions = [...new Set(displayUnits.map(unit => unit.faction))].sort();

  const filteredUnits = displayUnits.filter(unit => {
    const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.variant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || unit.type === selectedType;
    const matchesExpansion = !selectedExpansion || unit.expansion === selectedExpansion;
    const matchesFaction = !selectedFaction || unit.faction === selectedFaction;
    
    return matchesSearch && matchesType && matchesExpansion && matchesFaction;
  });

  const clearFilters = () => {
    setSelectedType('');
    setSelectedExpansion('');
    setSelectedFaction('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando unidades...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-center">Buscar Unidades</h1>
      
      {/* Search Bar and Filters */}
      <div className="w-full">
        {/* Search Input */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Buscar por nome ou variante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Type Filter */}
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os tipos</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
          </div>

          {/* Expansion Filter */}
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Expansão</label>
            <select
              value={selectedExpansion}
              onChange={(e) => setSelectedExpansion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as expansões</option>
              {uniqueExpansions.map(expansion => (
                <option key={expansion} value={expansion}>{expansion}</option>
              ))}
            </select>
          </div>

          {/* Faction Filter */}
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Facção</label>
            <select
              value={selectedFaction}
              onChange={(e) => setSelectedFaction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as facções</option>
              {uniqueFactions.map(faction => (
                <option key={faction} value={faction}>{faction}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Results Count and Active Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <p className="text-gray-600 text-sm">
            {filteredUnits.length} de {displayUnits.length} unidade(s) encontrada(s)
          </p>
          
          {/* Active Filters Display */}
          {(selectedType || selectedExpansion || selectedFaction) && (
            <div className="flex flex-wrap gap-2">
              {selectedType && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Tipo: {selectedType}
                  <button
                    onClick={() => setSelectedType('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedExpansion && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Expansão: {selectedExpansion}
                  <button
                    onClick={() => setSelectedExpansion('')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedFaction && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Facção: {selectedFaction}
                  <button
                    onClick={() => setSelectedFaction('')}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Units Table - Desktop */}
      <div className="hidden lg:block w-full overflow-hidden">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Table Header Section with Enhanced Styling */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-800 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Lista de Unidades
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {filteredUnits.length} unidade(s) encontrada(s)
                </p>
              </div>
              <div className="flex items-center gap-4 text-blue-100">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Dados atualizados</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white">
            <table className="w-full bg-white table-fixed divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-blue-200">
              <tr>
                <th scope="col" className="px-1 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24 border-r border-gray-200">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-xs">Nome</span>
                  </div>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-8 border-r border-gray-200">
                  <span className="text-xs">Exp</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200">
                  <span className="text-xs">#</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-8 border-r border-gray-200">
                  <span className="text-xs">Tipo</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-8 border-r border-gray-200">
                  <span className="text-xs">Modo</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-12 border-r border-gray-200">
                  <span className="text-xs">Classe</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-8 border-r border-gray-200">
                  <span className="text-xs">Pts</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200">
                  <span className="text-xs">HP</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200">
                  <span className="text-xs">Vent</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-16 border-r border-gray-200">
                  <span className="text-xs">Facção</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200">
                  <span className="text-xs">ATK</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200">
                  <span className="text-xs">SPD</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200">
                  <span className="text-xs">DEF</span>
                </th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleUnitClick(unit.id)}>
                    <td className="px-1 py-2">
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {unit.name} {unit.isUnique && "★"}
                      </div>
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 text-center">
                      {unit.expansion}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 font-mono text-center">
                      {unit.collectionNumber}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 capitalize text-center">
                      {unit.type}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 text-center">
                      {unit.speedMode}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 text-center">
                      {unit.class}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 font-medium text-center">
                      {unit.points}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 text-center">
                      {unit.health}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 text-center">
                      {unit.ventCapacity}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 truncate">
                      {unit.faction}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 text-center">
                      {unit.maxAttack}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 text-center">
                      {unit.maxSpeed}
                    </td>
                    <td className="px-1 py-2 text-xs text-gray-900 text-center">
                      {unit.maxDefense}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer with unit count */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 rounded-b-lg">
            <p className="text-sm text-gray-600 text-center">
              Mostrando {filteredUnits.length} de {displayUnits.length} unidades
            </p>
          </div>
        </div>
      </div>

      {/* Units Cards - Mobile/Tablet */}
      <div className="w-full lg:hidden">
        <div className="space-y-3">
          {filteredUnits.map((unit) => (
            <div key={unit.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleUnitClick(unit.id)}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-16 h-16 rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-500">IMG</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {unit.name} {unit.isUnique && "★"}
                      </h3>
                      <span className="text-sm font-mono text-gray-500">#{unit.collectionNumber}</span>
                    </div>
                    <p className="text-sm text-gray-500 capitalize">
                      {unit.type} • {unit.speedMode}
                    </p>
                    <p className="text-sm text-gray-600">{unit.faction}</p>
                    <p className="text-xs text-gray-500 mt-1">{unit.expansion}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{unit.points} pts</div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                    unit.rank === 'Elite' ? 'bg-purple-100 text-purple-800' :
                    unit.rank === 'Veteran' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {unit.rank}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vida:</span>
                    <span className="font-medium">{unit.health}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ataque:</span>
                    <span className="font-medium">{unit.maxAttack}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Defesa:</span>
                    <span className="font-medium">{unit.maxDefense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Velocidade:</span>
                    <span className="font-medium">{unit.maxSpeed}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Arco Frontal: {unit.frontArc}°</span>
                  <span>Arco Traseiro: {unit.rearArc}°</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* No results message */}
      {filteredUnits.length === 0 && displayUnits.length > 0 && (
        <div className="text-center text-gray-500">
          Nenhuma unidade encontrada com os filtros aplicados
        </div>
      )}
    </div>
  );
}
