'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { safeLocalStorage } from '@/lib/storage'
import { useT } from '@/hooks/useT'
import { getCardCollection, removeCardFromCollection, MyCard, CARD_TYPE_ROUTES, CARD_TYPE_LABELS } from '@/lib/cardCollection'
import { apiService } from '@/lib/api'

type ListType = "have" | "want";

interface MyUnit {
  id: string;
  name: string;
  points: number;
  faction: string;
  type: string;
  quantity: number;
  expansion?: string;
  collectionNumber?: string;
}

export default function MyCollection() {
  const router = useRouter()
  const t = useT()
  const [haveUnits, setHaveUnits] = useState<MyUnit[]>([]);
  const [wantUnits, setWantUnits] = useState<MyUnit[]>([]);
  const [haveCards, setHaveCards] = useState<MyCard[]>([]);
  const [wantCards, setWantCards] = useState<MyCard[]>([]);
  const [currentListType] = useState<ListType>("have");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('');
  const [selectedUnitCollection, setSelectedUnitCollection] = useState<'' | 'have' | 'want'>('');
  const [sortBy, setSortBy] = useState('name');
  const [cardSearchTerm, setCardSearchTerm] = useState('');
  const [selectedCardType, setSelectedCardType] = useState('');
  const [selectedCardCollection, setSelectedCardCollection] = useState<'' | 'have' | 'want'>('');
  const [isClient, setIsClient] = useState(false);
  const [apiTotalUnits, setApiTotalUnits] = useState<number | null>(null);
  const [apiTotalCards, setApiTotalCards] = useState<number | null>(null);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load collections from localStorage (client-side only)
  useEffect(() => {
    if (!isClient) return;
    
    const savedHave = safeLocalStorage.getItem('myHaveCollection');
    const savedWant = safeLocalStorage.getItem('myWantCollection');
    
    if (savedHave) {
      try {
        setHaveUnits(JSON.parse(savedHave));
      } catch (error) {
        console.error('Error loading have collection:', error);
      }
    }
    
    if (savedWant) {
      try {
        setWantUnits(JSON.parse(savedWant));
      } catch (error) {
        console.error('Error loading want collection:', error);
      }
    }

    setHaveCards(getCardCollection('have'));
    setWantCards(getCardCollection('want'));
  }, [isClient]);

  // Fetch catalog-wide totals from the API so the header shows how much of the
  // full card/unit pool the player has, not just how many entries are in localStorage.
  useEffect(() => {
    if (!isClient) return;

    apiService.getAllUnits()
      .then(units => setApiTotalUnits(units.length))
      .catch(err => console.error('Error fetching total units:', err));

    Promise.all([
      apiService.getFactionPrides({ limit: 1 }),
      apiService.getMercenaryContracts({ limit: 1 }),
      apiService.getSituationalAlliances({ limit: 1 }),
      apiService.getPilots({ limit: 1 }),
      apiService.getGears({ limit: 1 }),
      apiService.getPlanetaryConditions({ limit: 1 }),
      apiService.getMissions({ limit: 1 }),
    ])
      .then(results => setApiTotalCards(results.reduce((sum, r) => sum + r.total, 0)))
      .catch(err => console.error('Error fetching total cards:', err));
  }, [isClient]);

  // Save collections to localStorage
  const saveHaveCollection = (newCollection: MyUnit[]) => {
    setHaveUnits(newCollection);
    if (isClient) {
      safeLocalStorage.setItem('myHaveCollection', JSON.stringify(newCollection));
    }
  };

  const saveWantCollection = (newCollection: MyUnit[]) => {
    setWantUnits(newCollection);
    if (isClient) {
      safeLocalStorage.setItem('myWantCollection', JSON.stringify(newCollection));
    }
  };

  // Get current collection based on list type
  // const getCurrentCollection = () => currentListType === "have" ? haveUnits : wantUnits;
  const saveCurrentCollection = (newCollection: MyUnit[]) => {
    if (currentListType === "have") {
      saveHaveCollection(newCollection);
    } else {
      saveWantCollection(newCollection);
    }
  };

  // Export collection to JSON file
  const exportCollection = async () => {
    try {
      const collectionData = {
        exportDate: new Date().toISOString(),
        version: "2.0",
        haveCollection: haveUnits,
        wantCollection: wantUnits,
        summary: {
          haveUnits: haveUnits.length,
          wantUnits: wantUnits.length,
          havePoints: haveUnits.reduce((sum, unit) => sum + (unit.points * unit.quantity), 0),
          wantPoints: wantUnits.reduce((sum, unit) => sum + (unit.points * unit.quantity), 0),
          uniqueHaveTypes: new Set(haveUnits.map(u => u.type)).size,
          uniqueWantTypes: new Set(wantUnits.map(u => u.type)).size
        }
      };

      const dataStr = JSON.stringify(collectionData, null, 2);

      try {
        // Check if File System Access API is supported
        if ('showSaveFilePicker' in window) {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: `minha-colecao-${new Date().toISOString().split('T')[0]}.json`,
            types: [{
              description: 'JSON files',
              accept: { 'application/json': ['.json'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(dataStr);
          await writable.close();
          
          alert('Coleção exportada com sucesso!');
        } else {
          // Fallback to traditional download
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `minha-colecao-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          alert('Coleção exportada com sucesso!');
        }
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          // User cancelled the save dialog
          return;
        }
        
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(dataStr).then(() => {
          alert('Não foi possível baixar o arquivo. Os dados foram copiados para a área de transferência. Cole em um arquivo .json manualmente.');
        }).catch(() => {
          // Show data in new window as final fallback
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(`<pre>${dataStr}</pre>`);
            newWindow.document.title = 'Dados da Coleção - Copie e salve como .json';
          }
          alert('Não foi possível baixar automaticamente. Os dados foram abertos em uma nova janela. Copie e salve como arquivo .json');
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Erro ao exportar coleção. Verifique o console para mais detalhes.');
    }
  };

  // Import collection from JSON file
  const importCollection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        // Check for new format (v2.0) with separate have/want collections
        if (importedData.version === "2.0" && importedData.haveCollection && importedData.wantCollection) {
          console.log('Detected v2.0 format');
          console.log('Have collection:', importedData.haveCollection);
          console.log('Want collection:', importedData.wantCollection);
          
          // Remove 'owned' property from units if it exists (legacy cleanup)
          const cleanHaveCollection = importedData.haveCollection.map((unit: Record<string, unknown>) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { owned, ...cleanUnit } = unit;
            return cleanUnit;
          });
          
          const cleanWantCollection = importedData.wantCollection.map((unit: Record<string, unknown>) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { owned, ...cleanUnit } = unit;
            return cleanUnit;
          });

          console.log('About to import directly (skipping confirmation for now)');
          console.log('Starting import process...');
          console.log('Before save - haveUnits:', haveUnits.length);
          console.log('Before save - wantUnits:', wantUnits.length);
          
          saveHaveCollection(cleanHaveCollection);
          saveWantCollection(cleanWantCollection);
          
          console.log('After save - haveUnits:', haveUnits.length);
          console.log('After save - wantUnits:', wantUnits.length);
          console.log('localStorage have:', isClient ? JSON.parse(safeLocalStorage.getItem('myHaveCollection') || '[]').length : 0);
          console.log('localStorage want:', isClient ? JSON.parse(safeLocalStorage.getItem('myWantCollection') || '[]').length : 0);
          
          console.log('Import completed');
          
          alert(`Coleção importada com sucesso!\nHave: ${cleanHaveCollection.length} tipos\nWant: ${cleanWantCollection.length} tipos\n\nRecarregando página...`);
          
          // Force re-render by reloading page
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
        // Legacy format (v1.0) - import to current list type
        else if (importedData.collection && Array.isArray(importedData.collection)) {
          const shouldImport = window.confirm(
            `Importar ${importedData.collection.length} unidades para lista "${currentListType === 'have' ? 'Tenho' : 'Procuro'}"?\n\n` +
            `Isso substituirá completamente sua lista atual.\n` +
            `Deseja continuar?`
          );

          if (shouldImport) {
            saveCurrentCollection(importedData.collection);
            alert(`Lista "${currentListType === 'have' ? 'Tenho' : 'Procuro'}" importada com sucesso!\n${importedData.collection.length} unidades carregadas.`);
          }
        } else {
          console.log('Imported data structure:', importedData);
          alert('Arquivo JSON inválido. Verifique o formato do arquivo.\n\nFormatos aceitos:\n- v2.0: {version: "2.0", haveCollection: [...], wantCollection: [...]}\n- v1.0: {collection: [...]}');
        }
      } catch (error) {
        alert('Erro ao ler o arquivo. Verifique se é um arquivo JSON válido.');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
    // Reset input value to allow importing the same file again
    event.target.value = '';
  };

  // Remove unit from collection
  const removeFromCollection = (unitId: string, listType: ListType) => {
    if (listType === "have") {
      saveHaveCollection(haveUnits.filter(unit => unit.id !== unitId));
    } else {
      saveWantCollection(wantUnits.filter(unit => unit.id !== unitId));
    }
  };

  const removeFromAllLists = (unitId: string) => {
    saveHaveCollection(haveUnits.filter(unit => unit.id !== unitId));
    saveWantCollection(wantUnits.filter(unit => unit.id !== unitId));
  };

  // Remove a card from a collection list ('have'/'want'), or both when listType is omitted
  const removeCard = (cardId: string, listType?: ListType) => {
    if (!listType || listType === 'have') setHaveCards(removeCardFromCollection(cardId, 'have'));
    if (!listType || listType === 'want') setWantCards(removeCardFromCollection(cardId, 'want'));
  };

  // Get all unique units for display (merge have and want by ID)
  const allUnitsMap = new Map<string, MyUnit & { haveQuantity: number; wantQuantity: number }>();
  
  // Add have units
  haveUnits.forEach(unit => {
    allUnitsMap.set(unit.id, {
      ...unit,
      haveQuantity: unit.quantity,
      wantQuantity: 0
    });
  });
  
  // Add want units (merge if already exists)
  wantUnits.forEach(unit => {
    const existing = allUnitsMap.get(unit.id);
    if (existing) {
      existing.wantQuantity = unit.quantity;
    } else {
      allUnitsMap.set(unit.id, {
        ...unit,
        haveQuantity: 0,
        wantQuantity: unit.quantity
      });
    }
  });
  
  const allUnits = Array.from(allUnitsMap.values());
  const uniqueTypes = [...new Set(allUnits.map(unit => unit.type))].sort();
  const uniqueFactions = [...new Set(allUnits.map(unit => unit.faction))].sort();
  const uniqueExpansions = [...new Set(allUnits.map(unit => unit.expansion).filter((x): x is string => !!x))].sort();

  // Filter and sort units
  const filteredUnits = allUnits.filter(unit => {
    const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || unit.type === selectedType;
    const matchesFaction = !selectedFaction || unit.faction === selectedFaction;
    const matchesExpansion = !selectedExpansion || unit.expansion === selectedExpansion;
    const matchesCollection = !selectedUnitCollection
      || (selectedUnitCollection === 'have' && unit.haveQuantity > 0)
      || (selectedUnitCollection === 'want' && unit.wantQuantity > 0);

    return matchesSearch && matchesType && matchesFaction && matchesExpansion && matchesCollection;
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
      case 'number':
        return (a.collectionNumber || '').localeCompare(b.collectionNumber || '', undefined, { numeric: true });
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedFaction('');
    setSelectedExpansion('');
    setSelectedUnitCollection('');
    setSortBy('name');
  };

  // Get all unique cards for display (merge have and want by id)
  const allCardsMap = new Map<string, MyCard & { haveQuantity: number; wantQuantity: number }>();
  haveCards.forEach(card => {
    allCardsMap.set(card.id, { ...card, haveQuantity: card.quantity, wantQuantity: 0 });
  });
  wantCards.forEach(card => {
    const existing = allCardsMap.get(card.id);
    if (existing) {
      existing.wantQuantity = card.quantity;
    } else {
      allCardsMap.set(card.id, { ...card, haveQuantity: 0, wantQuantity: card.quantity });
    }
  });
  const allCards = Array.from(allCardsMap.values());
  const uniqueCardTypes = [...new Set(allCards.map(c => c.cardType))].sort();

  const filteredCards = allCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(cardSearchTerm.toLowerCase());
    const matchesType = !selectedCardType || card.cardType === selectedCardType;
    const matchesCollection = !selectedCardCollection
      || (selectedCardCollection === 'have' && card.haveQuantity > 0)
      || (selectedCardCollection === 'want' && card.wantQuantity > 0);
    return matchesSearch && matchesType && matchesCollection;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const clearCardFilters = () => {
    setCardSearchTerm('');
    setSelectedCardType('');
    setSelectedCardCollection('');
  };

  return (
    <div className="flex h-screen" style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden lg:relative absolute lg:z-auto z-50 h-full`} style={{background:'#0d1208',borderRight:'1px solid #3a4a2a'}}>
        <div className="p-4 h-full overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-semibold tracking-widest uppercase" style={{color:'#c9a84c'}}>{t('home.myCollection')}</h2>
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

          {/* Collection Stats */}
          <div className="mb-6 space-y-2">
            <div className="p-3 corner-clip-sm" style={{background:'rgba(122,154,90,0.1)',border:'1px solid #3a4a2a'}}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono" style={{color:'#7a9a5a'}}>{t('myCollectionUI.colHave')}</span>
                <span className="text-lg font-bold font-mono" style={{color:'#c9a84c'}}>{haveUnits.length}</span>
              </div>
              <div className="text-xs font-mono mt-1" style={{color:'#4a5e3a'}}>
                {haveUnits.reduce((sum, unit) => sum + (unit.points * unit.quantity), 0)} {t('cardDetail.pts')} · {haveCards.length} {t('myCollectionUI.cardsCount')}
              </div>
            </div>
            <div className="p-3 corner-clip-sm" style={{background:'rgba(201,168,76,0.08)',border:'1px solid #3a4a2a'}}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono" style={{color:'#7a9a5a'}}>{t('myCollectionUI.colWant')}</span>
                <span className="text-lg font-bold font-mono" style={{color:'#c9a84c'}}>{wantUnits.length}</span>
              </div>
              <div className="text-xs font-mono mt-1" style={{color:'#4a5e3a'}}>
                {wantUnits.reduce((sum, unit) => sum + (unit.points * unit.quantity), 0)} {t('cardDetail.pts')} · {wantCards.length} {t('myCollectionUI.cardsCount')}
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('myCollectionUI.searchLabel')}</label>
            <input
              type="text"
              placeholder={t('myCollectionUI.searchUnitPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}}
            />
          </div>

          {/* Sort By */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('myCollectionUI.sortLabel')}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="name">{t('myCollectionUI.sortByName')}</option>
              <option value="points">{t('myCollectionUI.sortByPointsAsc')}</option>
              <option value="pointsDesc">{t('myCollectionUI.sortByPointsDesc')}</option>
              <option value="faction">{t('myCollectionUI.sortByFaction')}</option>
              <option value="type">{t('myCollectionUI.sortByType')}</option>
              <option value="number">{t('search.sortNumber')}</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('myCollectionUI.typeLabel')}</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">{t('myCollectionUI.allTypes')}</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
          </div>

          {/* Faction Filter */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('cardsUI.faction')}</label>
            <select
              value={selectedFaction}
              onChange={(e) => setSelectedFaction(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">{t('myCollectionUI.allFactions')}</option>
              {uniqueFactions.map(faction => (
                <option key={faction} value={faction}>{faction}</option>
              ))}
            </select>
          </div>

          {/* Expansion Filter */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('cardsUI.expansion')}</label>
            <select
              value={selectedExpansion}
              onChange={(e) => setSelectedExpansion(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">{t('cardsUI.allF')}</option>
              {uniqueExpansions.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>

          {/* Collection Filter */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>{t('myCollectionUI.collectionLabel')}</label>
            <select
              value={selectedUnitCollection}
              onChange={(e) => setSelectedUnitCollection(e.target.value as '' | 'have' | 'want')}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">{t('myCollectionUI.collectionBoth')}</option>
              <option value="have">{t('myCollectionUI.collectionHaveOnly')}</option>
              <option value="want">{t('myCollectionUI.collectionWantOnly')}</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="w-full px-3 py-2 font-mono text-xs mb-3 corner-clip-sm transition-colors"
            style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
          >
            {t('cardsUI.clearFilters')}
          </button>

          {/* Import/Export Controls */}
          <div className="pt-3" style={{borderTop:'1px solid #2a3a1a'}}>
            <h3 className="text-xs font-mono mb-2" style={{color:'#4a5e3a'}}>{t('myCollectionUI.manage')}</h3>
            <div className="space-y-2">
              <button
                onClick={exportCollection}
                disabled={haveUnits.length === 0 && wantUnits.length === 0}
                className="w-full px-3 py-2 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
              >
                {t('myCollectionUI.exportJson')}
              </button>
              
              <label className="w-full px-3 py-2 font-mono text-xs corner-clip-sm transition-colors cursor-pointer block text-center" style={{background:'rgba(201,168,76,0.1)',border:'1px solid #c9a84c55',color:'#c9a84c'}}>
                {t('myCollectionUI.importJson')}
                <input
                  type="file"
                  accept=".json"
                  onChange={importCollection}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 flex items-center justify-between" style={{background:'rgba(0,0,0,0.5)',borderBottom:'1px solid #3a4a2a'}}>
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 transition-colors"
                style={{color:'#4a5e3a'}}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <button onClick={() => router.push('/')} className="font-mono text-xs tracking-widest uppercase transition-colors" style={{color:'#4a5e3a'}} onMouseEnter={e => (e.currentTarget.style.color='#c9a84c')} onMouseLeave={e => (e.currentTarget.style.color='#4a5e3a')}>
                {t('common.backToHome')}
              </button>
              <span style={{color:'#2a3a1a'}}>|</span>
            <h1 className="text-lg font-bold font-mono tracking-widest uppercase" style={{color:'#e8d5a0'}}>{t('home.myCollection')}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono" style={{color:'#4a5e3a'}}>
            <span>{filteredUnits.length} / {apiTotalUnits ?? '...'} {t('myCollectionUI.unitsLabel')}</span>
            <span style={{color:'#2a3a1a'}}>|</span>
            <span>{filteredCards.length} / {apiTotalCards ?? '...'} {t('myCollectionUI.cardsLabel')}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4">
          {/* Units Table - Desktop */}
          <div className="hidden lg:block w-full overflow-hidden">
            <div style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
              {/* Table Header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{background:'rgba(0,0,0,0.4)',borderBottom:'1px solid #3a4a2a'}}>
                <span className="font-mono text-sm tracking-widest uppercase" style={{color:'#c9a84c'}}>{t('home.myCollection')}</span>
                <span className="font-mono text-xs" style={{color:'#4a5e3a'}}>{filteredUnits.length} {t('myCollectionUI.unitsCount')}</span>
              </div>

              <div>
                <table className="w-full table-fixed">
                  <thead>
                    <tr style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        {t('myCollectionUI.colName')}
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        {t('myCollectionUI.collectionLabel')}
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        #
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        {t('myCollectionUI.colType')}
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        {t('cardsUI.colFaction')}
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        {t('cardsUI.colPts')}
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        {t('myCollectionUI.colHave')}
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        {t('myCollectionUI.colWant')}
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        {t('myCollectionUI.colActions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.map((unit) => {
                      return (
                        <tr key={unit.id} className="transition-colors" style={{borderBottom:'1px solid #1a2a10'}} onMouseEnter={e=>(e.currentTarget.style.background='rgba(122,154,90,0.06)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                          <td className="px-4 py-2">
                            <div className="text-xs font-mono" style={{color:'#e8d5a0'}}>
                              {unit.name}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-center" style={{color:'#7a9a5a'}}>
                            {unit.expansion || '-'}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-center" style={{color:'#7a9a5a'}}>
                            {unit.collectionNumber || '-'}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-center capitalize" style={{color:'#7a9a5a'}}>
                            {unit.type}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-center" style={{color:'#7a9a5a'}}>
                            {unit.faction}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono font-bold text-center" style={{color:'#c9a84c'}}>
                            {unit.points}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono font-bold text-center" style={{color:'#7a9a5a'}}>
                            {unit.haveQuantity}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono font-bold text-center" style={{color:'#7a9a5a'}}>
                            {unit.wantQuantity}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center gap-1">
                              {unit.haveQuantity > 0 && (
                                <button
                                  onClick={() => removeFromCollection(unit.id, "have")}
                                  className="px-2 py-0.5 text-xs font-mono transition-colors"
                                  style={{background:'rgba(150,50,50,0.2)',border:'1px solid #5a2a2a',color:'#c06060'}}
                                  title={t('myCollectionUI.removeHaveTitle')}
                                >
                                  -{t('myCollectionUI.colHave')}
                                </button>
                              )}
                              {unit.wantQuantity > 0 && (
                                <button
                                  onClick={() => removeFromCollection(unit.id, "want")}
                                  className="px-2 py-0.5 text-xs font-mono transition-colors"
                                  style={{background:'rgba(150,100,50,0.2)',border:'1px solid #5a3a1a',color:'#c09060'}}
                                  title={t('myCollectionUI.removeWantTitle')}
                                >
                                  -{t('myCollectionUI.colWant')}
                                </button>
                              )}
                              <button
                                onClick={() => removeFromAllLists(unit.id)}
                                className="px-2 py-0.5 text-xs font-mono transition-colors"
                                style={{background:'rgba(100,50,50,0.2)',border:'1px solid #4a1a1a',color:'#a05050'}}
                                title={t('myCollectionUI.removeAllTitle')}
                              >
                                {t('myCollectionUI.del')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2" style={{borderTop:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <p className="text-xs font-mono text-center" style={{color:'#3a5a2a'}}>
                  {filteredUnits.length} / {apiTotalUnits ?? '...'} {t('myCollectionUI.unitsLabel')}
                </p>
              </div>
            </div>
          </div>

          {/* Units Cards - Mobile */}
          <div className="w-full lg:hidden">
            <div className="space-y-2">
              {filteredUnits.map((unit) => {
                return (
                  <div key={unit.id} className="p-3 corner-clip-sm" style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-mono font-bold mb-0.5" style={{color:'#e8d5a0'}}>
                          {unit.name}
                        </h3>
                        <p className="text-xs font-mono capitalize" style={{color:'#5a7a4a'}}>
                          {unit.type} / {unit.faction}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono" style={{color:'#c9a84c'}}>{unit.points} {t('cardDetail.pts')}</div>
                        <div className="text-xs font-mono" style={{color:'#4a5e3a'}}>
                          T:{unit.haveQuantity} P:{unit.wantQuantity}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 flex-wrap">
                        {unit.haveQuantity > 0 && (
                          <button onClick={() => removeFromCollection(unit.id, 'have')} className="px-2 py-0.5 text-xs font-mono" style={{background:'rgba(150,50,50,0.2)',border:'1px solid #5a2a2a',color:'#c06060'}}>-{t('myCollectionUI.colHave')}</button>
                        )}
                        {unit.wantQuantity > 0 && (
                          <button onClick={() => removeFromCollection(unit.id, 'want')} className="px-2 py-0.5 text-xs font-mono" style={{background:'rgba(150,100,50,0.2)',border:'1px solid #5a3a1a',color:'#c09060'}}>-{t('myCollectionUI.colWant')}</button>
                        )}
                        <button onClick={() => removeFromAllLists(unit.id)} className="px-2 py-0.5 text-xs font-mono" style={{background:'rgba(100,50,50,0.2)',border:'1px solid #4a1a1a',color:'#a05050'}}>{t('myCollectionUI.del')}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {filteredUnits.length === 0 && allUnits.length > 0 && (
            <div className="text-center mt-8 font-mono text-xs" style={{color:'#3a5a2a'}}>{t('myCollectionUI.noUnitsFiltered')}</div>
          )}
          {allUnits.length === 0 && (
            <div className="text-center mt-8">
              <p className="font-mono text-sm mb-2" style={{color:'#c9a84c'}}>{t('myCollectionUI.emptyCollectionTitle')}</p>
              <p className="font-mono text-xs" style={{color:'#3a5a2a'}}>{t('myCollectionUI.emptyCollectionDesc')}</p>
            </div>
          )}

          {/* Cards Section */}
          <div className="mt-8 pt-6" style={{borderTop:'1px solid #2a3a1a'}}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-mono font-bold tracking-widest uppercase" style={{color:'#e8d5a0'}}>{t('myCollectionUI.cardsHeader')}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder={t('myCollectionUI.searchCardPlaceholder')}
                  value={cardSearchTerm}
                  onChange={(e) => setCardSearchTerm(e.target.value)}
                  className="px-2 py-1.5 text-xs font-mono"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}}
                />
                <select
                  value={selectedCardType}
                  onChange={(e) => setSelectedCardType(e.target.value)}
                  className="px-2 py-1.5 text-xs font-mono"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
                >
                  <option value="">{t('myCollectionUI.allTypes')}</option>
                  {uniqueCardTypes.map(ct => <option key={ct} value={ct}>{CARD_TYPE_LABELS[ct] || ct}</option>)}
                </select>
                <select
                  value={selectedCardCollection}
                  onChange={(e) => setSelectedCardCollection(e.target.value as '' | 'have' | 'want')}
                  className="px-2 py-1.5 text-xs font-mono"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
                >
                  <option value="">{t('myCollectionUI.collectionBoth')}</option>
                  <option value="have">{t('myCollectionUI.collectionHaveOnly')}</option>
                  <option value="want">{t('myCollectionUI.collectionWantOnly')}</option>
                </select>
                <button onClick={clearCardFilters} className="px-3 py-1.5 font-mono text-xs corner-clip-sm transition-colors" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>
                  {t('myCollectionUI.clear')}
                </button>
              </div>
            </div>

            {/* Cards Table - Desktop */}
            <div className="hidden lg:block w-full overflow-hidden">
              <div style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
                {/* Table Header */}
                <div className="px-4 py-3 flex items-center justify-between" style={{background:'rgba(0,0,0,0.4)',borderBottom:'1px solid #3a4a2a'}}>
                  <span className="font-mono text-sm tracking-widest uppercase" style={{color:'#c9a84c'}}>{t('myCollectionUI.myCards')}</span>
                  <span className="font-mono text-xs" style={{color:'#4a5e3a'}}>{filteredCards.length} {t('myCollectionUI.cardsCount')}</span>
                </div>
                <table className="w-full table-fixed">
                  <thead>
                    <tr style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>{t('myCollectionUI.colName')}</th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>{t('myCollectionUI.colType')}</th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>{t('myCollectionUI.colExpansion')}</th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>#</th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>{t('myCollectionUI.colHave')}</th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>{t('myCollectionUI.colWant')}</th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>{t('myCollectionUI.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.map((card) => (
                      <tr
                        key={card.id}
                        className="cursor-pointer transition-colors"
                        style={{borderBottom:'1px solid #1a2a10'}}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(122,154,90,0.06)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                        onClick={() => router.push(`${CARD_TYPE_ROUTES[card.cardType] || '/cards'}?id=${card.id}`)}
                      >
                        <td className="px-4 py-2">
                          <div className="text-xs font-mono" style={{color:'#e8d5a0'}}>{card.name}</div>
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-center" style={{color:'#7a9a5a'}}>{CARD_TYPE_LABELS[card.cardType] || card.cardType}</td>
                        <td className="px-4 py-2 text-xs font-mono text-center" style={{color:'#7a9a5a'}}>{card.expansion || '-'}</td>
                        <td className="px-4 py-2 text-xs font-mono text-center" style={{color:'#7a9a5a'}}>{card.collectionNumber || '-'}</td>
                        <td className="px-4 py-2 text-xs font-mono font-bold text-center" style={{color:'#7a9a5a'}}>{card.haveQuantity}</td>
                        <td className="px-4 py-2 text-xs font-mono font-bold text-center" style={{color:'#7a9a5a'}}>{card.wantQuantity}</td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-1" onClick={e => e.stopPropagation()}>
                            {card.haveQuantity > 0 && (
                              <button onClick={() => removeCard(card.id, 'have')} className="px-2 py-0.5 text-xs font-mono transition-colors" style={{background:'rgba(150,50,50,0.2)',border:'1px solid #5a2a2a',color:'#c06060'}} title={t('myCollectionUI.removeHaveTitle')}>-{t('myCollectionUI.colHave')}</button>
                            )}
                            {card.wantQuantity > 0 && (
                              <button onClick={() => removeCard(card.id, 'want')} className="px-2 py-0.5 text-xs font-mono transition-colors" style={{background:'rgba(150,100,50,0.2)',border:'1px solid #5a3a1a',color:'#c09060'}} title={t('myCollectionUI.removeWantTitle')}>-{t('myCollectionUI.colWant')}</button>
                            )}
                            <button onClick={() => removeCard(card.id)} className="px-2 py-0.5 text-xs font-mono transition-colors" style={{background:'rgba(100,50,50,0.2)',border:'1px solid #4a1a1a',color:'#a05050'}} title={t('myCollectionUI.removeAllTitle')}>{t('myCollectionUI.del')}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2" style={{borderTop:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                  <p className="text-xs font-mono text-center" style={{color:'#3a5a2a'}}>{filteredCards.length} / {apiTotalCards ?? '...'} {t('myCollectionUI.cardsLabel')}</p>
                </div>
              </div>
            </div>

            {/* Cards - Mobile */}
            <div className="w-full lg:hidden">
              <div className="space-y-2">
                {filteredCards.map((card) => (
                  <div key={card.id} className="p-3 corner-clip-sm cursor-pointer" onClick={() => router.push(`${CARD_TYPE_ROUTES[card.cardType] || '/cards'}?id=${card.id}`)} style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-mono font-bold mb-0.5" style={{color:'#e8d5a0'}}>{card.name}</h3>
                        <p className="text-xs font-mono" style={{color:'#5a7a4a'}}>{CARD_TYPE_LABELS[card.cardType] || card.cardType} / {card.expansion}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono" style={{color:'#4a5e3a'}}>T:{card.haveQuantity} P:{card.wantQuantity}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                      {card.haveQuantity > 0 && (
                        <button onClick={() => removeCard(card.id, 'have')} className="px-2 py-0.5 text-xs font-mono" style={{background:'rgba(150,50,50,0.2)',border:'1px solid #5a2a2a',color:'#c06060'}}>-{t('myCollectionUI.colHave')}</button>
                      )}
                      {card.wantQuantity > 0 && (
                        <button onClick={() => removeCard(card.id, 'want')} className="px-2 py-0.5 text-xs font-mono" style={{background:'rgba(150,100,50,0.2)',border:'1px solid #5a3a1a',color:'#c09060'}}>-{t('myCollectionUI.colWant')}</button>
                      )}
                      <button onClick={() => removeCard(card.id)} className="px-2 py-0.5 text-xs font-mono" style={{background:'rgba(100,50,50,0.2)',border:'1px solid #4a1a1a',color:'#a05050'}}>{t('myCollectionUI.del')}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filteredCards.length === 0 && allCards.length > 0 && (
              <div className="text-center mt-4 font-mono text-xs" style={{color:'#3a5a2a'}}>{t('myCollectionUI.noCardsFiltered')}</div>
            )}
            {allCards.length === 0 && (
              <div className="text-center mt-4">
                <p className="font-mono text-xs" style={{color:'#3a5a2a'}}>{t('myCollectionUI.noCardsYet')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
