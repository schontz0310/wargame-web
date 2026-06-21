'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { IFactionPride, FactionPridesFilters, apiService } from '@/lib/api'

const EXPANSIONS = ['AOD', 'DA', 'FI', 'CW', 'RotS'];

function FactionPrideListContent() {
  const router = useRouter();

  const [cards, setCards] = useState<IFactionPride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<FactionPridesFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('');

  const [factions, setFactions] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const f: FactionPridesFilters = {
      ...filters,
      search: search || undefined,
      faction: selectedFaction || undefined,
      expansion: selectedExpansion || undefined,
    };
    apiService.getFactionPrides(f)
      .then(res => {
        setCards(res.factionPrides);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        const uniqueFactions = [...new Set(res.factionPrides.map(c => c.faction))].sort();
        setFactions(prev => {
          const merged = [...new Set([...prev, ...uniqueFactions])].sort();
          return merged;
        });
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
    <div className="flex h-screen" style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      {/* Sidebar */}
      <div className="w-56 flex flex-col h-full overflow-y-auto flex-shrink-0" style={{background:'#0a0f06',borderRight:'1px solid #2a3a1a'}}>
        <div className="px-3 py-3" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.4)'}}>
          <div className="font-mono text-xs tracking-widest uppercase" style={{color:'#c9a84c'}}>// FILTROS</div>
        </div>
        <div className="p-3 space-y-4 flex-1">
          <form onSubmit={handleSearch}>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>BUSCAR DESCRIÇÃO</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Palavra-chave..."
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}}
            />
          </form>
          <div>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>FACÇÃO</label>
            <select
              value={selectedFaction}
              onChange={e => { setSelectedFaction(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">Todas</option>
              {factions.map(fac => <option key={fac} value={fac}>{fac}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>EXPANSÃO</label>
            <select
              value={selectedExpansion}
              onChange={e => { setSelectedExpansion(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">Todas</option>
              {EXPANSIONS.map(exp => <option key={exp} value={exp}>{exp}</option>)}
            </select>
          </div>
          <button onClick={clearFilters} className="w-full px-3 py-1.5 font-mono text-xs corner-clip-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#5a7a4a'}}>LIMPAR FILTROS</button>
        </div>
        <div className="p-3 space-y-1" style={{borderTop:'1px solid #2a3a1a'}}>
          <button onClick={() => router.push('/cards')} className="w-full px-3 py-1.5 font-mono text-xs corner-clip-sm text-left" style={{background:'rgba(201,168,76,0.1)',border:'1px solid #c9a84c44',color:'#c9a84c'}}>← TIPOS DE CARTA</button>
          <button onClick={() => router.push('/search')} className="w-full px-3 py-1.5 font-mono text-xs corner-clip-sm text-left" style={{background:'rgba(122,154,90,0.1)',border:'1px solid #2a3a1a',color:'#7a9a5a'}}>BUSCAR UNIDADES</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{background:'rgba(0,0,0,0.5)',borderBottom:'1px solid #3a4a2a'}}>
          <div>
            <h1 className="font-mono text-sm font-bold tracking-widest uppercase" style={{color:'#c9a84c'}}>CARTAS — FACTION PRIDE</h1>
            <p className="font-mono text-xs mt-0.5" style={{color:'#4a5e3a'}}>{total} carta(s) encontrada(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#7a9a5a'}}></div>
            <span className="font-mono text-xs" style={{color:'#3a5a2a'}}>ONLINE</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="font-mono text-xs animate-pulse" style={{color:'#7a9a5a'}}>[ CARREGANDO CARTAS... ]</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="font-mono text-xs" style={{color:'#c06060',border:'1px solid #5a2a2a',padding:'8px 16px'}}>ERRO: {error}</div>
            </div>
          ) : cards.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="font-mono text-xs" style={{color:'#3a5a2a'}}>// Nenhuma carta encontrada</div>
            </div>
          ) : (
            <div style={{border:'1px solid #2a3a1a',overflow:'hidden'}}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10" style={{background:'rgba(10,15,6,0.97)',borderBottom:'1px solid #2a3a1a'}}>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>CARD ID</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>#</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>FACÇÃO</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>EXPANSÃO</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>CUSTO</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>LOGO</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>DESCRIÇÃO</th>
                    <th className="px-3 py-2 text-center text-xs font-mono" style={{color:'#5a7a4a'}}>VER</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <tr
                      key={card.id}
                      className="cursor-pointer transition-colors"
                      style={{borderBottom:'1px solid #1a2a10'}}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(122,154,90,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => router.push(`/cards/faction-pride/${card.id}`)}
                    >
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{card.cardId}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#4a5e3a',borderRight:'1px solid #1a2a10'}}>{card.collectionNumber}</td>
                      <td className="px-3 py-2 text-xs font-mono font-medium" style={{color:'#e8d5a0',borderRight:'1px solid #1a2a10'}}>{card.faction}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{card.expansion}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{borderRight:'1px solid #1a2a10'}}>
                        <span className="px-1.5 py-0.5 font-bold" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c55',color:'#c9a84c'}}>{card.cost}</span>
                        {card.alternativeCost && (
                          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a',color:'#5a7a4a'}}>{card.alternativeCost}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono capitalize" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{card.logoVariant}</td>
                      <td className="px-3 py-2 text-xs font-mono max-w-xs truncate" style={{color:'#6a8a4a',borderRight:'1px solid #1a2a10'}}>{card.description}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/cards/faction-pride/${card.id}`); }}
                          className="px-2 py-1 font-mono text-xs corner-clip-sm"
                          style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}
                        >
                          VER
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 flex items-center justify-between" style={{borderTop:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <span className="font-mono text-xs" style={{color:'#4a5e3a'}}>PÁG. {filters.page}/{totalPages} — {total} total</span>
                <div className="flex gap-2">
                  <button disabled={(filters.page ?? 1) <= 1} onClick={() => goToPage((filters.page ?? 1) - 1)} className="px-3 py-1 font-mono text-xs corner-clip-sm disabled:opacity-40" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>← ANTERIOR</button>
                  <button disabled={(filters.page ?? 1) >= totalPages} onClick={() => goToPage((filters.page ?? 1) + 1)} className="px-3 py-1 font-mono text-xs corner-clip-sm disabled:opacity-40" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>PRÓXIMA →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FactionPridePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen" style={{background:'#0d1208'}}><div className="font-mono text-xs animate-pulse" style={{color:'#7a9a5a'}}>[ CARREGANDO... ]</div></div>}>
      <FactionPrideListContent />
    </Suspense>
  );
}
