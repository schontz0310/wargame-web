'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, IFactionPride, apiService } from '@/lib/api'
import CardDesktopFactionPride from '@/components/CardDesktopFactionPride'
import CardMobile from '@/components/CardMobile'
import Card3DViewer from '@/components/Card3DViewer'

const getFactionLogo = (faction: string, version: string = 'standard'): string => {
  const baseName = faction.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${baseName}-${version}.png`;
};

function factionPrideToCard(fp: IFactionPride): Card {
  return {
    id: fp.id,
    name: fp.faction,
    type: fp.type as Card['type'],
    typeName: 'Faction Pride',
    cost: fp.cost,
    alternativeCost: fp.alternativeCost ?? undefined,
    haveAlternativeCost: fp.haveAlternativeCost,
    haveLogo: fp.haveLogo,
    haveSeeText: fp.haveSeeText,
    faction: fp.faction,
    factionLogoVersion: fp.logoVariant as Card['factionLogoVersion'],
    rarity: 'Common',
    expansion: fp.expansion,
    collectionNumber: fp.collectionNumber,
    imageUrl: '',
    description: fp.description,
    flavorText: fp.flavorText ?? undefined,
    isUnique: false,
  };
}

function CardDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cardId = searchParams.get('id');

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1400 && width >= 550);
      setIsSmallMobile(width < 550);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!cardId) { setLoading(false); return; }
    apiService.getFactionPrideById(cardId).then(fp => {
      setCard(fp ? factionPrideToCard(fp) : null);
      setLoading(false);
    });
  }, [cardId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{background:'#0d1208'}}>
        <div className="font-mono text-xs animate-pulse" style={{color:'#7a9a5a'}}>[ CARREGANDO CARTA... ]</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{background:'#0d1208'}}>
        <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>// Nenhuma carta encontrada</div>
        <button onClick={() => router.push('/cards')} className="px-4 py-2 font-mono text-xs corner-clip-sm" style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>
          ← VOLTAR
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex overflow-hidden ${isSmallMobile ? 'p-1' : 'p-2 md:p-4 lg:p-8'} ${isSmallMobile ? 'gap-1' : 'gap-2 md:gap-4 lg:gap-8'} ${isDesktop ? 'flex-row items-stretch' : 'flex-col'}`}
      style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      {/* Left Column - Card Details */}
      <div className={`flex flex-col overflow-hidden ${isDesktop ? 'w-[40%]' : 'w-full'} ${isSmallMobile ? 'p-2' : 'p-3 md:p-4'}`}
        style={{background:'#111608',border:'1px solid #3a4a2a',boxShadow:'inset 0 1px 0 rgba(180,150,60,0.1),0 4px 20px rgba(0,0,0,0.6)'}}>
        {/* Back button */}
        <button
          onClick={() => router.push('/cards/faction-pride')}
          className="flex items-center gap-2 font-mono text-xs mb-4 w-fit transition-colors"
          style={{color:'#5a7a4a'}}
        >
          ← VOLTAR PARA LISTAGEM
        </button>

        {/* Card Header */}
        <div className="pb-3 mb-3 flex-shrink-0" style={{borderBottom:'1px solid #2a3a1a'}}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className={`flex items-center justify-center flex-shrink-0 p-2 corner-clip-sm ${
              isDesktop ? 'w-24 lg:w-32 h-24 md:h-28' : isSmallMobile ? 'w-12 h-12' : 'w-16 h-16'
            }`} style={{background:'rgba(122,154,90,0.1)',border:'1px solid #3a4a2a'}}>
              <div className="text-center">
                <div className={`mb-1 font-mono ${isDesktop ? 'text-2xl' : isSmallMobile ? 'text-sm' : 'text-lg'}`} style={{color:'#c9a84c'}}>🃏</div>
                <div className={`font-mono font-bold ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`} style={{color:'#7a9a5a'}}>{card.type}</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <div className={`font-bold font-mono ${isDesktop ? 'text-base' : 'text-sm'}`} style={{color:'#e8d5a0'}}>{card.name}</div>
              <div className={`font-mono ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`} style={{color:'#5a7a4a'}}>{card.typeName}</div>
              <div className={`font-mono ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`} style={{color:'#3a5a2a'}}>#{card.collectionNumber}</div>
              <div className={`font-bold font-mono px-2 py-1 inline-block w-fit corner-clip-sm ${
                isDesktop ? 'text-sm' : isSmallMobile ? 'text-[10px]' : 'text-xs'
              }`} style={{background:'rgba(201,168,76,0.15)',border:'1px solid #c9a84c',color:'#c9a84c'}}>
                {card.cost} ⚡
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className={`${isDesktop ? 'p-2' : 'p-1'}`} style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className={`font-mono ${isDesktop ? 'text-xs' : 'text-[10px]'}`} style={{color:'#4a5e3a'}}>TIPO</div>
                <div className={`font-bold font-mono px-1 py-0.5 ${isDesktop ? 'text-xs' : 'text-[10px]'}`} style={{color:'#7a9a5a'}}>{card.typeName}</div>
              </div>
              <div>
                <div className={`font-mono ${isDesktop ? 'text-xs' : 'text-[10px]'}`} style={{color:'#4a5e3a'}}>CUSTO</div>
                <div className={`font-bold font-mono px-1 py-0.5 ${isDesktop ? 'text-xs' : 'text-[10px]'}`} style={{color:'#c9a84c'}}>{card.cost} ⚡</div>
              </div>
              {card.alternativeCost && (
                <div>
                  <div className={`font-mono ${isDesktop ? 'text-xs' : 'text-[10px]'}`} style={{color:'#4a5e3a'}}>CUSTO ALT.</div>
                  <div className={`font-bold font-mono px-1 py-0.5 ${isDesktop ? 'text-xs' : 'text-[10px]'}`} style={{color:'#c9a84c'}}>{card.alternativeCost} ⚡</div>
                </div>
              )}
            </div>
          </div>

          <div className="p-2" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>FACÇÃO</div>
                <div className="font-bold font-mono text-xs" style={{color:'#e8d5a0'}}>{card.faction}</div>
              </div>
              <div>
                <div className="font-mono text-xs" style={{color:'#4a5e3a'}}>EXPANSÃO</div>
                <div className="font-bold font-mono text-xs" style={{color:'#7a9a5a'}}>{card.expansion}</div>
              </div>
            </div>
          </div>

          <div className="p-2" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
            <div className="font-mono text-xs mb-1" style={{color:'#4a5e3a'}}>DESCRIÇÃO</div>
            <p className="font-mono text-xs leading-relaxed" style={{color:'#7a9a5a'}}>
              {card.description}
            </p>
          </div>

          {card.flavorText && (
            <div className="p-2" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
              <div className="font-mono text-xs mb-1" style={{color:'#4a5e3a'}}>TEXTO DE SABOR</div>
              <p className="font-mono text-xs italic leading-relaxed" style={{color:'#5a7a4a'}}>
                {card.flavorText}
              </p>
            </div>
          )}

          {card.backDescription && (
            <div className="p-2" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
              <div className="font-mono text-xs mb-1" style={{color:'#4a5e3a'}}>DESCRIÇÃO (VERSO)</div>
              <p className="font-mono text-xs leading-relaxed" style={{color:'#7a9a5a'}}>
                {card.backDescription}
              </p>
            </div>
          )}

          {card.backFlavorText && (
            <div className="p-2" style={{background:'rgba(0,0,0,0.3)',border:'1px solid #2a3a1a'}}>
              <div className="font-mono text-xs mb-1" style={{color:'#4a5e3a'}}>TEXTO DE SABOR (VERSO)</div>
              <p className="font-mono text-xs italic leading-relaxed" style={{color:'#5a7a4a'}}>
                {card.backFlavorText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Card Display */}
      <div className={`flex flex-col items-center justify-center ${isDesktop ? 'flex-1 overflow-hidden' : 'w-full min-h-[300px]'}`}>
        {/* View Mode Toggle */}
        <div className="flex gap-2 flex-shrink-0 mb-4">
          <button
            onClick={() => setViewMode('2d')}
            className={`font-mono corner-clip-sm transition-colors ${isSmallMobile ? 'px-2 py-1 text-xs' : isDesktop ? 'px-6 py-2 text-xs' : 'px-4 py-2 text-xs'}`}
            style={{
              background: viewMode === '2d' ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.4)',
              border: viewMode === '2d' ? '1px solid #c9a84c' : '1px solid #3a4a2a',
              color: viewMode === '2d' ? '#c9a84c' : '#5a7a4a',
            }}
          >
            2D
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`font-mono corner-clip-sm transition-colors ${isSmallMobile ? 'px-2 py-1 text-xs' : isDesktop ? 'px-6 py-2 text-xs' : 'px-4 py-2 text-xs'}`}
            style={{
              background: viewMode === '3d' ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.4)',
              border: viewMode === '3d' ? '1px solid #c9a84c' : '1px solid #3a4a2a',
              color: viewMode === '3d' ? '#c9a84c' : '#5a7a4a',
            }}
          >
            3D
          </button>
        </div>

        {/* Flip Button - only show in 2D mode */}
        {viewMode === '2d' && (
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className={`font-mono corner-clip-sm transition-colors flex-shrink-0 mb-4 ${
              isDesktop ? 'px-6 py-2 text-xs' : isSmallMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-xs'
            }`}
            style={{background:'rgba(122,154,90,0.15)',border:'1px solid #3a4a2a',color:'#7a9a5a'}}
          >
            {isFlipped ? '↺ VER FRENTE' : '↺ VER VERSO'}
          </button>
        )}

        <div className="w-full flex-1 flex items-center justify-center">
          {viewMode === '2d' ? (
            isDesktop ? (
              <CardDesktopFactionPride
                selectedCard={card}
                isFlipped={isFlipped}
                getFactionLogo={getFactionLogo}
              />
            ) : (
              <CardMobile
                selectedCard={card}
                isFlipped={isFlipped}
                isSmallMobile={isSmallMobile}
                getFactionLogo={getFactionLogo}
              />
            )
          ) : (
            <Card3DViewer 
              card={card}
              className={isDesktop ? 'w-full h-full' : 'w-full h-80'}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CardDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen" style={{background:'#0d1208'}}><div className="font-mono text-xs animate-pulse" style={{color:'#7a9a5a'}}>[ CARREGANDO... ]</div></div>}>
      <CardDetailContent />
    </Suspense>
  );
}
