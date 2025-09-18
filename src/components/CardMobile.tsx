import { Card } from '@/lib/api'
import { useEffect, useRef, useState } from 'react'

interface CardMobileProps {
  selectedCard: Card
  isFlipped: boolean
  isSmallMobile: boolean
  getFactionLogo: (faction: string, version?: string) => string
}

export default function CardMobile({ selectedCard, isFlipped, isSmallMobile, getFactionLogo }: CardMobileProps) {
  const factionTextRef = useRef<HTMLHeadingElement>(null)
  const [useSmallerFont, setUseSmallerFont] = useState(false)
  const cardSize = isSmallMobile ? 'w-full max-w-sm' : 'w-full max-w-lg'
  const minHeight = isSmallMobile ? '200px' : '250px'
  const padding = isSmallMobile ? 'p-2' : 'p-4'
  const logoHeight = isSmallMobile ? 'h-[80%]' : 'h-[80%]'
  const textSize = isSmallMobile ? 'text-[12px]' : 'text-[17px]'
  const baseFontSize = isSmallMobile ? 'text-sm' : textSize
  const smallerFontSize = isSmallMobile ? 'text-xs' : 'text-sm'

  useEffect(() => {
    if (factionTextRef.current && isFlipped) {
      const textElement = factionTextRef.current
      const parentElement = textElement.parentElement
      
      if (parentElement) {
        // Reset to larger font first
        setUseSmallerFont(false)
        
        // Force a reflow
        setTimeout(() => {
          const textWidth = textElement.scrollWidth
          const parentWidth = parentElement.clientWidth
          
          if (textWidth > parentWidth) {
            setUseSmallerFont(true)
          }
        }, 10)
      }
    }
  }, [selectedCard.faction, isFlipped, isSmallMobile])

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
                src="/images/cards/faction-pride-front.png" 
                alt={`${selectedCard.name} - Frente`}
                className="w-full h-full object-contain rounded"
              />
              {/* Faction Logo Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <img 
                  key={`${selectedCard.id}-${selectedCard.faction}`}
                  src={`/images/factions/${getFactionLogo(selectedCard.faction, 'standard')}`}
                  alt={`${selectedCard.faction} Logo`}
                  className={`w-auto object-contain ${logoHeight}`}
                />
              </div>
              {/* Text Overlay - Left */}
              <div className="absolute pointer-events-none z-20" style={{
                top: isSmallMobile ? '8%' : '8%', 
                left: isSmallMobile ? '6.5%' : '6.5%', 
                width: isSmallMobile ? '35%' : '35%', 
                height: isSmallMobile ? '5%' : '5%'
              }}>
                <div className="w-full h-full flex items-center justify-start">
                  <h2 className={`font-ocr text-red-custom drop-shadow-custom font-bold uppercase ${textSize}`}>
                    FACTION PRIDE
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
                  <h2 className={`font-ocr text-red-custom drop-shadow-custom font-bold uppercase ${textSize}`}>
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
                src="/images/cards/faction-pride-back.png" 
                alt={`${selectedCard.faction} - Verso`}
                className="w-full h-full object-contain rounded"
              />
              {/* Faction Name Overlay - Top Left */}
              <div className="absolute pointer-events-none z-20" style={{
                top: isSmallMobile ? '8%' : '8%', 
                left: isSmallMobile ? '5%' : '5%', 
                width: isSmallMobile ? '70%' : '70%', 
                height: isSmallMobile ? '8%' : '8%'
              }}>
                <div className="w-full h-full flex items-center justify-start">
                  <h2 
                    ref={factionTextRef}
                    className={`font-ocr font-bold uppercase whitespace-nowrap overflow-hidden text-ellipsis ${useSmallerFont ? 'text-[14px]' : 'text-[18px]'}`}
                    style={{
                      color: '#FFFFFF',
                      textShadow: '1px 2px 2px rgba(0, 0, 0, 1)'
                    }}
                  >
                    {selectedCard.faction}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
