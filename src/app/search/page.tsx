'use client'

import { useState, useEffect, Suspense } from 'react'
import { useUnits } from '@/hooks/useUnits'
import { useRouter, useSearchParams } from 'next/navigation'
import { Unit } from '@/lib/api'

function SearchPageContent() {
  const { units, loading, error } = useUnits();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Debug logging
  console.log('SearchPage - units:', units.length, 'loading:', loading, 'error:', error);
  
  // Initialize state from URL params or localStorage
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  const [selectedRank, setSelectedRank] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showUniqueOnly, setShowUniqueOnly] = useState(false);
  const [pointsRange, setPointsRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState<Set<string>>(new Set());

  // Load state from URL params and localStorage on mount
  useEffect(() => {
    const loadStateFromStorage = () => {
      try {
        const saved = localStorage.getItem('searchPageState');
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    };

    const savedState = loadStateFromStorage();
    
    // Priority: URL params > localStorage > defaults
    setSearchTerm(searchParams.get('q') || savedState.searchTerm || '');
    setSelectedType(searchParams.get('type') || savedState.selectedType || '');
    setSelectedExpansion(searchParams.get('expansion') || savedState.selectedExpansion || '');
    setSelectedFaction(searchParams.get('faction') || savedState.selectedFaction || '');
    setSelectedRank(searchParams.get('rank') || savedState.selectedRank || '');
    setSelectedClass(searchParams.get('class') || savedState.selectedClass || '');
    setShowUniqueOnly(searchParams.get('unique') === 'true' || savedState.showUniqueOnly || false);
    setPointsRange({
      min: searchParams.get('minPoints') || savedState.pointsRange?.min || '',
      max: searchParams.get('maxPoints') || savedState.pointsRange?.max || ''
    });
    setSortBy(searchParams.get('sort') || savedState.sortBy || 'name');
    setSidebarOpen(savedState.sidebarOpen !== false); // Default to true
    
    setIsInitialized(true);
  }, [searchParams]);

  // Update URL and localStorage when state changes
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    
    if (searchTerm) params.set('q', searchTerm);
    if (selectedType) params.set('type', selectedType);
    if (selectedExpansion) params.set('expansion', selectedExpansion);
    if (selectedFaction) params.set('faction', selectedFaction);
    if (selectedRank) params.set('rank', selectedRank);
    if (selectedClass) params.set('class', selectedClass);
    if (showUniqueOnly) params.set('unique', 'true');
    if (pointsRange.min) params.set('minPoints', pointsRange.min);
    if (pointsRange.max) params.set('maxPoints', pointsRange.max);
    if (sortBy !== 'name') params.set('sort', sortBy);

    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    
    // Update URL without causing navigation
    window.history.replaceState({}, '', newUrl);
    
    // Save to localStorage
    const stateToSave = {
      searchTerm,
      selectedType,
      selectedExpansion,
      selectedFaction,
      selectedRank,
      selectedClass,
      showUniqueOnly,
      pointsRange,
      sortBy,
      sidebarOpen
    };
    
    try {
      localStorage.setItem('searchPageState', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save search state to localStorage:', error);
    }
  }, [searchTerm, selectedType, selectedExpansion, selectedFaction, selectedRank, selectedClass, showUniqueOnly, pointsRange, sortBy, sidebarOpen, isInitialized]);

  const handleUnitClick = (unitId: string) => {
    router.push(`/list?unitId=${unitId}`);
  };

  // Get unit counts in collections
  const getUnitCounts = (unitId: string) => {
    const haveCollection = JSON.parse(localStorage.getItem('myHaveCollection') || '[]');
    const wantCollection = JSON.parse(localStorage.getItem('myWantCollection') || '[]');
    
    const haveUnit = haveCollection.find((u: { id: string }) => u.id === unitId);
    const wantUnit = wantCollection.find((u: { id: string }) => u.id === unitId);
    
    const haveCount = haveUnit ? (haveUnit.quantity || 1) : 0;
    const wantCount = wantUnit ? (wantUnit.quantity || 1) : 0;
    
    return { haveCount, wantCount };
  };

  // Add unit to collection
  const addToCollection = async (unit: Unit, listType: 'have' | 'want') => {
    const loadingKey = `${unit.id}-${listType}`;
    
    // Start loading
    setLoadingUnits(prev => new Set([...prev, loadingKey]));
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const storageKey = listType === 'have' ? 'myHaveCollection' : 'myWantCollection';
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Check if unit already exists
    const existingUnitIndex = existing.findIndex((u: { id: string }) => u.id === unit.id);
    
    let updated;
    if (existingUnitIndex >= 0) {
      // Unit exists, increment quantity
      updated = [...existing];
      updated[existingUnitIndex] = {
        ...updated[existingUnitIndex],
        quantity: (updated[existingUnitIndex].quantity || 1) + 1
      };
    } else {
      // Unit doesn't exist, add new
      const myUnit = {
        id: unit.id,
        name: unit.name,
        points: unit.points,
        faction: unit.faction,
        type: unit.type,
        quantity: 1,
        expansion: unit.expansion,
        collectionNumber: unit.collectionNumber
      };
      updated = [...existing, myUnit];
    }

    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    // Stop loading
    setLoadingUnits(prev => {
      const newSet = new Set(prev);
      newSet.delete(loadingKey);
      return newSet;
    });
  };


  // Use API units directly
  const displayUnits = units;

  // Get unique values for filters
  const uniqueTypes = [...new Set(displayUnits.map(unit => unit.type))].sort();
  const uniqueExpansions = [...new Set(displayUnits.map(unit => unit.expansion))].sort();
  const uniqueFactions = [...new Set(displayUnits.map(unit => unit.faction))].sort();
  const uniqueRanks = [...new Set(displayUnits.map(unit => unit.rank))].sort();
  const uniqueClasses = [...new Set(displayUnits.map(unit => unit.class))].sort();

  const filteredUnits = displayUnits.filter(unit => {
    const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.variant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || unit.type === selectedType;
    const matchesExpansion = !selectedExpansion || unit.expansion === selectedExpansion;
    const matchesFaction = !selectedFaction || unit.faction === selectedFaction;
    const matchesRank = !selectedRank || unit.rank === selectedRank;
    const matchesClass = !selectedClass || unit.class === selectedClass;
    const matchesUnique = !showUniqueOnly || unit.isUnique;
    const matchesPoints = (!pointsRange.min || unit.points >= parseInt(pointsRange.min)) &&
                         (!pointsRange.max || unit.points <= parseInt(pointsRange.max));
    
    return matchesSearch && matchesType && matchesExpansion && matchesFaction && 
           matchesRank && matchesClass && matchesUnique && matchesPoints;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'points':
        return a.points - b.points;
      case 'pointsDesc':
        return b.points - a.points;
      case 'faction':
        return a.faction.localeCompare(b.faction);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'rank':
        return a.rank.localeCompare(b.rank);
      case 'collectionNumber':
        // Convert collection numbers to proper sorting format
        const aNum = String(a.collectionNumber);
        const bNum = String(b.collectionNumber);
        
        // Check if both are purely numeric
        const aIsNumeric = /^\d+$/.test(aNum);
        const bIsNumeric = /^\d+$/.test(bNum);
        
        if (aIsNumeric && bIsNumeric) {
          // Both numeric - compare as numbers
          return parseInt(aNum) - parseInt(bNum);
        } else if (aIsNumeric && !bIsNumeric) {
          // a is numeric, b is alphanumeric - a comes first
          return -1;
        } else if (!aIsNumeric && bIsNumeric) {
          // a is alphanumeric, b is numeric - b comes first
          return 1;
        } else {
          // Both alphanumeric - compare as strings
          return aNum.localeCompare(bNum);
        }
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const clearFilters = () => {
    setSelectedType('');
    setSelectedExpansion('');
    setSelectedFaction('');
    setSelectedRank('');
    setSelectedClass('');
    setShowUniqueOnly(false);
    setPointsRange({ min: '', max: '' });
    setSearchTerm('');
    setSortBy('name');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando unidades...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Filter Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden bg-white border-r border-gray-200 shadow-sm lg:relative absolute lg:z-auto z-50 h-full`}>
        <div className="p-4 h-full overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Filtros</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Nome ou variante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort By */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Nome</option>
              <option value="points">Pontos</option>
              <option value="faction">Facção</option>
              <option value="type">Tipo</option>
              <option value="expansion">Expansão</option>
              <option value="collectionNumber">Número (#)</option>
            </select>
          </div>
            

          {/* Type Filter */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os tipos</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
          </div>

          {/* Expansion Filter */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Expansão</label>
            <select
              value={selectedExpansion}
              onChange={(e) => setSelectedExpansion(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as expansões</option>
              {uniqueExpansions.map(expansion => (
                <option key={expansion} value={expansion}>{expansion}</option>
              ))}
            </select>
          </div>

          {/* Faction Filter */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Facção</label>
            <select
              value={selectedFaction}
              onChange={(e) => setSelectedFaction(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as facções</option>
              {uniqueFactions.map(faction => (
                <option key={faction} value={faction}>{faction}</option>
              ))}
            </select>
          </div>

          {/* Rank Filter */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Rank</label>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os ranks</option>
              {uniqueRanks.map(rank => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Classe</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as classes</option>
              {uniqueClasses.map(unitClass => (
                <option key={unitClass} value={unitClass}>{unitClass}</option>
              ))}
            </select>
          </div>

          {/* Points Range */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Pontos Mínimos</label>
            <input
              type="number"
              placeholder="0"
              value={pointsRange.min}
              onChange={(e) => setPointsRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Points Max */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Pontos Máximos</label>
            <input
              type="number"
              placeholder="999"
              value={pointsRange.max}
              onChange={(e) => setPointsRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Unique Units Checkbox */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="uniqueOnly"
                checked={showUniqueOnly}
                onChange={(e) => setShowUniqueOnly(e.target.checked)}
                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="uniqueOnly" className="ml-2 text-xs font-medium text-gray-700">
                Apenas únicos ★
              </label>
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-xs"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">Buscar Unidades</h1>
            </div>
            <div className="text-sm text-gray-600">
              {filteredUnits.length} de {displayUnits.length} unidade(s)
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedType || selectedExpansion || selectedFaction || selectedRank || selectedClass || showUniqueOnly || pointsRange.min || pointsRange.max) && (
            <div className="flex flex-wrap gap-2 mt-4">
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
              {selectedRank && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Rank: {selectedRank}
                  <button
                    onClick={() => setSelectedRank('')}
                    className="ml-1 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedClass && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Classe: {selectedClass}
                  <button
                    onClick={() => setSelectedClass('')}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {showUniqueOnly && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  Apenas únicos ★
                  <button
                    onClick={() => setShowUniqueOnly(false)}
                    className="ml-1 text-pink-600 hover:text-pink-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {(pointsRange.min || pointsRange.max) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Pontos: {pointsRange.min || '0'}-{pointsRange.max || '∞'}
                  <button
                    onClick={() => setPointsRange({ min: '', max: '' })}
                    className="ml-1 text-orange-600 hover:text-orange-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
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
                <button
                  onClick={() => router.push('/drafts')}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                  title="Ver Meus Drafts"
                >
                  📝 Drafts
                </button>
                <button
                  onClick={() => router.push('/my-collection')}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                  title="Ver Minha Coleção"
                >
                  📋 Minha Coleção
                </button>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Dados atualizados</span>
                </div>
              </div>
            </div>
          </div>

              <div className="bg-white max-h-[calc(100vh-300px)] overflow-y-auto">
                <table className="w-full bg-white table-fixed divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-blue-200 sticky top-0 z-10">
                  <tr>
                <th scope="col" className="px-1 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-xs">Nome</span>
                  </div>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-8 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">Exp</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">#</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-8 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">Tipo</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-8 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">Modo</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-12 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">Classe</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-8 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">Pts</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">HP</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">Vent</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-16 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">Facção</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">ATK</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">SPD</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-6 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">DEF</span>
                </th>
                <th scope="col" className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20 border-r border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <span className="text-xs">Ações</span>
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
                    <td className="px-1 py-2 text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {(() => {
                          const { haveCount, wantCount } = getUnitCounts(unit.id);
                          const isHaveLoading = loadingUnits.has(`${unit.id}-have`);
                          const isWantLoading = loadingUnits.has(`${unit.id}-want`);
                          
                          return (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCollection(unit, 'have');
                                }}
                                disabled={isHaveLoading}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs px-1 py-1 rounded transition-all duration-200 disabled:opacity-50 min-w-[28px] flex items-center justify-center"
                                title="Adicionar à lista Tenho"
                              >
                                {isHaveLoading ? (
                                  <div className="animate-spin w-2 h-2 border border-white border-t-transparent rounded-full"></div>
                                ) : (
                                  `📦${haveCount}`
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCollection(unit, 'want');
                                }}
                                disabled={isWantLoading}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-1 py-1 rounded transition-all duration-200 disabled:opacity-50 min-w-[28px] flex items-center justify-center"
                                title="Adicionar à lista Procuro"
                              >
                                {isWantLoading ? (
                                  <div className="animate-spin w-2 h-2 border border-white border-t-transparent rounded-full"></div>
                                ) : (
                                  `🔍${wantCount}`
                                )}
                              </button>
                            </>
                          );
                        })()}
                      </div>
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
            <div className="text-center text-gray-500 mt-8">
              Nenhuma unidade encontrada com os filtros aplicados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando página de busca...</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
