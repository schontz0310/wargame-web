'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { IMercenaryContract, MercenaryContractsFilters, apiService } from '@/lib/api'

const EXPANSIONS = ['AOD', 'DA', 'FI', 'CW', 'RotS'];

function MercenaryContractListContent() {
  const router = useRouter();

  const [cards, setCards] = useState<IMercenaryContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<MercenaryContractsFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('');

  const [factions, setFactions] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const f: MercenaryContractsFilters = {
      ...filters,
      search: search || undefined,
      faction: selectedFaction || undefined,
      expansion: selectedExpansion || undefined,
    };
    apiService.getMercenaryContracts(f)
      .then(res => {
        setCards(res.mercenaryContracts);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        const uniqueFactions = [...new Set(res.mercenaryContracts.map(c => c.faction))].sort();
        setFactions(prev => [...new Set([...prev, ...uniqueFactions])].sort());
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, search, selectedFaction, selectedExpansion]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(f => ({ ...f, page: 1 }));
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedFaction('');
    setSelectedExpansion('');
    setFilters({ page: 1, limit: 20 });
  };

  const goToPage = (page: number) => setFilters(f => ({ ...f, page }));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Filtros */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col h-full overflow-y-auto flex-shrink-0">
        <div className="p-4">
          <button
            onClick={() => router.push('/cards')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            ← Voltar
          </button>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Filtros</h2>

          <form onSubmit={handleSearch} className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar descrição</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Palavra-chave..."
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-transparent"
            />
          </form>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Facção</label>
            <select
              value={selectedFaction}
              onChange={e => { setSelectedFaction(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Todas as facções</option>
              {factions.map(fac => <option key={fac} value={fac}>{fac}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Expansão</label>
            <select
              value={selectedExpansion}
              onChange={e => { setSelectedExpansion(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Todas as expansões</option>
              {EXPANSIONS.map(exp => <option key={exp} value={exp}>{exp}</option>)}
            </select>
          </div>

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
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                📜 Mercenary Contract
              </h1>
              <p className="text-amber-100 text-sm mt-1">{total} carta(s) encontrada(s)</p>
            </div>
            <button
              onClick={() => router.push('/search')}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              🔍 Buscar Unidades
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Carregando cartas...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">Erro: {error}</div>
            </div>
          ) : cards.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Nenhuma carta encontrada</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <table className="w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Card ID</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Nome</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Facção</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Expansão</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Custo</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Descrição</th>
                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cards.map(card => (
                    <tr
                      key={card.id}
                      className="hover:bg-amber-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/cards/mercenary-contract/${card.id}`)}
                    >
                      <td className="px-3 py-2 text-xs font-mono text-gray-700">{card.cardId}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{card.collectionNumber}</td>
                      <td className="px-3 py-2 text-xs text-gray-800 font-medium">{card.name}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{card.faction}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{card.expansion}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">{card.cost}</span>
                        {card.alternativeCost && (
                          <span className="ml-1 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{card.alternativeCost}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">{card.description}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/cards/mercenary-contract/${card.id}`); }}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded transition-colors"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Página {filters.page} de {totalPages} — {total} total
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={(filters.page ?? 1) <= 1}
                    onClick={() => goToPage((filters.page ?? 1) - 1)}
                    className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <button
                    disabled={(filters.page ?? 1) >= totalPages}
                    onClick={() => goToPage((filters.page ?? 1) + 1)}
                    className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MercenaryContractPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-lg">Carregando...</div></div>}>
      <MercenaryContractListContent />
    </Suspense>
  );
}
