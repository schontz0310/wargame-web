'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IGear, apiService } from '@/lib/api'
import CardPortrait from '@/components/CardPortrait'

function GearDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [gear, setGear] = useState<IGear | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsSmallMobile(window.innerWidth < 550);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    apiService.getGearById(id).then(g => {
      setGear(g);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0d1208' }}>
        <div className="font-mono text-xs animate-pulse" style={{ color: '#7a9a5a' }}>[ CARREGANDO CARTA... ]</div>
      </div>
    );
  }

  if (!gear) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ backgroundColor: '#0d1208' }}>
        <div className="text-lg" style={{ color: '#c8b97a' }}>Nenhuma carta encontrada</div>
        <button
          onClick={() => router.push('/cards/gear')}
          className="px-4 py-2 corner-clip-sm font-mono uppercase tracking-wider text-sm transition-opacity hover:opacity-80"
          style={{ background: '#c9a84c', color: '#0d1208' }}
        >
          Voltar para listagem
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex overflow-hidden ${isSmallMobile ? 'p-1' : 'p-2 md:p-4 lg:p-8'} ${isSmallMobile ? 'gap-1' : 'gap-2 md:gap-4 lg:gap-8'} flex-col lg:flex-row items-stretch`}
      style={{ backgroundColor: '#0d1208' }}
    >
      {/* Left Column - Card Details (fully implemented) */}
      <div className={`grimdark-panel flex flex-col overflow-hidden ${isSmallMobile ? 'p-2' : 'p-3 md:p-4'} w-full lg:w-[55%]`}>
        <button
          onClick={() => router.push('/cards/gear')}
          className="gold-accent flex items-center gap-2 text-sm mb-4 w-fit transition-opacity hover:opacity-75"
        >
          ← Voltar para listagem
        </button>

        <div className="pb-3 mb-3 flex-shrink-0 flex items-center gap-3" style={{ borderBottom: '1px solid #4a5e35' }}>
          <CardPortrait imageUrl={gear.imageUrl} name={gear.name} size="lg" />
          <div className="flex flex-col justify-center space-y-1">
            <div className="font-semibold text-base" style={{ color: '#e8d5a0' }}>
              {gear.name}
              {gear.isSingleUse && (
                <span className="ml-2 font-mono uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#1a2410', color: '#c9a84c', border: '1px solid #4a5e35' }}>
                  Uso Único
                </span>
              )}
            </div>
            <div className="font-mono uppercase tracking-wider text-xs" style={{ color: '#7a9a5a' }}>
              Gear
            </div>
            <div className="font-mono text-xs" style={{ color: '#6a7a5a' }}>
              #{gear.collectionNumber} · {gear.cardId}
            </div>
            <div className="font-bold font-mono corner-clip-sm inline-block w-fit px-2 py-1 text-sm" style={{ background: '#1a2410', color: '#c9a84c', border: '1px solid #4a5e35' }}>
              {gear.points} pts
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {/* Faction */}
          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>Facção</div>
            <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>
              {gear.faction || 'Sem facção'}
            </div>
          </div>

          {/* Class / Expansion */}
          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="font-mono uppercase tracking-wider text-xs mb-0.5" style={{ color: '#6a7a5a' }}>Classe</div>
                <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>{gear.class}</div>
              </div>
              <div>
                <div className="font-mono uppercase tracking-wider text-xs mb-0.5" style={{ color: '#6a7a5a' }}>Expansão</div>
                <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>{gear.expansion}</div>
              </div>
            </div>
          </div>

          {/* Attaches To */}
          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>Anexa a</div>
            <div className="font-bold text-xs px-1 py-0.5 rounded w-fit" style={{ background: '#0d1208', color: '#c9a84c', border: '1px solid #3a4a2a' }}>
              {gear.attachesTo || '—'}
            </div>
          </div>

          {/* Effect */}
          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>Efeito</div>
            <p className="text-xs leading-relaxed" style={{ color: '#c8b97a' }}>
              {gear.effect || 'Sem efeito descrito.'}
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
            Visual da carta em desenvolvimento
          </div>
          <div className="font-mono text-[10px] px-4 text-center leading-relaxed" style={{ color: '#4a5e3a' }}>
            Em breve esta carta terá a mesma exibição visual das demais.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GearDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0d1208' }}><div className="font-mono text-xs animate-pulse" style={{ color: '#7a9a5a' }}>[ CARREGANDO... ]</div></div>}>
      <GearDetailContent />
    </Suspense>
  );
}
