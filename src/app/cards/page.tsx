'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/lib/api'

// Faction logo mapping with version support
const getFactionLogo = (faction: string, version: string = 'standard'): string => {
  const factionMap: Record<string, string> = {
    'Federated Suns': 'federated-suns',
    'House Steiner': 'house-steiner',
  };

  const baseName = factionMap[faction] || 'federated-suns';
  const logoPath = `${baseName}-${version}.png`;
  console.log(`Getting faction logo for: ${faction} (${version}) -> ${logoPath}`);
  return logoPath;
};

// Mock data for Faction Pride cards
const mockFactionPrideCards: Card[] = [
  {
    id: '001',
    name: 'House Steiner Gray',
    type: 'F',
    typeName: 'Faction Pride',
    cost: '10/150',
    alternativeCost: '5/150',
    haveSeeText: true,
    faction: 'Rasalhague Dominion',
    factionLogoVersion: 'gray',
    rarity: 'Common',
    expansion: 'AOD',
    collectionNumber: '001',
    imageUrl: '/images/cards/aod-f-001-front.png',
    description: 'The Jade Falcons soar above all others, their pride unmatched in battle.',
    flavorText: '"We are the Jade Falcons, and we shall not be denied!" - Khan Marthe Pryde',
    keywords: ['Pride', 'Clan'],
    isUnique: false,
    effects: [{
      type: 'passive',
      description: 'Your Clan Jade Falcon units gain +1 attack when attacking.',
      target: 'faction_units'
    }],
    // Back side data
    backImageUrl: '/images/cards/aod-f-001-back.png',
    backDescription: 'A Casa Steiner representa força industrial e poder militar. Seus MechWarriors são conhecidos pela disciplina e pela tecnologia avançada.',
    backFlavorText: '"Ferro e honra, a tradição Steiner perdura através dos séculos." - Arquiduque Steiner',
    backKeywords: ['Industrial', 'Militar', 'Tecnologia'],
    backEffects: [{
      type: 'passive',
      description: 'Suas unidades House Steiner ganham +1 defesa quando defendendo.',
      target: 'faction_units'
    }]
  },
  {
    id: '002',
    name: 'Federated Suns',
    type: 'F',
    typeName: 'Faction Pride',
    cost: '8/120',
    alternativeCost: '4/120',
    haveSeeText: true,
    faction: 'Republic of the Sphere',
    factionLogoVersion: 'standard',
    rarity: 'Common',
    expansion: 'AOD',
    collectionNumber: '002',
    imageUrl: '/images/cards/aod-f-002-front.png',
    description: 'The Federated Suns stands as a beacon of honor and military excellence.',
    flavorText: '"For the glory of the Federated Suns!" - Prince Victor Steiner-Davion',
    keywords: ['Honor', 'Military'],
    isUnique: false,
    effects: [{
      type: 'active',
      description: 'Your Federated Suns units gain +2 attack this turn.',
      target: 'faction_units'
    }],
    backImageUrl: '/images/cards/aod-f-002-back.png',
    backDescription: 'Os Sóis Federados representam honra militar e excelência tática em combate.',
    backFlavorText: '"Pela glória dos Sóis Federados!" - Príncipe Victor Steiner-Davion',
    backKeywords: ['Honra', 'Militar', 'Tática'],
    backEffects: [{
      type: 'active',
      description: 'Suas unidades Federated Suns ganham +2 ataque neste turno.',
      target: 'faction_units'
    }]
  }
];

function CardsContent() {
  const searchParams = useSearchParams()
  const cardId = searchParams.get('cardId')
  const [selectedCard, setSelectedCard] = useState(() => {
    return cardId ? mockFactionPrideCards.find(card => card.id === cardId) || mockFactionPrideCards[0] : mockFactionPrideCards[0]
  })
  const [isFlipped, setIsFlipped] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1400 && window.innerWidth >= 550)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  if (!selectedCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-gray-600">Nenhuma carta selecionada</div>
        <div className="text-sm text-gray-500">Selecione uma carta para ver os detalhes</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex overflow-hidden p-2 md:p-4 lg:p-8 gap-2 md:gap-4 lg:gap-8 ${isDesktop ? 'flex-row' : 'flex-col'}`}>
      {/* Left Column - Card Details */}
      <div className={`bg-white shadow-lg p-3 md:p-4 flex flex-col overflow-hidden h-full ${isDesktop ? 'w-[40%]' : 'w-full'}`}>
        {/* Card Header - Fixed */}
        <div className="border-b pb-3 mb-3 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-3">
            <div className={`bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 p-2 border-2 border-blue-200 ${
              isDesktop ? 'w-24 lg:w-32 h-24 md:h-28' : 'w-16 h-16'
            }`}>
              <div className="text-center">
                <div className={`mb-1 ${isDesktop ? 'text-2xl' : 'text-lg'}`}>🃏</div>
                <div className={`font-bold text-blue-600 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>{selectedCard.type}</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <div className={`text-gray-600 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>{selectedCard.typeName}</div>
              <div className={`text-gray-600 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>#{selectedCard.collectionNumber}</div>
              <div className={`font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block w-fit ${
                isDesktop ? 'text-sm' : 'text-xs'
              }`}>
                {selectedCard.cost} ⚡
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {/* Basic Info */}
          <div className={`bg-gray-50 rounded-lg border ${isDesktop ? 'p-2' : 'p-1'}`}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className={`text-gray-500 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>Tipo</div>
                <div className={`font-bold bg-white px-1 py-0.5 rounded ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>{selectedCard.typeName}</div>
              </div>
              <div>
                <div className={`text-gray-500 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>Custo</div>
                <div className={`font-bold bg-white px-1 py-0.5 rounded ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>{selectedCard.cost} ⚡</div>
              </div>
            </div>
          </div>

          {/* Faction & Expansion */}
          <div className="bg-gray-50 p-2 rounded-lg border">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-gray-500 text-xs">Facção</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedCard.faction}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Expansão</div>
                <div className="font-bold text-xs bg-white px-1 py-0.5 rounded">{selectedCard.expansion}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 p-2 rounded-lg border">
            <div className="text-gray-500 text-xs mb-1">Descrição {isFlipped ? '(Verso)' : '(Frente)'}</div>
            <p className="text-gray-700 text-xs leading-relaxed">
              {isFlipped ? selectedCard.backDescription || selectedCard.description : selectedCard.description}
            </p>
          </div>
          {/* Flavor Text */}
          {(isFlipped ? selectedCard.backFlavorText : selectedCard.flavorText) && (
            <div className="bg-gray-50 p-2 rounded-lg border">
              <div className="text-gray-500 text-xs mb-1">Texto de Sabor {isFlipped ? '(Verso)' : '(Frente)'}</div>
              <p className="text-xs italic text-gray-600 leading-relaxed">
                {isFlipped ? selectedCard.backFlavorText : selectedCard.flavorText}
              </p>
            </div>
          )}
        </div>

        {/* Card Selection - Fixed at bottom */}
        <div className="bg-gray-50 p-2 rounded-lg border mt-3 flex-shrink-0">
          <div className="text-gray-500 text-xs mb-2">Selecionar Carta</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
            {mockFactionPrideCards.map(card => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`p-1 text-xs rounded border transition-colors ${
                  selectedCard.id === card.id
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {card.name.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Card Display */}
      <div className={`flex flex-col items-center justify-center overflow-hidden h-full ${isDesktop ? 'flex-1' : 'w-full'}`}>
        {/* Flip Button */}
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className={`bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg flex-shrink-0 mb-4 font-ocr ${
            isDesktop ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
          }`}
        >
          {isFlipped ? '🔄 Ver Frente' : '🔄 Ver Verso'}
        </button>

        {/* Card Container */}
        <div className="w-full perspective-1000 flex-1 flex items-center justify-center">
          <div 
            className={`transform-style-preserve-3d transition-transform duration-700 relative ${
              isFlipped ? 'rotate-y-180' : ''
            } ${isDesktop ? 'w-full max-w-3xl' : 'w-full max-w-lg'}`}
            style={{ aspectRatio: '10/7', minHeight: isDesktop ? '400px' : '250px' }}
          >
            {/* Front Face */}
            <div className="absolute inset-0 w-full h-full backface-hidden">
              <div className="bg-transparent rounded-lg p-4 h-full">
                <div className="w-full h-full rounded-lg overflow-hidden relative">
                  <img 
                    src="/images/cards/faction-pride-front.png" 
                    alt={`${selectedCard.name} - Frente`}
                    className="w-full h-full object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <div class="text-center">
                              <div class="text-6xl mb-4">🃏</div>
                              <div class="text-sm font-bold text-gray-600">${selectedCard.name}</div>
                              <div class="text-xs text-gray-500 mt-1">Frente</div>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />

                  {/* Faction Logo Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <img 
                      key={`${selectedCard.id}-${selectedCard.faction}-${selectedCard.factionLogoVersion}`}
                      src={`/images/factions/${getFactionLogo(selectedCard.faction, selectedCard.factionLogoVersion || 'standard')}`}
                      alt={`${selectedCard.faction} Logo`}
                      className="h-[80%] w-auto object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Text Overlay - Left */}
                  <div className="absolute pointer-events-none z-20" style={{top: isDesktop ? '8%' : '8%', left: isDesktop ? '6.5%' : '6.5%', width: isDesktop ? '40%' : '35%', height: isDesktop ? '6%' : '5%'}}>
                    <div className="w-full h-full flex items-center justify-start">
                      <h2 className={`font-ocr text-red-custom drop-shadow-custom font-bold ${isDesktop ? 'text-2xl' : 'text-[17px]'}`}>
                        FACTION PRIDE
                      </h2>
                    </div>
                  </div>

                  {/* Card Number Overlay - Right */}
                  <div className="absolute pointer-events-none z-20" style={{top: isDesktop ? '8%' : '8%', right: isDesktop ? '6.5%' : '6.5%', width: isDesktop ? '30%' : '35%', height: isDesktop ? '6%' : '5%'}}>
                    <div className="w-full h-full flex items-center justify-end">
                      <h2 className={`font-ocr text-red-custom drop-shadow-custom font-bold ${isDesktop ? 'text-2xl' : 'text-[17px]'}`}>
                        {`${selectedCard.type}-${selectedCard.collectionNumber}`}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Face */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
              <div className="bg-transparent rounded-lg p-4 h-full">
                <div className="w-full h-full rounded-lg overflow-hidden relative">
                  <img 
                    src="/images/cards/faction-pride-back.png" 
                    alt={`${selectedCard.name} - Verso`}
                    className="w-full h-full object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <div class="text-center">
                              <div class="text-6xl mb-4">🎴</div>
                              <div class="text-sm font-bold text-gray-600">BattleTech</div>
                              <div class="text-xs text-gray-500 mt-1">Faction Pride</div>
                              <div class="text-xs text-gray-400 mt-2">${selectedCard.expansion}</div>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                  
                  {/* Back Text Overlay - Top Left */}
                  <div className="absolute pointer-events-none z-20" style={{top: isDesktop ? '9%' : '8%', left: isDesktop ? '5%' : '5%', width: isDesktop ? '80%' : '80%', height: isDesktop ? '6%' : '5%'}}>
                    <div className="w-full h-full flex items-center justify-start">
                      <h2 className={`font-ocr text-white font-bold ${isDesktop ? 'text-4xl' : 'text-[18px]'}`} style={{
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8), 0 0 8px rgba(50, 49, 49, 0.2)'
                      }}>
                        {selectedCard.faction.toUpperCase()}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Cards() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CardsContent />
    </Suspense>
  )
}
