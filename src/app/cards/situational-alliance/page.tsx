'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ISituationalAlliance, apiService } from '@/lib/api'

const EXPANSIONS = ['AOD', 'DA', 'FI', 'CW', 'RotS'];
const PAGE_SIZE = 20;

function SituationalAllianceListContent() {
  const router = useRouter();

  const [allCards, setAllCards] = useState<ISituationalAlliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('');

  // The backend has no combined faction filter for this endpoint (each card has two
  // factions), so the full set is fetched once (100 per page, the backend's max) and
  // every filter is applied client-side.
  useEffect(() => {
    setLoading(true);
    setError(null);
    apiService.getSituationalAlliances({ page: 1, limit: 100 })
      .then(async res => {
        let cards = res.situationalAlliances;
        if (res.totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: res.totalPages - 1 }, (_, i) => apiService.getSituationalAlliances({ page: i + 2, limit: 100 }))
          );
          cards = cards.concat(...rest.map(r => r.situationalAlliances));
        }
        setAllCards(cards);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const factions = useMemo(() => {
    const set = new Set<string>();
    allCards.forEach(c => { set.add(c.factionLeft); set.add(c.factionRight); });
    return [...set].sort();
  }, [allCards]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCards.filter(c => {
      if (selectedExpansion && c.expansion !== selectedExpansion) return false;
      if (selectedFaction && c.factionLeft !== selectedFaction && c.factionRight !== selectedFaction) return false;
      if (q && !c.description.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allCards, search, selectedFaction, selectedExpansion]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const pageCards = filteredCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedFaction('');
    setSelectedExpansion('');
    setPage(1);
  };

  const goToPage = (p: number) => setPage(p);

  return (
    <div className="flex h-screen" style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      {/* Sidebar */}
      <div className="w-56 flex flex-col h-full overflow-y-auto flex-shrink-0" style={{background:'#0a0f06',borderRight:'1px solid #2a3a1a'}}>
        <div className="px-3 py-3" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.4)'}}>
          <div className="font-mono text-xs tracking-widest uppercase" style={{color:'#c9a84c'}}>FILTROS</div>
        </div>
        <div className="p-3 space-y-4 flex-1">
          <form onSubmit={handleSearch}>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>BUSCAR DESCRIÇÃO</label>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Palavra-chave..."
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}}
            />
          </form>
          <div>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>FACÇÃO</label>
            <select
              value={selectedFaction}
              onChange={e => { setSelectedFaction(e.target.value); setPage(1); }}
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
              onChange={e => { setSelectedExpansion(e.target.value); setPage(1); }}
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
            <h1 className="font-mono text-sm font-bold tracking-widest uppercase" style={{color:'#c9a84c'}}>CARTAS — SITUATIONAL ALLIANCE</h1>
            <p className="font-mono text-xs mt-0.5" style={{color:'#4a5e3a'}}>{filteredCards.length} carta(s) encontrada(s)</p>
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
          ) : filteredCards.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="font-mono text-xs" style={{color:'#3a5a2a'}}>Nenhuma carta encontrada</div>
            </div>
          ) : (
            <div style={{border:'1px solid #2a3a1a',overflow:'hidden'}}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10" style={{background:'rgba(10,15,6,0.97)',borderBottom:'1px solid #2a3a1a'}}>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>CARD ID</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>#</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>FACÇÕES</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>EXPANSÃO</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>CUSTO</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>DESCRIÇÃO</th>
                    <th className="px-3 py-2 text-center text-xs font-mono" style={{color:'#5a7a4a'}}>VER</th>
                  </tr>
                </thead>
                <tbody>
                  {pageCards.map(card => (
                    <tr
                      key={card.id}
                      className="cursor-pointer transition-colors"
                      style={{borderBottom:'1px solid #1a2a10'}}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(122,154,90,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => router.push(`/cards/situational-alliance/detail?id=${card.id}`)}
                    >
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{card.cardId}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#4a5e3a',borderRight:'1px solid #1a2a10'}}>{card.collectionNumber}</td>
                      <td className="px-3 py-2 text-xs font-mono font-medium" style={{color:'#e8d5a0',borderRight:'1px solid #1a2a10'}}>{card.factionLeft} — {card.factionRight}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{card.expansion}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{borderRight:'1px solid #1a2a10'}}>
                        <span className="px-1.5 py-0.5 font-bold" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c55',color:'#c9a84c'}}>{card.cost}</span>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono max-w-xs truncate" style={{color:'#6a8a4a',borderRight:'1px solid #1a2a10'}}>{card.description}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/cards/situational-alliance/detail?id=${card.id}`); }}
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
                <span className="font-mono text-xs" style={{color:'#4a5e3a'}}>PÁG. {page}/{totalPages} — {filteredCards.length} total</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => goToPage(page - 1)} className="px-3 py-1 font-mono text-xs corner-clip-sm disabled:opacity-40" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>← ANTERIOR</button>
                  <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="px-3 py-1 font-mono text-xs corner-clip-sm disabled:opacity-40" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>PRÓXIMA →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SituationalAlliancePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen" style={{background:'#0d1208'}}><div className="font-mono text-xs animate-pulse" style={{color:'#7a9a5a'}}>[ CARREGANDO... ]</div></div>}>
      <SituationalAllianceListContent />
    </Suspense>
  );
}
