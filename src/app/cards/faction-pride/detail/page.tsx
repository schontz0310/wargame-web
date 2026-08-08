'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, IFactionPride, apiService } from '@/lib/api'
import CardDesktopFactionPride from '@/components/CardDesktopFactionPride'
import CardMobile from '@/components/CardMobile'

const getFactionLogo = (faction: string, version: string = 'standard'): string => {
  const baseName = faction.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${baseName}-${version}.png`;
};

function factionPrideToCard(fp: IFactionPride): Card {
  return {
    id: fp.id,
    name: fp.faction,
    type: 'F',
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
    cardModel: 'single',
    frontImage: '/images/cards/faction-pride-front.png',
    backImage: '/images/cards/faction-pride-back.png',
  };
}

function FactionPrideDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

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
    if (!id) { setLoading(false); return; }
    apiService.getFactionPrideById(id).then(fp => {
      setCard(fp ? factionPrideToCard(fp) : null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando carta...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-gray-600">Nenhuma carta encontrada</div>
        <button onClick={() => router.push('/cards/faction-pride')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Voltar para listagem
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex overflow-hidden ${isSmallMobile ? 'p-1' : 'p-2 md:p-4 lg:p-8'} ${isSmallMobile ? 'gap-1' : 'gap-2 md:gap-4 lg:gap-8'} ${isDesktop ? 'flex-row items-stretch' : 'flex-col'}`}
      style={{ backgroundColor: '#0d1208' }}
    >
      {/* Left Column - Card Details */}
      <div
        className={`grimdark-panel flex flex-col overflow-hidden ${isSmallMobile ? 'p-2' : 'p-3 md:p-4'} ${isDesktop ? 'w-[40%]' : 'w-full'}`}
      >
        {/* Back button */}
        <button
          onClick={() => router.push('/cards/faction-pride')}
          className="gold-accent flex items-center gap-2 text-sm mb-4 w-fit transition-opacity hover:opacity-75"
        >
          ← Voltar para listagem
        </button>

        {/* Card Header */}
        <div className="pb-3 mb-3 flex-shrink-0" style={{ borderBottom: '1px solid #4a5e35' }}>
          <div>
            <div className="flex flex-col justify-center space-y-1">
              <div
                className={`font-semibold ${isDesktop ? 'text-base' : 'text-sm'}`}
                style={{ color: '#e8d5a0' }}
              >
                {card.name}
              </div>
              <div
                className={`font-mono uppercase tracking-wider ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`}
                style={{ color: '#7a9a5a' }}
              >
                {card.typeName}
              </div>
              <div
                className={`font-mono ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`}
                style={{ color: '#6a7a5a' }}
              >
                #{card.collectionNumber}
              </div>
              <div
                className={`font-bold font-mono corner-clip-sm inline-block w-fit px-2 py-1 ${
                  isDesktop ? 'text-sm' : isSmallMobile ? 'text-[10px]' : 'text-xs'
                }`}
                style={{ background: '#1a2410', color: '#c9a84c', border: '1px solid #4a5e35' }}
              >
                {card.cost} ⚡
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div
            className={`rounded ${isDesktop ? 'p-2' : 'p-1'}`}
            style={{ background: '#111608', border: '1px solid #4a5e35' }}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div
                  className={`font-mono uppercase tracking-wider mb-0.5 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}
                  style={{ color: '#6a7a5a' }}
                >
                  Tipo
                </div>
                <div
                  className={`font-bold px-1 py-0.5 rounded ${isDesktop ? 'text-xs' : 'text-[10px]'}`}
                  style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}
                >
                  {card.typeName}
                </div>
              </div>
              <div>
                <div
                  className={`font-mono uppercase tracking-wider mb-0.5 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}
                  style={{ color: '#6a7a5a' }}
                >
                  Custo
                </div>
                <div
                  className={`font-bold px-1 py-0.5 rounded ${isDesktop ? 'text-xs' : 'text-[10px]'}`}
                  style={{ background: '#0d1208', color: '#c9a84c', border: '1px solid #3a4a2a' }}
                >
                  {card.cost} ⚡
                </div>
              </div>
              {card.alternativeCost && (
                <div>
                  <div
                    className={`font-mono uppercase tracking-wider mb-0.5 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}
                    style={{ color: '#6a7a5a' }}
                  >
                    Custo Alt.
                  </div>
                  <div
                    className={`font-bold px-1 py-0.5 rounded ${isDesktop ? 'text-xs' : 'text-[10px]'}`}
                    style={{ background: '#0d1208', color: '#c9a84c', border: '1px solid #3a4a2a' }}
                  >
                    {card.alternativeCost} ⚡
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="font-mono uppercase tracking-wider text-xs mb-0.5" style={{ color: '#6a7a5a' }}>Facção</div>
                <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>{card.faction}</div>
              </div>
              <div>
                <div className="font-mono uppercase tracking-wider text-xs mb-0.5" style={{ color: '#6a7a5a' }}>Expansão</div>
                <div className="font-bold text-xs px-1 py-0.5 rounded" style={{ background: '#0d1208', color: '#c8b97a', border: '1px solid #3a4a2a' }}>{card.expansion}</div>
              </div>
            </div>
          </div>

          <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
            <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>Descrição</div>
            <p className="text-xs leading-relaxed" style={{ color: '#c8b97a' }}>
              {card.description}
            </p>
          </div>

          {card.flavorText && (
            <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
              <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>Texto de Sabor</div>
              <p className="text-xs italic leading-relaxed" style={{ color: '#7a9a5a' }}>
                {card.flavorText}
              </p>
            </div>
          )}

          {card.backDescription && (
            <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
              <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>Descrição (Verso)</div>
              <p className="text-xs leading-relaxed" style={{ color: '#c8b97a' }}>
                {card.backDescription}
              </p>
            </div>
          )}

          {card.backFlavorText && (
            <div className="p-2 rounded" style={{ background: '#111608', border: '1px solid #4a5e35' }}>
              <div className="font-mono uppercase tracking-wider text-xs mb-1" style={{ color: '#6a7a5a' }}>Texto de Sabor (Verso)</div>
              <p className="text-xs italic leading-relaxed" style={{ color: '#7a9a5a' }}>
                {card.backFlavorText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Card Display */}
      <div className={`flex flex-col items-center justify-center ${isDesktop ? 'flex-1 overflow-hidden' : 'w-full min-h-[300px]'}`}>
        {/* Flip Button */}
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className={`font-medium font-mono uppercase tracking-wider transition-opacity hover:opacity-80 shadow-lg flex-shrink-0 mb-4 corner-clip-sm ${
            isDesktop ? 'px-6 py-3 text-base' : isSmallMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'
          }`}
          style={{ background: '#c9a84c', color: '#0d1208' }}
        >
          {isFlipped ? '↺ Ver Frente' : '↺ Ver Verso'}
        </button>

        <div className="w-full flex-1 flex items-center justify-center">
          {isDesktop ? (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default function FactionPrideDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-lg">Carregando...</div></div>}>
      <FactionPrideDetailContent />
    </Suspense>
  );
}
