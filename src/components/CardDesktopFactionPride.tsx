import { Card } from '@/lib/api'

interface CardDesktopFactionPrideProps {
  selectedCard: Card
  isFlipped: boolean
  getFactionLogo: (faction: string, version?: string) => string
}

export default function CardDesktopFactionPride({ selectedCard, isFlipped, getFactionLogo }: CardDesktopFactionPrideProps) {
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
                  <h2 className="font-ocr text-white drop-shadow-custom font-bold uppercase tracking-widest m-0" style={{fontSize:'32px'}}>
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
                <div className="w-full h-full flex items-start justify-start overflow-hidden px-2 pb-2" style={{paddingTop:'5px'}}>
                  {(() => {
                    const descLength = selectedCard.description?.length || 0;
                    let fontSize = 22 ;
                    if (descLength > 400) fontSize = 16;
                    else if (descLength > 300) fontSize = 18;
                     else if (descLength > 200) fontSize = 20;
                    return (
                      <p className="font-ocr text-gray-800 m-0" style={{lineHeight:'1.05', fontSize:`${fontSize}px`}}>
                    {(() => {
                      const knownFactions: { name: string; file: string }[] = [
                        { name: "Republic of the Sphere", file: "republic-of-the-sphere-black.png" },
                        { name: "Bannson's Raiders", file: "bannsons-raiders-black.png" },
                        { name: "Dragon's Fury", file: "dragons-fury-black.png" },
                        { name: "Highlanders", file: "highlanders-black.png" },
                        { name: "Clan Nova Cat", file: "clan-nova-cat-black.png" },
                        { name: "Clan Jade Falcon", file: "clan-jade-falcon-black.png" },
                        { name: "Jade Falcon", file: "clan-jade-falcon-black.png" },
                        { name: "House Kurita", file: "house-kurita-black.png" },
                        { name: "House Davion-Swordsworn", file: "house-davion-swordsworn-standard.png" },
                        { name: "House Davion", file: "house-davion-black.png" },
                        { name: "House Liao", file: "house-liao-black.png" },
                        { name: "House Steiner", file: "house-steiner-black.png" },
                        { name: "Spirit Cats", file: "spirit-cats-black.png" },
                        { name: "Spirit Cat", file: "spirit-cats-black.png" },
                        { name: "Steel Wolves", file: "steel-wolves-black.png" },
                        { name: "Stormhammers", file: "stormhammers-black.png" },
                        { name: "Stormhammer", file: "stormhammers-black.png" },
                        { name: "Rasalhague Dominion", file: "rasalhague-dominion-black.png" },
                        { name: "Swordsworn", file: "swordsworn-black.png" },
                        { name: "two chevrons", file: "two-chevrons-black.png" },
                        { name: "one chevron", file: "one-chevron-black.png" },
                        { name: "ballistic", file: "balistic.png" },
                        { name: "VTOL", file: "vtol.png" },
                        { name: "vtol", file: "vtol.png" },
                      ];
                      const escaped = knownFactions.map(f => f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

                      const paragraphs = selectedCard.description.split(/\\\\n|\\n|\n/).filter(p => p.trim() !== '');
                      return paragraphs.map((para, pi) => {
                        const freshPattern = new RegExp(`(${escaped.join('|')})`, 'gi');
                        const parts = para.split(freshPattern).map((part, i) => {
                          const match = knownFactions.find(f => new RegExp(`^${f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i').test(part));
                          if (match) {
                            return <img key={`${pi}-${i}`} src={`/images/factions/${match.file}`} alt={match.name} className="inline-block h-[1.25em] w-auto object-contain align-middle mx-0.5" />;
                          }
                          return part;
                        });
                        return <span key={pi}>{parts}{pi < paragraphs.length - 1 && <><br /><br /></>}</span>;
                      });
                    })()}
                      </p>
                    );
                  })()}
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
                top: 'calc(100% - 80px)', left: 'calc(8% - 15px)', width: '600px', height: '40px'
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
                    <span className="font-ocr text-gray-800 tracking-wider self-end mb-1" style={{fontSize:'18px'}}>(see text)</span>
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
