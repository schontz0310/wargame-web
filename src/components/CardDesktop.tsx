import { Card } from '@/lib/api'
import { useEffect, useRef, useState } from 'react'

interface CardDesktopProps {
  selectedCard: Card
  isFlipped: boolean
  getFactionLogo: (faction: string, version?: string) => string
}

export default function CardDesktop({ selectedCard, isFlipped, getFactionLogo }: CardDesktopProps) {
  const factionTextRef = useRef<HTMLHeadingElement>(null)
  const [useSmallerFont, setUseSmallerFont] = useState(false)

  useEffect(() => {
    if (factionTextRef.current && isFlipped) {
      const textElement = factionTextRef.current
      const parentElement = textElement.parentElement
      
      if (parentElement) {
        // Reset to larger font first
        setUseSmallerFont(false)
        
        // Force a reflow and check if text overflows
        setTimeout(() => {
          const textWidth = textElement.scrollWidth
          const parentWidth = parentElement.clientWidth
          
          if (textWidth > parentWidth) {
            setUseSmallerFont(true)
          }
        }, 10)
      }
    }
  }, [selectedCard.faction, isFlipped])
  return (
    <div className="w-full max-w-3xl perspective-1000" style={{ aspectRatio: '10/7', minHeight: '400px' }}>
      <div 
        className={`transform-style-preserve-3d transition-transform duration-700 relative ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Front Face */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="bg-transparent rounded-lg h-full p-4">
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
                  className="w-auto object-contain h-[80%]"
                />
              </div>
              {/* Text Overlay - Left */}
              <div className="absolute pointer-events-none z-20" style={{
                top: '8%', left: '6.5%', width: '40%', height: '6%'
              }}>
                <div className="w-full h-full flex items-center justify-start">
                  <h2 className="font-ocr text-red-custom drop-shadow-custom font-bold text-2xl uppercase">
                    FACTION PRIDE
                  </h2>
                </div>
              </div>
              {/* Card Number Overlay - Right */}
              <div className="absolute pointer-events-none z-20" style={{
                top: '8%', right: '6.5%', width: '30%', height: '6%'
              }}>
                <div className="w-full h-full flex items-center justify-end">
                  <h2 className="font-ocr text-red-custom drop-shadow-custom font-bold text-2xl uppercase">
                    {`${selectedCard.type}-${selectedCard.collectionNumber}`}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Back Face */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="bg-transparent rounded-lg h-full p-4">
            <div className="w-full h-full rounded-lg overflow-hidden relative">
              <img 
                src="/images/cards/faction-pride-back.png" 
                alt={`${selectedCard.faction} - Verso`}
                className="w-full h-full object-contain rounded"
              />
              {/* Faction Name Overlay - Top Left */}
              <div className="absolute pointer-events-none z-20" style={{
                top: '8%', left: '4.5%', width: '70%', height: '8%'
              }}>
                <div className="w-full h-full flex items-center justify-start">
                  <h2 
                    ref={factionTextRef}
                    className={`font-ocr font-bold uppercase whitespace-nowrap overflow-hidden text-ellipsis ${useSmallerFont ? 'text-2xl' : 'text-4xl'}`}
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
