'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { safeLocalStorage } from '@/lib/storage'

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
  const [haveUnits, setHaveUnits] = useState<MyUnit[]>([]);
  const [wantUnits, setWantUnits] = useState<MyUnit[]>([]);
  const [currentListType] = useState<ListType>("have");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isClient, setIsClient] = useState(false);

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

  // Filter and sort units
  const filteredUnits = allUnits.filter(unit => {
    const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || unit.type === selectedType;
    const matchesFaction = !selectedFaction || unit.faction === selectedFaction;
    
    return matchesSearch && matchesType && matchesFaction;
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
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedFaction('');
    setSortBy('name');
  };

  return (
    <div className="flex h-screen" style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden lg:relative absolute lg:z-auto z-50 h-full`} style={{background:'#0d1208',borderRight:'1px solid #3a4a2a'}}>
        <div className="p-4 h-full overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-semibold tracking-widest uppercase" style={{color:'#c9a84c'}}>Minha Coleção</h2>
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
                <span className="text-xs font-mono" style={{color:'#7a9a5a'}}>TENHO</span>
                <span className="text-lg font-bold font-mono" style={{color:'#c9a84c'}}>{haveUnits.length}</span>
              </div>
              <div className="text-xs font-mono mt-1" style={{color:'#4a5e3a'}}>
                {haveUnits.reduce((sum, unit) => sum + (unit.points * unit.quantity), 0)} pts
              </div>
            </div>
            <div className="p-3 corner-clip-sm" style={{background:'rgba(201,168,76,0.08)',border:'1px solid #3a4a2a'}}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono" style={{color:'#7a9a5a'}}>PROCURO</span>
                <span className="text-lg font-bold font-mono" style={{color:'#c9a84c'}}>{wantUnits.length}</span>
              </div>
              <div className="text-xs font-mono mt-1" style={{color:'#4a5e3a'}}>
                {wantUnits.reduce((sum, unit) => sum + (unit.points * unit.quantity), 0)} pts
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>BUSCAR</label>
            <input
              type="text"
              placeholder="Nome da unidade..."
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
              <option value="name">Nome (A-Z)</option>
              <option value="points">Pontos (menor)</option>
              <option value="pointsDesc">Pontos (maior)</option>
              <option value="faction">Facção</option>
              <option value="type">Tipo</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>TIPO</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">Todos os tipos</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
          </div>

          {/* Faction Filter */}
          <div className="mb-3">
            <label className="block text-xs font-mono mb-1" style={{color:'#5a7a4a'}}>FACÇÃO</label>
            <select
              value={selectedFaction}
              onChange={(e) => setSelectedFaction(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">Todas as facções</option>
              {uniqueFactions.map(faction => (
                <option key={faction} value={faction}>{faction}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="w-full px-3 py-2 font-mono text-xs mb-3 corner-clip-sm transition-colors"
            style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
          >
            LIMPAR FILTROS
          </button>

          {/* Import/Export Controls */}
          <div className="pt-3" style={{borderTop:'1px solid #2a3a1a'}}>
            <h3 className="text-xs font-mono mb-2" style={{color:'#4a5e3a'}}>GERENCIAR</h3>
            <div className="space-y-2">
              <button
                onClick={exportCollection}
                disabled={haveUnits.length === 0 && wantUnits.length === 0}
                className="w-full px-3 py-2 font-mono text-xs corner-clip-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
              >
                EXPORTAR JSON
              </button>
              
              <label className="w-full px-3 py-2 font-mono text-xs corner-clip-sm transition-colors cursor-pointer block text-center" style={{background:'rgba(201,168,76,0.1)',border:'1px solid #c9a84c55',color:'#c9a84c'}}>
                IMPORTAR JSON
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
            <h1 className="text-lg font-bold font-mono tracking-widest uppercase" style={{color:'#e8d5a0'}}>Minha Coleção</h1>
          </div>
          <div className="text-xs font-mono" style={{color:'#4a5e3a'}}>
            {filteredUnits.length} / {allUnits.length} UNIDADES
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4">
          {/* Units Table - Desktop */}
          <div className="hidden lg:block w-full overflow-hidden">
            <div style={{background:'#0d1208',border:'1px solid #3a4a2a'}}>
              {/* Table Header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{background:'rgba(0,0,0,0.4)',borderBottom:'1px solid #3a4a2a'}}>
                <span className="font-mono text-sm tracking-widest uppercase" style={{color:'#c9a84c'}}>Minha Coleção</span>
                <span className="font-mono text-xs" style={{color:'#4a5e3a'}}>{filteredUnits.length} unidade(s)</span>
              </div>

              <div>
                <table className="w-full table-fixed">
                  <thead>
                    <tr style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        NOME
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        COLEÇÃO
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        #
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        TIPO
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        FACÇÃO
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        PTS
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        TENHO
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        PROCURO
                      </th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-mono tracking-widest" style={{color:'#5a7a4a'}}>
                        AÇÕES
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
                                  title="Remover da lista Tenho"
                                >
                                  -T
                                </button>
                              )}
                              {unit.wantQuantity > 0 && (
                                <button
                                  onClick={() => removeFromCollection(unit.id, "want")}
                                  className="px-2 py-0.5 text-xs font-mono transition-colors"
                                  style={{background:'rgba(150,100,50,0.2)',border:'1px solid #5a3a1a',color:'#c09060'}}
                                  title="Remover da lista Procuro"
                                >
                                  -P
                                </button>
                              )}
                              <button
                                onClick={() => removeFromAllLists(unit.id)}
                                className="px-2 py-0.5 text-xs font-mono transition-colors"
                                style={{background:'rgba(100,50,50,0.2)',border:'1px solid #4a1a1a',color:'#a05050'}}
                                title="Remover de todas as listas"
                              >
                                DEL
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
                  {filteredUnits.length} / {allUnits.length} UNIDADES
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
                        <div className="text-sm font-bold font-mono" style={{color:'#c9a84c'}}>{unit.points} pts</div>
                        <div className="text-xs font-mono" style={{color:'#4a5e3a'}}>
                          T:{unit.haveQuantity} P:{unit.wantQuantity}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 flex-wrap">
                        {unit.haveQuantity > 0 && (
                          <button onClick={() => removeFromCollection(unit.id, 'have')} className="px-2 py-0.5 text-xs font-mono" style={{background:'rgba(150,50,50,0.2)',border:'1px solid #5a2a2a',color:'#c06060'}}>-TENHO</button>
                        )}
                        {unit.wantQuantity > 0 && (
                          <button onClick={() => removeFromCollection(unit.id, 'want')} className="px-2 py-0.5 text-xs font-mono" style={{background:'rgba(150,100,50,0.2)',border:'1px solid #5a3a1a',color:'#c09060'}}>-PROCURO</button>
                        )}
                        <button onClick={() => removeFromAllLists(unit.id)} className="px-2 py-0.5 text-xs font-mono" style={{background:'rgba(100,50,50,0.2)',border:'1px solid #4a1a1a',color:'#a05050'}}>DEL</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {filteredUnits.length === 0 && allUnits.length > 0 && (
            <div className="text-center mt-8 font-mono text-xs" style={{color:'#3a5a2a'}}>[ NENHUMA UNIDADE COM OS FILTROS APLICADOS ]</div>
          )}
          {allUnits.length === 0 && (
            <div className="text-center mt-8">
              <p className="font-mono text-sm mb-2" style={{color:'#c9a84c'}}>// COLEÇÃO VAZIA</p>
              <p className="font-mono text-xs" style={{color:'#3a5a2a'}}>Importe um JSON ou adicione unidades pela busca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
