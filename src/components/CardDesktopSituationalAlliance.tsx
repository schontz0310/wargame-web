import { Card } from '@/lib/api'

interface CardDesktopProps {
  selectedCard: Card
  isFlipped: boolean
  getFactionLogo: (faction: string, version?: string) => string
}

const KNOWN_FACTIONS: { name: string; file: string }[] = [
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
  { name: "Clan Wolf", file: "clan-wolf-black.png" },
  { name: "VTOL", file: "vtol.png" },
  { name: "vtol", file: "vtol.png" },
];

export default function CardDesktopSituationalAlliance({ selectedCard, isFlipped, getFactionLogo }: CardDesktopProps) {
  const factionLeft = selectedCard.factionLeft || selectedCard.faction;
  const factionRight = selectedCard.factionRight || selectedCard.faction;

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
                src={selectedCard.frontImage ?? "/images/cards/situational-alliance-front-double.png"}
                alt={`${selectedCard.name} - Frente`}
                className="w-full h-full object-contain rounded"
              />
              {/* Two Faction Logos */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute z-30" style={{top: '10%', left: '42%', height: '52%', width: 'auto'}}>
                  <img
                    key={`${selectedCard.id}-left-${factionLeft}`}
                    src={`/images/factions/${getFactionLogo(factionLeft, selectedCard.factionLeftLogoVersion || 'standard')}`}
                    alt={`${factionLeft} Logo`}
                    className="h-full w-auto object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <div className="absolute z-20" style={{bottom: '9%', right: '1%', height: '55%', width: 'auto'}}>
                  <img
                    key={`${selectedCard.id}-right-${factionRight}`}
                    src={`/images/factions/${getFactionLogo(factionRight, selectedCard.factionRightLogoVersion || 'standard')}`}
                    alt={`${factionRight} Logo`}
                    className="h-full w-auto object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              </div>
              {/* Text Overlay - Left */}
              <div className="absolute pointer-events-none z-20" style={{
                top: '8%', left: '6.5%', width: '40%', height: '6%'
              }}>
                <div className="w-full h-full flex items-center justify-start">
                  <h2 className="font-ocr text-red-custom drop-shadow-custom font-bold text-2xl">
                    {selectedCard.typeName.toUpperCase()}
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
                src={selectedCard.backImage ?? "/images/cards/situational-alliance-back.png"}
                alt={`${selectedCard.name} - Verso`}
                className="w-full h-full object-contain rounded"
              />
              {/* Faction Names Overlay - gray banner area */}
              <div className="absolute pointer-events-none z-20" style={{
                top: 'calc(8% - 5px)', left: 'calc(6.5% - 15px)', width: '88%', height: 'calc(12% - 10px)'
              }}>
                <div className="w-full h-full flex items-center justify-start">
                  <h2 className="font-ocr text-white drop-shadow-custom font-bold uppercase tracking-widest m-0" style={{fontSize:'26px'}}>
                    {factionLeft} — {factionRight}
                  </h2>
                </div>
              </div>
              {/* Square Box - expansion logo */}
              <div className="absolute pointer-events-none z-20" style={{
                top: 'calc(100% - 80px)', right: 'calc(6.5% - 15px + 100px)', height: '40px', aspectRatio: '1/1'
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
                    let fontSize = 24;
                    if (descLength > 400) fontSize = 18;
                    else if (descLength > 300) fontSize = 21;
                    else if (descLength > 200) fontSize = 23;
                    const escaped = KNOWN_FACTIONS.map(f => f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                    const paragraphs = selectedCard.description.split(/\\\\n|\\n|\n/).filter(p => p.trim() !== '');
                    return (
                      <p className="font-ocr text-gray-800 m-0" style={{lineHeight:'1.05', fontSize:`${fontSize}px`, letterSpacing:'0.04em'}}>
                        {paragraphs.map((para, pi) => {
                          const freshPattern = new RegExp(`(${escaped.join('|')})`, 'gi');
                          const parts = para.split(freshPattern).map((part, i) => {
                            const match = KNOWN_FACTIONS.find(f => new RegExp(`^${f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i').test(part));
                            if (match) {
                              return <img key={`${pi}-${i}`} src={`/images/factions/${match.file}`} alt={match.name} className="inline-block h-[1.25em] w-auto object-contain align-middle mx-0.5" />;
                            }
                            return part;
                          });
                          return <span key={pi}>{parts}{pi < paragraphs.length - 1 && <><br /><br /></>}</span>;
                        })}
                      </p>
                    );
                  })()}
                </div>
              </div>
              {/* Bottom Right Box of Description - flavor text */}
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
                </div>
              </div>
              {/* Right Box - card number */}
              <div className="absolute pointer-events-none z-20" style={{
                top: 'calc(100% - 80px)', right: 'calc(6.5% - 5px)', width: '90px', height: '40px'
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
