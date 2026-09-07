'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/hooks/useT'
import { IPilot, apiService, pilotPointsLabel } from '@/lib/api'
import CardPortrait from '@/components/CardPortrait'
import CardCollectionButtons from '@/components/CardCollectionButtons'
import { getCardCounts } from '@/lib/cardCollection'

const PAGE_SIZE = 20;
const CLASSES = ['Light', 'Medium', 'Heavy', 'Assault'];
const PILOT_TYPE_VALUES = ['CommonPilot', 'LegendaryPilot', 'GunslingerPilot'] as const;

function PilotListContent() {
  const router = useRouter();
  const t = useT();

  const pilotTypeLabels: Record<string, string> = {
    CommonPilot: t('cardDetail.pilotTypeCommon'),
    LegendaryPilot: t('cardDetail.pilotTypeLegendary'),
    GunslingerPilot: t('cardDetail.pilotTypeGunslinger'),
  };
  const pilotTypeLabel = (value: string) => pilotTypeLabels[value] ?? value;

  const [allCards, setAllCards] = useState<IPilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedFaction, setSelectedFaction] = useState('');
  const [selectedExpansion, setSelectedExpansion] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPilotType, setSelectedPilotType] = useState('');
  const [showHaveOnly, setShowHaveOnly] = useState(false);
  const [showWantOnly, setShowWantOnly] = useState(false);
  const [collectionVersion, setCollectionVersion] = useState(0);

  // The TENHO/QUERO filters need to see the whole collection to be correct, so the full
  // set is fetched once (100 per page, the backend's max) and paginated/filtered client-side.
  useEffect(() => {
    setLoading(true);
    setError(null);
    apiService.getPilots({ page: 1, limit: 100 })
      .then(async res => {
        let cards = res.pilots;
        if (res.totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: res.totalPages - 1 }, (_, i) => apiService.getPilots({ page: i + 2, limit: 100 }))
          );
          cards = cards.concat(...rest.map(r => r.pilots));
        }
        setAllCards(cards);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const factions = useMemo(() => [...new Set(allCards.flatMap(c => [c.factionLeft, c.factionRight].filter((x): x is string => !!x)))].sort(), [allCards]);
  const expansions = useMemo(() => [...new Set(allCards.map(c => c.expansion))].sort(), [allCards]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCards.filter(c => {
      if (selectedFaction && c.factionLeft !== selectedFaction && c.factionRight !== selectedFaction) return false;
      if (selectedExpansion && c.expansion !== selectedExpansion) return false;
      if (selectedClass && c.class !== selectedClass) return false;
      if (selectedPilotType && c.pilotType !== selectedPilotType) return false;
      if (q && !c.name.toLowerCase().includes(q) && !(c.description || '').toLowerCase().includes(q)) return false;
      if (showHaveOnly && getCardCounts(c.id).haveCount === 0) return false;
      if (showWantOnly && getCardCounts(c.id).wantCount === 0) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCards, search, selectedFaction, selectedExpansion, selectedClass, selectedPilotType, showHaveOnly, showWantOnly, collectionVersion]);

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
    setSelectedClass('');
    setSelectedPilotType('');
    setShowHaveOnly(false);
    setShowWantOnly(false);
    setPage(1);
  };

  const goToPage = (p: number) => setPage(p);

  return (
    <div className="flex h-screen" style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      {/* Sidebar */}
      <div className="w-56 flex flex-col h-full overflow-y-auto flex-shrink-0" style={{background:'#0a0f06',borderRight:'1px solid #2a3a1a'}}>
        <div className="px-3 py-3" style={{borderBottom:'1px solid #2a3a1a',background:'rgba(0,0,0,0.4)'}}>
          <div className="font-mono text-xs tracking-widest uppercase" style={{color:'#c9a84c'}}>{t('cardsUI.filtersTitle')}</div>
        </div>
        <div className="p-3 space-y-4 flex-1">
          <form onSubmit={handleSearch}>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>{t('cardsUI.searchNameDesc')}</label>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('cardsUI.keywordPlaceholder')}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c',outline:'none'}}
            />
          </form>
          <div>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>{t('cardsUI.faction')}</label>
            <select
              value={selectedFaction}
              onChange={e => { setSelectedFaction(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">{t('cardsUI.allF')}</option>
              {factions.map(fac => <option key={fac} value={fac}>{fac}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>{t('cardsUI.pilotType')}</label>
            <select
              value={selectedPilotType}
              onChange={e => { setSelectedPilotType(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">{t('cardsUI.allM')}</option>
              {PILOT_TYPE_VALUES.map(pt => <option key={pt} value={pt}>{pilotTypeLabel(pt)}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>{t('cardsUI.class')}</label>
            <select
              value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">{t('cardsUI.allF')}</option>
              {CLASSES.map(cl => <option key={cl} value={cl}>{cl}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>{t('cardsUI.expansion')}</label>
            <select
              value={selectedExpansion}
              onChange={e => { setSelectedExpansion(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 text-xs font-mono"
              style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#c9a84c'}}
            >
              <option value="">{t('cardsUI.allF')}</option>
              {expansions.map(exp => <option key={exp} value={exp}>{exp}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block font-mono text-xs mb-1" style={{color:'#5a7a4a'}}>{t('cardsUI.collection')}</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showHaveOnly} onChange={e => { setShowHaveOnly(e.target.checked); setPage(1); }} className="h-3 w-3" style={{accentColor:'#7a9a5a'}} />
              <span className="text-xs font-mono" style={{color:'#7a9a5a'}}>{t('cardsUI.have')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showWantOnly} onChange={e => { setShowWantOnly(e.target.checked); setPage(1); }} className="h-3 w-3" style={{accentColor:'#c9a84c'}} />
              <span className="text-xs font-mono" style={{color:'#c9a84c'}}>{t('cardsUI.want')}</span>
            </label>
          </div>
          <button onClick={clearFilters} className="w-full px-3 py-1.5 font-mono text-xs corner-clip-sm" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#5a7a4a'}}>{t('cardsUI.clearFilters')}</button>
        </div>
        <div className="p-3 space-y-1" style={{borderTop:'1px solid #2a3a1a'}}>
          <button onClick={() => router.push('/cards')} className="w-full px-3 py-1.5 font-mono text-xs corner-clip-sm text-left" style={{background:'rgba(201,168,76,0.1)',border:'1px solid #c9a84c44',color:'#c9a84c'}}>{t('cardsUI.backToTypes')}</button>
          <button onClick={() => router.push('/search')} className="w-full px-3 py-1.5 font-mono text-xs corner-clip-sm text-left" style={{background:'rgba(122,154,90,0.1)',border:'1px solid #2a3a1a',color:'#7a9a5a'}}>{t('cardsUI.searchUnits')}</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{background:'rgba(0,0,0,0.5)',borderBottom:'1px solid #3a4a2a'}}>
          <div>
            <h1 className="font-mono text-sm font-bold tracking-widest uppercase" style={{color:'#c9a84c'}}>{t('cardsUI.cardsHeader')} — PILOT</h1>
            <p className="font-mono text-xs mt-0.5" style={{color:'#4a5e3a'}}>{filteredCards.length} {t('cardsUI.cardsFound')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#7a9a5a'}}></div>
            <span className="font-mono text-xs" style={{color:'#3a5a2a'}}>{t('cardsUI.online')}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="font-mono text-xs animate-pulse" style={{color:'#7a9a5a'}}>{t('cardsUI.loadingCards')}</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="font-mono text-xs" style={{color:'#c06060',border:'1px solid #5a2a2a',padding:'8px 16px'}}>{t('cardsUI.errorPrefix')} {error}</div>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="font-mono text-xs" style={{color:'#3a5a2a'}}>{t('cardsUI.noCardsFound')}</div>
            </div>
          ) : (
            <div style={{border:'1px solid #2a3a1a',overflow:'hidden'}}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10" style={{background:'rgba(10,15,6,0.97)',borderBottom:'1px solid #2a3a1a'}}>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('cardsUI.colCardId')}</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}></th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('cardsUI.colName')}</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('cardsUI.colType')}</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('cardsUI.colFaction')}</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('cardsUI.colClass')}</th>
                    <th className="px-3 py-2 text-center text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('cardsUI.colPts')}</th>
                    <th className="px-3 py-2 text-center text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('cardsUI.colStats')}</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('cardsUI.colExpansion')}</th>
                    <th className="px-3 py-2 text-left text-xs font-mono" style={{color:'#5a7a4a',borderRight:'1px solid #1a2a10'}}>{t('cardsUI.colCollection')}</th>
                    <th className="px-3 py-2 text-center text-xs font-mono" style={{color:'#5a7a4a'}}>{t('cardsUI.colView')}</th>
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
                      onClick={() => router.push(`/cards/pilot/detail?id=${card.id}`)}
                    >
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{card.cardId}</td>
                      <td className="px-2 py-1" style={{borderRight:'1px solid #1a2a10'}}>
                        <CardPortrait imageUrl={card.imageUrl} name={card.name} />
                      </td>
                      <td className="px-3 py-2 text-xs font-mono font-medium max-w-[220px] truncate" style={{color:'#e8d5a0',borderRight:'1px solid #1a2a10'}}>{card.name}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{pilotTypeLabel(card.pilotType)}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>
                        {[card.factionLeft, card.factionRight].filter(Boolean).join(' — ') || '—'}
                      </td>
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#6a8a4a',borderRight:'1px solid #1a2a10'}}>{card.class}</td>
                      <td className="px-3 py-2 text-xs font-mono text-center" style={{borderRight:'1px solid #1a2a10'}}>
                        <span className="px-1.5 py-0.5 font-bold" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c55',color:'#c9a84c'}}>{pilotPointsLabel(card)}</span>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-center" style={{color:'#6a8a4a',borderRight:'1px solid #1a2a10'}}>{card.speed}/{card.attack}/{card.defense}</td>
                      <td className="px-3 py-2 text-xs font-mono" style={{color:'#7a9a5a',borderRight:'1px solid #1a2a10'}}>{card.expansion}</td>
                      <td className="px-3 py-2" style={{borderRight:'1px solid #1a2a10'}}>
                        <CardCollectionButtons card={{ id: card.id, cardId: card.cardId, name: card.name, cardType: 'P', expansion: card.expansion, collectionNumber: card.collectionNumber }} onChange={() => setCollectionVersion(v => v + 1)} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/cards/pilot/detail?id=${card.id}`); }}
                          className="px-2 py-1 font-mono text-xs corner-clip-sm"
                          style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}
                        >
                          {t('cardsUI.view')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 flex items-center justify-between" style={{borderTop:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}>
                <span className="font-mono text-xs" style={{color:'#4a5e3a'}}>{t('cardsUI.page')} {page}/{totalPages} — {filteredCards.length} {t('cardsUI.total')}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => goToPage(page - 1)} className="px-3 py-1 font-mono text-xs corner-clip-sm disabled:opacity-40" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>{t('cardsUI.prev')}</button>
                  <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)} className="px-3 py-1 font-mono text-xs corner-clip-sm disabled:opacity-40" style={{background:'rgba(0,0,0,0.4)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}>{t('cardsUI.next')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PilotPage() {
  const t = useT();
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen" style={{background:'#0d1208'}}><div className="font-mono text-xs animate-pulse" style={{color:'#7a9a5a'}}>{t('common.loading')}</div></div>}>
      <PilotListContent />
    </Suspense>
  );
}
