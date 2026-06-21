'use client'

import { useState, useEffect, Suspense } from 'react'
import { useUnits } from '@/hooks/useUnits'
import { useRouter, useSearchParams } from 'next/navigation'
import { Unit, Draft } from '@/lib/api'
import { safeLocalStorage } from '@/lib/storage'

function SearchPageContent() {
  const { units, loading } = useUnits();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  
  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  
  // Initialize state from URL params or localStorage
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  const [selectedRank, setSelectedRank] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showUniqueOnly, setShowUniqueOnly] = useState(false);
  const [showHaveOnly, setShowHaveOnly] = useState(false);
  const [showWantOnly, setShowWantOnly] = useState(false);
  const [pointsRange, setPointsRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');

  // Load drafts from localStorage (client-side only)
  useEffect(() => {
    if (!isClient) return;
    
    const savedDrafts = safeLocalStorage.getItem('myDrafts');
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (error) {
        console.error('Error loading drafts:', error);
      }
    }
  }, [isClient]);

  // Load state from URL params and localStorage on mount (client-side only)
  useEffect(() => {
    if (!isClient) return;

    const loadStateFromStorage = () => {
      try {
        const saved = safeLocalStorage.getItem('searchPageState');
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
    setShowHaveOnly(searchParams.get('have') === 'true' || savedState.showHaveOnly || false);
    setShowWantOnly(searchParams.get('want') === 'true' || savedState.showWantOnly || false);
    setPointsRange({
      min: searchParams.get('minPoints') || savedState.pointsRange?.min || '',
      max: searchParams.get('maxPoints') || savedState.pointsRange?.max || ''
    });
    setSortBy(searchParams.get('sort') || savedState.sortBy || 'name');
    setSidebarOpen(savedState.sidebarOpen !== false); // Default to true
    
    setIsInitialized(true);
  }, [searchParams, isClient]);

  // Update URL and localStorage when state changes (client-side only)
  useEffect(() => {
    if (!isInitialized || !isClient) return;

    const params = new URLSearchParams();
    
    if (searchTerm) params.set('q', searchTerm);
    if (selectedType) params.set('type', selectedType);
    if (selectedExpansion) params.set('expansion', selectedExpansion);
    if (selectedFaction) params.set('faction', selectedFaction);
    if (selectedRank) params.set('rank', selectedRank);
    if (selectedClass) params.set('class', selectedClass);
    if (showUniqueOnly) params.set('unique', 'true');
    if (showHaveOnly) params.set('have', 'true');
    if (showWantOnly) params.set('want', 'true');
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
      showHaveOnly,
      showWantOnly,
      pointsRange,
      sortBy,
      sidebarOpen
    };
    
    try {
      safeLocalStorage.setItem('searchPageState', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save search state to localStorage:', error);
    }
  }, [searchTerm, selectedType, selectedExpansion, selectedFaction, selectedRank, selectedClass, showUniqueOnly, showHaveOnly, showWantOnly, pointsRange, sortBy, sidebarOpen, isInitialized, isClient]);

  const handleUnitClick = (unitId: string) => {
    router.push(`/list?unitId=${unitId}`);
  };

  // Get unit counts in collections (client-side only)
  const getUnitCounts = (unitId: string) => {
    if (!isClient) {
      return { haveCount: 0, wantCount: 0 };
    }
    
    const haveCollection = JSON.parse(safeLocalStorage.getItem('myHaveCollection') || '[]');
    const wantCollection = JSON.parse(safeLocalStorage.getItem('myWantCollection') || '[]');
    
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
    const existing = JSON.parse(safeLocalStorage.getItem(storageKey) || '[]');
    
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

    // Only save to localStorage if on client side
    if (isClient) {
      safeLocalStorage.setItem(storageKey, JSON.stringify(updated));
    }
    
    // Stop loading
    setLoadingUnits(prev => {
      const newSet = new Set(prev);
      newSet.delete(loadingKey);
      return newSet;
    });
  };

  // Add unit to draft
  const addToDraft = async (unit: Unit, draftId: string) => {
    if (!draftId) return;
    
    const loadingKey = `${unit.id}-draft`;
    setLoadingUnits(prev => new Set([...prev, loadingKey]));
    
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
    
    // Collection filters
    const { haveCount, wantCount } = getUnitCounts(unit.id);
    const matchesHave = !showHaveOnly || haveCount > 0;
    const matchesWant = !showWantOnly || wantCount > 0;
    
    return matchesSearch && matchesType && matchesExpansion && matchesFaction && 
           matchesRank && matchesClass && matchesUnique && matchesPoints && matchesHave && matchesWant;
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

  const exportToCSV = () => {
    const headers = ['Nome', 'Único', 'Expansão', '#', 'Tipo', 'Modo', 'Classe', 'Pontos', 'HP', 'Vent', 'Facção', 'Rank', 'ATK', 'SPD', 'DEF', 'Dano Máx'];
    const rows = filteredUnits.map(unit => [
      unit.name,
      unit.isUnique ? 'Sim' : 'Não',
      unit.expansion,
      unit.collectionNumber,
      unit.type,
      unit.speedMode,
      unit.class,
      unit.points,
      unit.health,
      unit.ventCapacity,
      unit.faction,
      unit.rank,
      unit.maxAttack,
      unit.maxSpeed,
      unit.maxDefense,
      unit.maxDamage,
    ]);

    const escape = (val: unknown) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const csvContent =
      '\uFEFF' + // BOM for Excel UTF-8
      [headers, ...rows].map(row => row.map(escape).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unidades_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSelectedType('');
    setSelectedExpansion('');
    setSelectedFaction('');
    setSelectedRank('');
    setSelectedClass('');
    setShowUniqueOnly(false);
    setShowHaveOnly(false);
    setShowWantOnly(false);
    setPointsRange({ min: '', max: '' });
    setSearchTerm('');
    setSortBy('name');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{background:'#0d1208'}}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">[ CARREGANDO BANCO DE DADOS... ]</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      {/* Filter Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden lg:relative absolute lg:z-auto z-50 h-full`} style={{background:'#0d1208',borderRight:'1px solid #3a4a2a'}}>
        <div className="p-4 h-full overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-semibold tracking-widest uppercase" style={{color:'#c9a84c'}}>Filtros</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 transition-colors"
              style={{color:'#4a5e3a'}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>BUSCAR</label>
            <input
              type="text"
              placeholder="Nome ou variante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}}
            />
          </div>

          {/* Sort By */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>ORDENAR</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="name">Nome</option>
              <option value="points">Pontos</option>
              <option value="faction">Facção</option>
              <option value="type">Tipo</option>
              <option value="expansion">Expansão</option>
              <option value="collectionNumber">Número (#)</option>
            </select>
          </div>
            
          {/* Draft Selection */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>DRAFT</label>
            <select
              value={selectedDraftId}
              onChange={(e) => setSelectedDraftId(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
                <option value="">Selecionar Draft</option>
                {drafts.map(draft => (
                  <option key={draft.id} value={draft.id}>
                    {draft.name} ({draft.results?.length || 0} jogadores)
                  </option>
                ))}
              </select>
            </div>

          {/* Type Filter */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>TIPO</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}>
              <option value="">Todos os tipos</option>
              {uniqueTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>EXPANSÃO</label>
            <select value={selectedExpansion} onChange={(e) => setSelectedExpansion(e.target.value)} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}>
              <option value="">Todas</option>
              {uniqueExpansions.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>FACÇÃO</label>
            <select value={selectedFaction} onChange={(e) => setSelectedFaction(e.target.value)} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}>
              <option value="">Todas</option>
              {uniqueFactions.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>RANK</label>
            <select value={selectedRank} onChange={(e) => setSelectedRank(e.target.value)} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}>
              <option value="">Todos</option>
              {uniqueRanks.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>CLASSE</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}>
              <option value="">Todas</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="mb-3 flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>PTS MIN</label>
              <input type="number" placeholder="0" value={pointsRange.min} onChange={(e) => setPointsRange(prev => ({ ...prev, min: e.target.value }))} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>PTS MAX</label>
              <input type="number" placeholder="999" value={pointsRange.max} onChange={(e) => setPointsRange(prev => ({ ...prev, max: e.target.value }))} className="w-full px-2 py-1.5 text-xs font-mono" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}} />
            </div>
          </div>

          <div className="mb-3 space-y-2">
            <label className="block text-xs font-mono" style={{color:'#5a7a4a'}}>COLEÇÃO</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="uniqueOnly" checked={showUniqueOnly} onChange={(e) => setShowUniqueOnly(e.target.checked)} className="h-3 w-3" style={{accentColor:'#c9a84c'}} />
              <span className="text-xs font-mono" style={{color:'#7a9a5a'}}>Apenas únicos ★</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="haveOnly" checked={showHaveOnly} onChange={(e) => setShowHaveOnly(e.target.checked)} className="h-3 w-3" style={{accentColor:'#7a9a5a'}} />
              <span className="text-xs font-mono" style={{color:'#7a9a5a'}}>Tenho na coleção</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="wantOnly" checked={showWantOnly} onChange={(e) => setShowWantOnly(e.target.checked)} className="h-3 w-3" style={{accentColor:'#7a9a5a'}} />
              <span className="text-xs font-mono" style={{color:'#7a9a5a'}}>Procuro / Quero</span>
            </label>
          </div>

          <button onClick={clearFilters} className="w-full px-3 py-2 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
            LIMPAR FILTROS
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3" style={{background:'rgba(0,0,0,0.5)',borderBottom:'1px solid #3a4a2a'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="p-1 transition-colors" style={{color:'#4a5e3a'}}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <h1 className="text-lg font-bold font-mono tracking-widest uppercase" style={{color:'#e8d5a0'}}>Buscar Unidades</h1>
            </div>
            <div className="text-xs font-mono" style={{color:'#4a5e3a'}}>
              {filteredUnits.length} / {displayUnits.length}
            </div>
          </div>

          {/* Active Filters */}
          {(selectedType || selectedExpansion || selectedFaction || selectedRank || selectedClass || showUniqueOnly || pointsRange.min || pointsRange.max) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedType && <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>TIPO:{selectedType} <button onClick={() => setSelectedType('')} className="ml-1" style={{color:'#c9a84c'}}>×</button></span>}
              {selectedExpansion && <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>EXP:{selectedExpansion} <button onClick={() => setSelectedExpansion('')} className="ml-1" style={{color:'#c9a84c'}}>×</button></span>}
              {selectedFaction && <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>FAC:{selectedFaction} <button onClick={() => setSelectedFaction('')} className="ml-1" style={{color:'#c9a84c'}}>×</button></span>}
              {selectedRank && <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>RANK:{selectedRank} <button onClick={() => setSelectedRank('')} className="ml-1" style={{color:'#c9a84c'}}>×</button></span>}
              {selectedClass && <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>CLASS:{selectedClass} <button onClick={() => setSelectedClass('')} className="ml-1" style={{color:'#c9a84c'}}>×</button></span>}
              {showUniqueOnly && <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>ÚNICOS★ <button onClick={() => setShowUniqueOnly(false)} className="ml-1" style={{color:'#c9a84c'}}>×</button></span>}
              {(pointsRange.min || pointsRange.max) && <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>PTS:{pointsRange.min||'0'}-{pointsRange.max||'∞'} <button onClick={() => setPointsRange({min:'',max:''})} className="ml-1" style={{color:'#c9a84c'}}>×</button></span>}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-3">
          {/* Units Table - Desktop */}
          <div className="hidden lg:block w-full overflow-hidden">
            <div style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
              {/* Table toolbar */}
              <div className="px-4 py-2 flex items-center justify-between" style={{background:'rgba(0,0,0,0.4)',borderBottom:'1px solid #3a4a2a'}}>
                <span className="font-mono text-xs tracking-widest uppercase" style={{color:'#c9a84c'}}>Lista de Unidades — {filteredUnits.length} encontradas</span>
                <div className="flex gap-2">
                  <button onClick={exportToCSV} className="px-3 py-1 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>CSV</button>
                  <button onClick={() => router.push('/drafts')} className="px-3 py-1 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>DRAFTS</button>
                  <button onClick={() => router.push('/my-collection')} className="px-3 py-1 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>COLEÇÃO</button>
                  <button onClick={() => router.push('/cards')} className="px-3 py-1 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>CARTAS</button>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7a9a5a] animate-pulse"></div>
                    <span className="font-mono text-xs" style={{color:'#3a5a2a'}}>ONLINE</span>
                  </div>
                </div>
              </div>

              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <table className="w-full table-fixed">
                  <thead className="sticky top-0 z-10" style={{background:'rgba(10,15,6,0.97)'}}>
                  <tr style={{borderBottom:'1px solid #2a3a1a'}}>
                    <th className="px-1 py-2 text-left text-xs font-mono w-24" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>NOME</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-8" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>EXP</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-6" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>#</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-8" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>TIPO</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-8" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>MODO</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-12" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>CLASSE</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-8" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>PTS</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-6" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>HP</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-6" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>VENT</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-16" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>FAC</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-6" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>ATK</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-6" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>SPD</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-6" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>DEF</th>
                    <th className="px-1 py-2 text-center text-xs font-mono w-20" style={{color:'#5a7a4a'}}>AÇÕES</th>
                  </tr>
                  </thead>
                  <tbody>
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="cursor-pointer transition-colors" style={{borderBottom:'1px solid #1a2a10'}} onClick={() => handleUnitClick(unit.id)} onMouseEnter={e=>(e.currentTarget.style.background='rgba(122,154,90,0.06)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td className="px-1 py-1.5 text-xs font-mono truncate" style={{color:'#e8d5a0',borderRight:'1px solid #1a2a10'}}>{unit.name} {unit.isUnique && "★"}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{unit.expansion}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{unit.collectionNumber}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center capitalize" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{unit.type}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{unit.speedMode}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{unit.class}</td>
                    <td className="px-1 py-1.5 text-xs font-mono font-bold text-center" style={{color:'#c9a84c',borderRight:'1px solid #1a2a10'}}>{unit.points}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center" style={{color:'#e8d5a0',borderRight:'1px solid #1a2a10'}}>{unit.health}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center" style={{color:'#e8d5a0',borderRight:'1px solid #1a2a10'}}>{unit.ventCapacity}</td>
                    <td className="px-1 py-1.5 text-xs font-mono truncate" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{unit.faction}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center" style={{color:'#e8d5a0',borderRight:'1px solid #1a2a10'}}>{unit.maxAttack}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center" style={{color:'#e8d5a0',borderRight:'1px solid #1a2a10'}}>{unit.maxSpeed}</td>
                    <td className="px-1 py-1.5 text-xs font-mono text-center" style={{color:'#e8d5a0',borderRight:'1px solid #1a2a10'}}>{unit.maxDefense}</td>
                    <td className="px-1 py-1.5 text-center">
                      <div className="flex gap-1 justify-center">
                        {(() => {
                          const { haveCount, wantCount } = getUnitCounts(unit.id);
                          const isHaveLoading = loadingUnits.has(`${unit.id}-have`);
                          const isWantLoading = loadingUnits.has(`${unit.id}-want`);
                          const isDraftLoading = loadingUnits.has(`${unit.id}-draft`);
                          return (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); addToCollection(unit, 'have'); }} disabled={isHaveLoading} className="text-xs font-mono px-1 py-0.5 transition-colors disabled:opacity-50" style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}} title="Tenho">
                                {isHaveLoading ? '...' : `T${haveCount}`}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); addToCollection(unit, 'want'); }} disabled={isWantLoading} className="text-xs font-mono px-1 py-0.5 transition-colors disabled:opacity-50" style={{background:'rgba(201,168,76,0.1)',border:'1px solid #c9a84c44',color:'#c9a84c'}} title="Procuro">
                                {isWantLoading ? '...' : `P${wantCount}`}
                              </button>
                              {selectedDraftId && (
                                <button onClick={(e) => { e.stopPropagation(); addToDraft(unit, selectedDraftId); }} disabled={isDraftLoading} className="text-xs font-mono px-1 py-0.5 transition-colors disabled:opacity-50" style={{background:'rgba(100,80,150,0.15)',border:'1px solid #5a4a8a44',color:'#a08ad4'}} title="Draft">
                                  {isDraftLoading ? '...' : 'D'}
                                </button>
                              )}
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
              
              <div className="px-4 py-2" style={{borderTop:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <p className="text-xs font-mono text-center" style={{color:'#3a5a2a'}}>{filteredUnits.length} / {displayUnits.length} UNIDADES</p>
              </div>
            </div>
          </div>

          {/* Units Cards - Mobile */}
          <div className="w-full lg:hidden">
            <div className="space-y-2">
              {filteredUnits.map((unit) => (
                <div key={unit.id} className="p-3 cursor-pointer corner-clip-sm" style={{background:'#0d1208',border:'1px solid #3a4a2a'}} onClick={() => handleUnitClick(unit.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-mono font-bold" style={{color:'#e8d5a0'}}>{unit.name} {unit.isUnique && "★"}</h3>
                      <p className="text-xs font-mono capitalize" style={{color:'#5a7a4a'}}>{unit.type} / {unit.speedMode} / {unit.faction}</p>
                      <p className="text-xs font-mono" style={{color:'#3a5a2a'}}>{unit.expansion} #{unit.collectionNumber}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-sm" style={{color:'#c9a84c'}}>{unit.points} pts</div>
                      <span className="text-xs font-mono" style={{color:'#5a7a4a'}}>{unit.rank}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-xs font-mono" style={{color:'#5a7a4a'}}>
                    <div>HP:<span style={{color:'#e8d5a0'}}>{unit.health}</span></div>
                    <div>ATK:<span style={{color:'#e8d5a0'}}>{unit.maxAttack}</span></div>
                    <div>DEF:<span style={{color:'#e8d5a0'}}>{unit.maxDefense}</span></div>
                    <div>SPD:<span style={{color:'#e8d5a0'}}>{unit.maxSpeed}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {filteredUnits.length === 0 && displayUnits.length > 0 && (
            <div className="text-center mt-8 font-mono text-xs" style={{color:'#3a5a2a'}}>[ NENHUMA UNIDADE COM OS FILTROS APLICADOS ]</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{background:'#0d1208'}}>
        <div className="font-mono text-[#7a9a5a] tracking-widest animate-pulse">[ INICIALIZANDO... ]</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
