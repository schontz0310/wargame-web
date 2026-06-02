import { Card } from '@/lib/api'

interface CardDesktopProps {
  selectedCard: Card
  isFlipped: boolean
  getFactionLogo: (faction: string, version?: string) => string
}

export default function CardDesktop({ selectedCard, isFlipped, getFactionLogo }: CardDesktopProps) {
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
                  key={`${selectedCard.id}-${selectedCard.faction}-${selectedCard.factionLogoVersion}`}
                  src={`/images/factions/${getFactionLogo(selectedCard.faction, selectedCard.factionLogoVersion || 'standard')}`}
                  alt={`${selectedCard.faction} Logo`}
                  className="w-auto object-contain h-[90%]"
                />
              </div>
              {/* Text Overlay - Left */}
              <div className="absolute pointer-events-none z-20" style={{
                top: '8%', left: '6.5%', width: '40%', height: '6%'
              }}>
                <div className="w-full h-full flex items-center justify-start">
                  <h2 className="font-ocr text-red-custom drop-shadow-custom font-bold text-2xl">
                    FACTION PRIDE
                  </h2>
                </div>
              </div>
              {/* Card Number Overlay - Right */}
              <div className="absolute pointer-events-none z-20" style={{
                top: '8%', right: '6.5%', width: '30%', height: '6%'
              }}>
                <div className="w-full h-full flex items-center justify-end">
                  <h2 className="font-ocr text-red-custom drop-shadow-custom font-bold text-2xl">
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
                alt={`${selectedCard.name} - Verso`}
                className="w-full h-full object-contain rounded"
              />
              {/* Faction Name Overlay - gray banner area */}
              <div className="absolute pointer-events-none z-20" style={{
                top: 'calc(8% - 5px)', left: 'calc(6.5% - 15px)', width: '73.5%', height: 'calc(12% - 10px)'
              }}>
                <div className="w-full h-full flex items-center justify-start">
                  <h2 className="font-ocr text-white drop-shadow-custom font-bold text-4xl uppercase tracking-widest m-0">
                    {selectedCard.faction}
                  </h2>
                </div>
              </div>
              {/* Square Box - left of right box */}
              <div className="absolute pointer-events-none z-20" style={{
                top: 'calc(8% + 0px)', right: 'calc(6.5% - 15px + 90px)', height: 'calc(12% - 10px)', aspectRatio: '1/1'
              }}>
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={`/images/expansions/${selectedCard.expansion.toLowerCase()}-black.png`}
                    alt={`${selectedCard.expansion} logo`}
                    className="w-[80%] h-[80%] object-contain"
                  />
                </div>
              </div>
              {/* Description Overlay - white square area */}
              <div className="absolute pointer-events-none z-20" style={{
                top: 'calc(22% + 27px)', left: 'calc(8% - 15px)', right: 'calc(8% - 10px)', bottom: 'calc(32% - 40px)'
              }}>
                <div className="w-full h-full flex items-start justify-start overflow-hidden pt-0 px-2 pb-2">
                  <p className="font-ocr text-gray-800 text-2xl leading-tight m-0">
                    {selectedCard.description.split(new RegExp(`(${selectedCard.faction})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === selectedCard.faction.toLowerCase()
                        ? <img key={i} src={`/images/factions/${getFactionLogo(selectedCard.faction, 'black')}`} alt={selectedCard.faction} className="inline-block h-[1.5em] w-auto object-contain align-middle mx-0.5" />
                        : part
                    )}
                  </p>
                </div>
              </div>
              {/* Bottom Right Box of Description */}
              <div className="absolute pointer-events-none z-20" style={{
                bottom: 'calc(32% - 78px)', right: 'calc(8% - 15px)', width: '450px', height: '60px'
              }}>
                <div className="w-full h-full flex items-center px-2">
                  {selectedCard.flavorText && (
                    <p className="font-ocr text-gray-800 text-base italic leading-tight m-0 overflow-hidden text-right w-full">
                      {selectedCard.flavorText}
                    </p>
                  )}
                </div>
              </div>
              {/* Cost Box - bottom left */}
              <div className="absolute pointer-events-none z-20" style={{
                top: 'calc(100% - 80px)', left: 'calc(8% - 15px)', width: '480px', height: '40px'
              }}>
                <div className="w-full h-full flex items-center justify-start px-2 gap-2">
                  <span className="font-ocr text-gray-800 font-bold tracking-wider text-3xl">COST: {selectedCard.cost}</span>
                  {selectedCard.haveAlternativeCost && selectedCard.alternativeCost && (
                    <>
                      <span className="inline-flex items-center justify-center rounded-full bg-black text-white font-ocr font-bold text-sm w-6 h-6 flex-shrink-0">OR</span>
                      <span className="font-ocr text-gray-800 font-bold tracking-wider text-3xl">{selectedCard.alternativeCost}</span>
                    </>
                  )}
                  {selectedCard.haveLogo && (
                    <img
                      src={`/images/factions/${getFactionLogo(selectedCard.faction, 'black')}`}
                      alt={selectedCard.faction}
                      className="h-[2em] w-auto object-contain"
                    />
                  )}
                  {selectedCard.haveSeeText && (
                    <span className="font-ocr text-gray-800 italic tracking-wider text-3xl">(see text)</span>
                  )}
                </div>
              </div>
              {/* Right Box */}
              <div className="absolute pointer-events-none z-20" style={{
                top: 'calc(8% + 0px)', right: 'calc(6.5% - 15px)', width: '90px', height: 'calc(12% - 10px)'
              }}>
                <div className="w-full h-full flex items-center justify-center">
                  <h2 className="font-ocr text-red-custom drop-shadow-custom font-bold text-2xl m-0">
                    {`${selectedCard.type}-${selectedCard.collectionNumber}`}
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
