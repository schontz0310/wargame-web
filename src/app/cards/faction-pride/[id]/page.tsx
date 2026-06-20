'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
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

function FactionPrideDetailContent({ id }: { id: string }) {
  const router = useRouter();

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
    <div className={`min-h-screen flex overflow-hidden ${isSmallMobile ? 'p-1' : 'p-2 md:p-4 lg:p-8'} ${isSmallMobile ? 'gap-1' : 'gap-2 md:gap-4 lg:gap-8'} ${isDesktop ? 'flex-row items-stretch' : 'flex-col'}`}>
      {/* Left Column - Card Details */}
      <div className={`bg-white shadow-lg ${isSmallMobile ? 'p-2' : 'p-3 md:p-4'} flex flex-col overflow-hidden ${isDesktop ? 'w-[40%]' : 'w-full'}`}>
        {/* Back button */}
        <button
          onClick={() => router.push('/cards/faction-pride')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-4 w-fit"
        >
          ← Voltar para listagem
        </button>

        {/* Card Header */}
        <div className="border-b pb-3 mb-3 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-3">
            <div className={`bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 p-2 border-2 border-blue-200 ${
              isDesktop ? 'w-24 lg:w-32 h-24 md:h-28' : isSmallMobile ? 'w-12 h-12' : 'w-16 h-16'
            }`}>
              <div className="text-center">
                <div className={`mb-1 ${isDesktop ? 'text-2xl' : isSmallMobile ? 'text-sm' : 'text-lg'}`}>🃏</div>
                <div className={`font-bold text-blue-600 ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`}>{card.type}</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <div className={`font-semibold text-gray-800 ${isDesktop ? 'text-base' : 'text-sm'}`}>{card.name}</div>
              <div className={`text-gray-600 ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`}>{card.typeName}</div>
              <div className={`text-gray-600 ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`}>#{card.collectionNumber}</div>
              <div className={`font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block w-fit ${
                isDesktop ? 'text-sm' : isSmallMobile ? 'text-[10px]' : 'text-xs'
              }`}>
                {card.cost} ⚡
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className={`bg-gray-50 rounded-lg border ${isDesktop ? 'p-2' : 'p-1'}`}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className={`text-gray-500 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>Tipo</div>
                <div className={`font-bold bg-white px-1 py-0.5 rounded ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>{card.typeName}</div>
              </div>
              <div>
                <div className={`text-gray-500 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>Custo</div>
                <div className={`font-bold bg-white px-1 py-0.5 rounded ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>{card.cost} ⚡</div>
              </div>
              {card.alternativeCost && (
                <div>
                  <div className={`text-gray-500 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>Custo Alt.</div>
                  <div className={`font-bold bg-white px-1 py-0.5 rounded ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>{card.alternativeCost} ⚡</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded-lg border">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-gray-500 text-xs">Facção</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{card.faction}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Expansão</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{card.expansion}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded-lg border">
            <div className="text-gray-500 text-xs mb-1">Descrição</div>
            <p className="text-gray-700 text-xs leading-relaxed">
              {card.description}
            </p>
          </div>

          {card.flavorText && (
            <div className="bg-gray-50 p-2 rounded-lg border">
              <div className="text-gray-500 text-xs mb-1">Texto de Sabor</div>
              <p className="text-xs italic text-gray-600 leading-relaxed">
                {card.flavorText}
              </p>
            </div>
          )}

          {card.backDescription && (
            <div className="bg-gray-50 p-2 rounded-lg border">
              <div className="text-gray-500 text-xs mb-1">Descrição (Verso)</div>
              <p className="text-gray-700 text-xs leading-relaxed">
                {card.backDescription}
              </p>
            </div>
          )}

          {card.backFlavorText && (
            <div className="bg-gray-50 p-2 rounded-lg border">
              <div className="text-gray-500 text-xs mb-1">Texto de Sabor (Verso)</div>
              <p className="text-xs italic text-gray-600 leading-relaxed">
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
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === '2d' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${isSmallMobile ? 'px-2 py-1 text-xs' : isDesktop ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'}`}
          >
            📄 2D
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === '3d' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${isSmallMobile ? 'px-2 py-1 text-xs' : isDesktop ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'}`}
          >
            🎮 3D
          </button>
        </div>

        {/* Flip Button - only show in 2D mode */}
        {viewMode === '2d' && (
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className={`bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg flex-shrink-0 mb-4 ${
              isDesktop ? 'px-6 py-3 text-base' : isSmallMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'
            }`}
          >
            {isFlipped ? '🔄 Ver Frente' : '🔄 Ver Verso'}
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

export default function FactionPrideDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-lg">Carregando...</div></div>}>
      <FactionPrideDetailContent id={params.id} />
    </Suspense>
  );
}
