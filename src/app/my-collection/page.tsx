'use client'

import { useState, useEffect } from 'react'

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

  // Load collections from localStorage
  useEffect(() => {
    const savedHave = localStorage.getItem('myHaveCollection');
    const savedWant = localStorage.getItem('myWantCollection');
    
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
  }, []);

  // Save collections to localStorage
  const saveHaveCollection = (newCollection: MyUnit[]) => {
    setHaveUnits(newCollection);
    localStorage.setItem('myHaveCollection', JSON.stringify(newCollection));
  };

  const saveWantCollection = (newCollection: MyUnit[]) => {
    setWantUnits(newCollection);
    localStorage.setItem('myWantCollection', JSON.stringify(newCollection));
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
  const exportCollection = () => {
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
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      // Try to download the file
      try {
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `minha-colecao-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
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
          console.log('localStorage have:', JSON.parse(localStorage.getItem('myHaveCollection') || '[]').length);
          console.log('localStorage want:', JSON.parse(localStorage.getItem('myWantCollection') || '[]').length);
          
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden bg-white border-r border-gray-200 shadow-sm lg:relative absolute lg:z-auto z-50 h-full`}>
        <div className="p-4 h-full overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Minha Coleção</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Collection Stats */}
          <div className="mb-6 space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">📦 Tenho</span>
                <span className="text-lg font-bold text-green-900">{haveUnits.length}</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                {haveUnits.reduce((sum, unit) => sum + (unit.points * unit.quantity), 0)} pontos
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">🔍 Procuro</span>
                <span className="text-lg font-bold text-orange-900">{wantUnits.length}</span>
              </div>
              <div className="text-xs text-orange-600 mt-1">
                {wantUnits.reduce((sum, unit) => sum + (unit.points * unit.quantity), 0)} pontos
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Nome da unidade..."
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
              <option value="name">Nome (A-Z)</option>
              <option value="points">Pontos (menor)</option>
              <option value="pointsDesc">Pontos (maior)</option>
              <option value="faction">Facção</option>
              <option value="type">Tipo</option>
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

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-xs mb-4"
          >
            Limpar Filtros
          </button>

          {/* Import/Export Controls */}
          <div className="border-t pt-4">
            <h3 className="text-xs font-medium text-gray-700 mb-2">Gerenciar</h3>
            <div className="space-y-2">
              <button
                onClick={exportCollection}
                disabled={haveUnits.length === 0 && wantUnits.length === 0}
                className="w-full bg-green-600 text-white px-3 py-2 rounded text-xs hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                📤 Exportar JSON
              </button>
              
              <label className="w-full bg-blue-600 text-white px-3 py-2 rounded text-xs hover:bg-blue-700 transition-colors cursor-pointer block text-center">
                📥 Importar JSON
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
              <h1 className="text-2xl font-bold text-gray-900">Minha Coleção</h1>
            </div>
            <div className="text-sm text-gray-600">
              {filteredUnits.length} de {allUnits.length} unidade(s)
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Units Table - Desktop */}
          <div className="hidden lg:block w-full overflow-hidden">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-blue-800 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Minha Coleção
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      {filteredUnits.length} unidade(s) na coleção
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white">
                <table className="w-full bg-white table-fixed divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-blue-200">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Nome
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Coleção
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Número
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Facção
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Pontos
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        📦 Tenho
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        🔍 Procuro
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUnits.map((unit) => {
                      return (
                        <tr key={unit.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {unit.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            {unit.expansion || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center font-mono">
                            {unit.collectionNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center capitalize">
                            {unit.type}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">
                            {unit.faction}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium text-center">
                            {unit.points}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
                            {unit.haveQuantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
                            {unit.wantQuantity}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              {unit.haveQuantity > 0 && (
                                <button
                                  onClick={() => removeFromCollection(unit.id, "have")}
                                  className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                                  title="Remover da lista Tenho"
                                >
                                  📦❌
                                </button>
                              )}
                              {unit.wantQuantity > 0 && (
                                <button
                                  onClick={() => removeFromCollection(unit.id, "want")}
                                  className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                                  title="Remover da lista Procuro"
                                >
                                  🔍❌
                                </button>
                              )}
                              <button
                                onClick={() => removeFromAllLists(unit.id)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                                title="Remover de todas as listas"
                              >
                                🗑️
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
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 rounded-b-lg">
                <p className="text-sm text-gray-600 text-center">
                  Mostrando {filteredUnits.length} de {allUnits.length} unidades
                </p>
              </div>
            </div>
          </div>

          {/* Units Cards - Mobile */}
          <div className="w-full lg:hidden">
            <div className="space-y-3">
              {filteredUnits.map((unit) => {
                return (
                  <div key={unit.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {unit.name}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {unit.type} • {unit.faction}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{unit.points} pts</div>
                        <div className="text-sm text-gray-500">
                          📦 {unit.haveQuantity} • 🔍 {unit.wantQuantity}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {unit.haveQuantity > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            📦 {unit.haveQuantity}
                          </span>
                        )}
                        {unit.wantQuantity > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            🔍 {unit.wantQuantity}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {unit.haveQuantity > 0 && (
                          <button
                            onClick={() => removeFromCollection(unit.id, "have")}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                            title="Remover da lista Tenho"
                          >
                            📦❌
                          </button>
                        )}
                        {unit.wantQuantity > 0 && (
                          <button
                            onClick={() => removeFromCollection(unit.id, "want")}
                            className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                            title="Remover da lista Procuro"
                          >
                            🔍❌
                          </button>
                        )}
                        <button
                          onClick={() => removeFromAllLists(unit.id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                          title="Remover de todas as listas"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* No results message */}
          {filteredUnits.length === 0 && allUnits.length > 0 && (
            <div className="text-center text-gray-500 mt-8">
              Nenhuma unidade encontrada com os filtros aplicados
            </div>
          )}
          
          {/* Empty state */}
          {allUnits.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg mb-2">Sua coleção está vazia</p>
              <p className="text-sm">Importe um arquivo JSON ou adicione unidades pela página de busca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
