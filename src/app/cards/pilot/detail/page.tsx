'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useT } from '@/hooks/useT'
import { IPilot, apiService, pilotPointsLabel } from '@/lib/api'
import CardPortrait from '@/components/CardPortrait'
import CardCollectionButtons from '@/components/CardCollectionButtons'

const pilotTypeLabel = (t: ReturnType<typeof useT>, value: string) => {
  const labels: Record<string, string> = {
    CommonPilot: t('cardDetail.pilotTypeCommon'),
    LegendaryPilot: t('cardDetail.pilotTypeLegendary'),
    GunslingerPilot: t('cardDetail.pilotTypeGunslinger'),
  };
  return labels[value] ?? value;
};

function PilotDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const t = useT();

  const [pilot, setPilot] = useState<IPilot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [mechUnitId, setMechUnitId] = useState<string | null>(null);
  const [mechLookupDone, setMechLookupDone] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsSmallMobile(window.innerWidth < 550);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    apiService.getPilotById(id).then(p => {
      setPilot(p);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    setMechUnitId(null);
    setMechLookupDone(false);
    if (!pilot?.preferredMechId) { setMechLookupDone(true); return; }
    let cancelled = false;
    apiService.findUnitIdByMechCode(pilot.preferredMechId, pilot.expansion).then(unitId => {
      if (cancelled) return;
      setMechUnitId(unitId);
      setMechLookupDone(true);
    });
    return () => { cancelled = true; };
  }, [pilot?.preferredMechId, pilot?.expansion]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0d1208' }}>
        <div className="font-mono text-xs animate-pulse" style={{ color: '#7a9a5a' }}>{t('cardDetail.loadingCard')}</div>
      </div>
    );
  }

  if (!pilot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ backgroundColor: '#0d1208' }}>
        <div className="text-lg" style={{ color: '#c8b97a' }}>{t('cardDetail.notFound')}</div>
        <button
          onClick={() => router.push('/cards/pilot')}
          className="px-4 py-2 corner-clip-sm font-mono uppercase tracking-wider text-sm transition-opacity hover:opacity-80"
          style={{ background: '#c9a84c', color: '#0d1208' }}
        >
          {t('cardDetail.backToList')}
        </button>
      </div>
    );
  }

  const factions = [pilot.factionLeft, pilot.factionRight].filter((f): f is string => !!f);

  return (
    <div
      className={`min-h-screen flex overflow-hidden ${isSmallMobile ? 'p-1' : 'p-2 md:p-4 lg:p-8'} ${isSmallMobile ? 'gap-1' : 'gap-2 md:gap-4 lg:gap-8'} flex-col lg:flex-row items-stretch`}
      style={{ backgroundColor: '#0d1208' }}
    >
      {/* Left Column - Card Details (fully implemented) */}
      <div className={`grimdark-panel flex flex-col overflow-hidden ${isSmallMobile ? 'p-2' : 'p-3 md:p-4'} w-full lg:w-[55%]`}>
        <button
          onClick={() => router.push('/cards/pilot')}
          className="gold-accent flex items-center gap-2 text-sm mb-4 w-fit transition-opacity hover:opacity-75"
        >
          {t('cardDetail.backToList')}
        </button>

        <div className="pb-3 mb-3 flex-shrink-0 flex items-center gap-3" style={{ borderBottom: '1px solid #4a5e35' }}>
          <CardPortrait imageUrl={pilot.imageUrl} name={pilot.name} size="lg" />
          <div className="flex flex-col justify-center space-y-1">
            <div className="font-semibold text-base" style={{ color: '#e8d5a0' }}>
              {pilot.name}
              {pilot.isUnique && (
                <span className="ml-2 font-mono uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#1a2410', color: '#c9a84c', border: '1px solid #4a5e35' }}>
                  {t('cardDetail.unique')}
                </span>
              )}
            </div>
            <div className="font-mono uppercase tracking-wider text-xs" style={{ color: '#7a9a5a' }}>
              {pilotTypeLabel(t, pilot.pilotType)}
            </div>
            <div className="font-mono text-xs" style={{ color: '#6a7a5a' }}>
              #{pilot.collectionNumber} · {pilot.cardId}
            </div>
            <div className="font-bold font-mono corner-clip-sm inline-block w-fit px-2 py-1 text-sm" style={{ background: '#1a2410', color: '#c9a84c', border: '1px solid #4a5e35' }}>
              {pilotPointsLabel(pilot)} {t('cardDetail.pts')}
            </div>
            <div className="pt-1">
              <CardCollectionButtons card={{ id: pilot.id, cardId: pilot.cardId, name: pilot.name, cardType: 'P', expansion: pilot.expansion, collectionNumber: pilot.collectionNumber }} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {/* Factions */}
          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>{t('cardDetail.faction')}</div>
            <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>
              {factions.length > 0 ? factions.join(' — ') : t('cardDetail.noFaction')}
            </div>
          </div>

          {/* Class / Expansion */}
          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="font-mono uppercase tracking-wider text-xs mb-0.5" style={{ color: '#6a7a5a' }}>{t('cardDetail.class')}</div>
                <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>{pilot.class}</div>
              </div>
              <div>
                <div className="font-mono uppercase tracking-wider text-xs mb-0.5" style={{ color: '#6a7a5a' }}>{t('cardDetail.expansion')}</div>
                <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>{pilot.expansion}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>{t('cardDetail.stats')}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="font-mono uppercase tracking-wider text-[10px] mb-0.5" style={{ color: '#6a7a5a' }}>{t('cardDetail.speed')}</div>
                <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c9a84c', border: '1px solid #3a4a2a' }}>{pilot.speed}</div>
              </div>
              <div>
                <div className="font-mono uppercase tracking-wider text-[10px] mb-0.5" style={{ color: '#6a7a5a' }}>{t('cardDetail.attack')}</div>
                <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c9a84c', border: '1px solid #3a4a2a' }}>{pilot.attack}</div>
              </div>
              <div>
                <div className="font-mono uppercase tracking-wider text-[10px] mb-0.5" style={{ color: '#6a7a5a' }}>{t('cardDetail.defense')}</div>
                <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c9a84c', border: '1px solid #3a4a2a' }}>{pilot.defense}</div>
              </div>
            </div>
          </div>

          {/* Rank */}
          {pilot.rank && (
            <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
              <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>{t('cardDetail.rank')}</div>
              <div className="font-bold text-xs px-1 py-0.5 rounded w-fit" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>{pilot.rank}</div>
            </div>
          )}

          {/* Preferred Mech */}
          {(pilot.preferredMechId || pilot.costInPreferredMech != null) && (
            <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
              <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>{t('cardDetail.preferredMech')}</div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="font-mono uppercase tracking-wider text-[10px] mb-0.5" style={{ color: '#6a7a5a' }}>{t('cardDetail.unit')}</div>
                  {mechUnitId ? (
                    <button
                      onClick={() => router.push(`/list?unitId=${mechUnitId}`)}
                      className="font-bold text-xs px-1 py-0.5 rounded w-full transition-opacity hover:opacity-80 underline decoration-dotted"
                      style={{ background: '#0d1208', color: '#c9a84c', border: '1px solid #4a5e35' }}
                    >
                      {pilot.preferredMechId} →
                    </button>
                  ) : (
                    <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>
                      {pilot.preferredMechId ?? '—'}
                      {pilot.preferredMechId && !mechLookupDone && (
                        <span className="ml-1 opacity-50">…</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-mono uppercase tracking-wider text-[10px] mb-0.5" style={{ color: '#6a7a5a' }}>{t('cardDetail.combinedCost')}</div>
                  <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c9a84c', border: '1px solid #3a4a2a' }}>{pilot.costInPreferredMech ?? '—'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recruit Costs */}
          {pilot.recruitCosts && pilot.recruitCosts.length > 0 && (
            <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
              <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>{t('cardDetail.recruitCosts')}</div>
              <div className="flex flex-wrap gap-2">
                {pilot.recruitCosts.map((rc, i) => (
                  <div key={i} className="font-mono text-xs px-2 py-1 rounded" style={{ background: '#0d1208', color: '#c9a84c', border: '1px solid #3a4a2a' }}>
                    {rc.label}: {rc.cost}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>{t('cardDetail.description')}</div>
            <p className="text-xs leading-relaxed" style={{ color: '#c8b97a' }}>
              {pilot.description || t('cardDetail.noSpecialAbility')}
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Card Visual (work in progress) */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[45%] min-h-[280px]">
        <div
          className="w-full max-w-lg flex flex-col items-center justify-center gap-3 corner-clip-sm"
          style={{ aspectRatio: '10/7', background: 'rgba(0,0,0,0.35)', border: '1px dashed #4a5e35' }}
        >
          <div className="font-mono text-3xl" style={{ color: '#3a5a2a' }}>⚒</div>
          <div className="font-mono uppercase tracking-widest text-xs" style={{ color: '#7a9a5a' }}>
            {t('cardDetail.visualWip')}
          </div>
          <div className="font-mono text-[10px] px-4 text-center leading-relaxed" style={{ color: '#4a5e3a' }}>
            {t('cardDetail.visualWipDesc')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PilotDetailPage() {
  const t = useT();
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0d1208' }}><div className="font-mono text-xs animate-pulse" style={{ color: '#7a9a5a' }}>{t('common.loading')}</div></div>}>
      <PilotDetailContent />
    </Suspense>
  );
}
