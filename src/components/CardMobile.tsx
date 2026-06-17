import { Card } from '@/lib/api'

interface CardMobileProps {
  selectedCard: Card
  isFlipped: boolean
  isSmallMobile: boolean
  getFactionLogo: (faction: string, version?: string) => string
}

export default function CardMobile({ selectedCard, isFlipped, isSmallMobile, getFactionLogo }: CardMobileProps) {
  const cardSize = isSmallMobile ? 'w-full max-w-sm' : 'w-full max-w-lg'
  const minHeight = isSmallMobile ? '200px' : '250px'
  const padding = isSmallMobile ? 'p-2' : 'p-4'
  const logoHeight = isSmallMobile ? 'h-[80%]' : 'h-[80%]'
  const textSize = isSmallMobile ? 'text-[12px]' : 'text-[17px]'

  return (
    <div className={cardSize} style={{ aspectRatio: '10/7', minHeight }}>
      <div className="relative w-full h-full">
        {/* Front Face */}
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
            isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className={`bg-transparent rounded-lg h-full ${padding}`}>
            <div className="w-full h-full rounded-lg overflow-hidden relative">
              <img 
                src={selectedCard.frontImage ?? "/images/cards/faction-pride-front.png"} 
                alt={`${selectedCard.name} - Frente`}
                className="w-full h-full object-contain rounded"
              />
              {/* Faction Logo Overlay */}
              {selectedCard.cardModel === 'single' ? (
                <div className="absolute inset-y-0 flex items-center justify-end pointer-events-none z-10" style={{left: 0, right: '-10px'}}>
                  <img 
                    key={`${selectedCard.id}-${selectedCard.faction}-${selectedCard.factionLogoVersion}`}
                    src={`/images/factions/${getFactionLogo(selectedCard.faction, selectedCard.factionLogoVersion || 'standard')}`}
                    alt={`${selectedCard.faction} Logo`}
                    className="w-auto object-contain h-[70%]"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <img 
                    key={`${selectedCard.id}-${selectedCard.faction}-${selectedCard.factionLogoVersion}`}
                    src={`/images/factions/${getFactionLogo(selectedCard.faction, selectedCard.factionLogoVersion || 'standard')}`}
                    alt={`${selectedCard.faction} Logo`}
                    className={`w-auto object-contain ${logoHeight}`}
                  />
                </div>
              )}
              {/* Text Overlay - Left */}
              <div className="absolute pointer-events-none z-20" style={{
                top: isSmallMobile ? '8%' : '8%', 
                left: isSmallMobile ? '6.5%' : '6.5%', 
                width: isSmallMobile ? '35%' : '35%', 
                height: isSmallMobile ? '5%' : '5%'
              }}>
                <div className="w-full h-full flex items-center justify-start">
                  <h2 className={`font-ocr text-red-custom drop-shadow-custom font-bold ${textSize}`}>
                    {selectedCard.typeName.toUpperCase()}
                  </h2>
                </div>
              </div>
              {/* Card Number Overlay - Right */}
              <div className="absolute pointer-events-none z-20" style={{
                top: isSmallMobile ? '8%' : '8%', 
                right: isSmallMobile ? '6.5%' : '6.5%', 
                width: isSmallMobile ? '30%' : '30%', 
                height: isSmallMobile ? '5%' : '5%'
              }}>
                <div className="w-full h-full flex items-center justify-end">
                  <h2 className={`font-ocr text-red-custom drop-shadow-custom font-bold ${textSize}`}>
                    {`${selectedCard.type}-${selectedCard.collectionNumber}`}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Back Face */}
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
            isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className={`bg-transparent rounded-lg h-full ${padding}`}>
            <div className="w-full h-full rounded-lg overflow-hidden relative">
              <img 
                src={selectedCard.backImage ?? "/images/cards/faction-pride-back.png"} 
                alt={`${selectedCard.name} - Verso`}
                className="w-full h-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
