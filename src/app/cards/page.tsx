'use client'

import { useRouter } from 'next/navigation'

export default function CardsPage() {
  const router = useRouter();

  const cardTypes = [
    {
      id: 'faction-pride',
      label: 'FACTION PRIDE',
      description: 'Cartas de orgulho de facção que concedem bônus baseados na afiliação.',
      route: '/cards/faction-pride',
    },
    {
      id: 'mercenary-contract',
      label: 'MERCENARY CONTRACT',
      description: 'Contratos mercenários que permitem recrutar unidades de outras facções.',
      route: '/cards/mercenary-contract',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(160deg,#080c05 0%,#0d1208 60%,#0a0f06 100%)'}}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{background:'rgba(0,0,0,0.5)',borderBottom:'1px solid #3a4a2a'}}>
        <div>
          <h1 className="font-mono text-sm font-bold tracking-widest uppercase" style={{color:'#c9a84c'}}>
            MÓDULO — CARTAS
          </h1>
          <p className="font-mono text-xs mt-0.5" style={{color:'#4a5e3a'}}>
            Selecione o tipo de carta
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="font-mono text-xs px-3 py-1.5 transition-colors"
            style={{color:'#5a7a4a',border:'1px solid #2a3a1a',background:'rgba(0,0,0,0.3)'}}
          >
            ← INÍCIO
          </button>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#7a9a5a'}}></div>
            <span className="font-mono text-xs" style={{color:'#3a5a2a'}}>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Card type grid */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {cardTypes.map(ct => (
            <button
              key={ct.id}
              onClick={() => router.push(ct.route)}
              className="text-left p-6 transition-all duration-200"
              style={{
                background: 'rgba(122,154,90,0.06)',
                border: '1px solid #3a4a2a',
                clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(122,154,90,0.14)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(122,154,90,0.06)'; }}
            >
              <div className="font-mono text-xs tracking-widest mb-1" style={{color:'#4a5e3a'}}>
                // DISPONÍVEL
              </div>
              <div className="font-mono font-bold text-base mb-3" style={{color:'#c9a84c'}}>
                {ct.label}
              </div>
              <p className="font-mono text-xs leading-relaxed" style={{color:'#5a7a4a'}}>
                {ct.description}
              </p>
              <div className="mt-4 font-mono text-xs" style={{color:'#7a9a5a'}}>
                ACESSAR →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
