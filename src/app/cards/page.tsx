'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/lib/api'
import CardDesktop from '@/components/CardDesktop'
import CardMobile from '@/components/CardMobile'

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
    faction: 'House Steiner',
    expansion: 'AOD',
    collectionNumber: '001',
    description: 'A Casa Steiner representa força industrial e poder militar. Seus MechWarriors são conhecidos pela disciplina e pela tecnologia avançada.',
    flavorText: '"Ferro e honra, a tradição Steiner perdura através dos séculos." - Arquiduque Steiner',
    cost: '10/150',
    alternativeCost: '5/150',
    haveSeeText: true
  },
  {
    id: '002',
    name: 'Federated Suns',
    type: 'F',
    faction: 'Rassalhague Domion SA xxxxxxxxxxxxxxxxxxxxxxx',
    expansion: 'AOD',
    collectionNumber: '002',
    description: 'Os Sóis Federados representam honra militar e excelência tática em combate.',
    flavorText: '"Pela glória dos Sóis Federados!" - Príncipe Victor Steiner-Davion',
    cost: '8/120',
    alternativeCost: '4/120',
    haveSeeText: true
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
  const [isSmallMobile, setIsSmallMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsDesktop(width >= 1400 && width >= 550)
      setIsSmallMobile(width < 550)
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
    <div className={`min-h-screen flex overflow-hidden ${isSmallMobile ? 'p-1' : 'p-2 md:p-4 lg:p-8'} ${isSmallMobile ? 'gap-1' : 'gap-2 md:gap-4 lg:gap-8'} ${isDesktop ? 'flex-row' : 'flex-col'}`}>
      {/* Left Column - Card Details */}
      <div className={`bg-white shadow-lg ${isSmallMobile ? 'p-2' : 'p-3 md:p-4'} flex flex-col overflow-hidden h-full ${isDesktop ? 'w-[40%]' : 'w-full'}`}>
        {/* Card Header - Fixed */}
        <div className="border-b pb-3 mb-3 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-3">
            <div className={`bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 p-2 border-2 border-blue-200 ${
              isDesktop ? 'w-24 lg:w-32 h-24 md:h-28' : isSmallMobile ? 'w-12 h-12' : 'w-16 h-16'
            }`}>
              <div className="text-center">
                <div className={`mb-1 ${isDesktop ? 'text-2xl' : isSmallMobile ? 'text-sm' : 'text-lg'}`}>🃏</div>
                <div className={`font-bold text-blue-600 ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`}>{selectedCard.type}</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <div className={`text-gray-600 ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`}>Faction Pride</div>
              <div className={`text-gray-600 ${isDesktop ? 'text-xs' : isSmallMobile ? 'text-[8px]' : 'text-[10px]'}`}>#{selectedCard.collectionNumber}</div>
              <div className={`font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block w-fit ${
                isDesktop ? 'text-sm' : isSmallMobile ? 'text-[10px]' : 'text-xs'
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
                <div className={`font-bold bg-white px-1 py-0.5 rounded ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>Faction Pride</div>
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
            <div className="text-gray-500 text-xs mb-1">Descrição</div>
            <p className="text-gray-700 text-xs leading-relaxed">
              {selectedCard.description}
            </p>
          </div>
          {/* Flavor Text */}
          {selectedCard.flavorText && (
            <div className="bg-gray-50 p-2 rounded-lg border">
              <div className="text-gray-500 text-xs mb-1">Texto de Sabor</div>
              <p className="text-xs italic text-gray-600 leading-relaxed">
                {selectedCard.flavorText}
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
            isDesktop ? 'px-6 py-3 text-base' : isSmallMobile ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          {isFlipped ? '🔄 Ver Frente' : '🔄 Ver Verso'}
        </button>

        {/* Card Container */}
        <div className="w-full flex-1 flex items-center justify-center">
          {isDesktop ? (
            <CardDesktop 
              selectedCard={selectedCard}
              isFlipped={isFlipped}
              getFactionLogo={getFactionLogo}
            />
          ) : (
            <CardMobile 
              selectedCard={selectedCard}
              isFlipped={isFlipped}
              isSmallMobile={isSmallMobile}
              getFactionLogo={getFactionLogo}
            />
          )}
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
