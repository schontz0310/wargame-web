import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen scanline-bg" style={{ background: 'linear-gradient(160deg, #080c05 0%, #0d1208 40%, #0a0f06 100%)' }}>
      {/* Top bar */}
      <div className="border-b border-[#3a4a2a] px-8 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#7a9a5a] animate-pulse" />
          <span className="font-mono text-xs text-[#7a9a5a] tracking-widest uppercase">Sistema Online</span>
        </div>
        <span className="font-mono text-xs text-[#4a5e3a] tracking-widest">WARGAME-WEB // v1.0</span>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-3 justify-center mb-1">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a84c]" />
              <span className="font-mono text-xs text-[#c9a84c] tracking-[0.3em] uppercase">Comando Central</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a84c]" />
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3" style={{ color: '#e8d5a0', textShadow: '0 0 40px rgba(201,168,76,0.2), 0 2px 4px rgba(0,0,0,0.8)' }}>
            WARGAME WEB
          </h1>
          <p className="text-sm font-mono text-[#5a7a4a] tracking-widest uppercase">
            Gerenciamento Tático de Unidades
          </p>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Minha Coleção */}
          <Link href="/my-collection" className="group block">
            <div className="corner-clip relative p-6 transition-all duration-300 group-hover:translate-y-[-2px]"
              style={{
                background: 'linear-gradient(135deg, #0d1208 0%, #141a0e 100%)',
                border: '1px solid #3a4a2a',
                boxShadow: 'inset 0 1px 0 rgba(180,150,60,0.1), 0 4px 20px rgba(0,0,0,0.6)',
              }}>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#c9a84c33] via-[#c9a84c] to-[#c9a84c33]" />
              <div className="flex items-start gap-4 mb-4">
                <div className="corner-clip-sm w-12 h-12 flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a' }}>
                  <svg className="w-6 h-6 text-[#7a9a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-1.586-1.586A2 2 0 0017 5H7a2 2 0 00-1.414.586L4 7m16 0v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0H4m4 0V4a1 1 0 011-1h6a1 1 0 011 1v3" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-mono text-[#c9a84c] tracking-widest uppercase mb-1">Módulo 01</div>
                  <h2 className="text-lg font-bold text-[#e8d5a0] group-hover:text-[#c9a84c] transition-colors">
                    Minha Coleção
                  </h2>
                </div>
              </div>
              <p className="text-sm text-[#6a7a5a] mb-5 leading-relaxed">
                Gerencie sua coleção pessoal de unidades. Adicione e organize seu inventário de batalha.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-[#7a9a5a] group-hover:text-[#c9a84c] transition-colors">
                <span className="tracking-widest uppercase">Acessar</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Busca de Unidades */}
          <Link href="/search" className="group block">
            <div className="corner-clip relative p-6 transition-all duration-300 group-hover:translate-y-[-2px]"
              style={{
                background: 'linear-gradient(135deg, #0d1208 0%, #141a0e 100%)',
                border: '1px solid #3a4a2a',
                boxShadow: 'inset 0 1px 0 rgba(180,150,60,0.1), 0 4px 20px rgba(0,0,0,0.6)',
              }}>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#c9a84c33] via-[#c9a84c] to-[#c9a84c33]" />
              <div className="flex items-start gap-4 mb-4">
                <div className="corner-clip-sm w-12 h-12 flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a' }}>
                  <svg className="w-6 h-6 text-[#7a9a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-mono text-[#c9a84c] tracking-widest uppercase mb-1">Módulo 02</div>
                  <h2 className="text-lg font-bold text-[#e8d5a0] group-hover:text-[#c9a84c] transition-colors">
                    Busca de Unidades
                  </h2>
                </div>
              </div>
              <p className="text-sm text-[#6a7a5a] mb-5 leading-relaxed">
                Encontre unidades com filtros avançados por nome, tipo, facção, pontos e classe.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-[#7a9a5a] group-hover:text-[#c9a84c] transition-colors">
                <span className="tracking-widest uppercase">Acessar</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Cartas */}
          <Link href="/cards" className="group block">
            <div className="corner-clip relative p-6 transition-all duration-300 group-hover:translate-y-[-2px]"
              style={{
                background: 'linear-gradient(135deg, #0d1208 0%, #141a0e 100%)',
                border: '1px solid #3a4a2a',
                boxShadow: 'inset 0 1px 0 rgba(180,150,60,0.1), 0 4px 20px rgba(0,0,0,0.6)',
              }}>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#c9a84c33] via-[#c9a84c] to-[#c9a84c33]" />
              <div className="flex items-start gap-4 mb-4">
                <div className="corner-clip-sm w-12 h-12 flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a' }}>
                  <svg className="w-6 h-6 text-[#7a9a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-mono text-[#c9a84c] tracking-widest uppercase mb-1">Módulo 03</div>
                  <h2 className="text-lg font-bold text-[#e8d5a0] group-hover:text-[#c9a84c] transition-colors">
                    Cartas
                  </h2>
                </div>
              </div>
              <p className="text-sm text-[#6a7a5a] mb-5 leading-relaxed">
                Explore as cartas Faction Pride por facção, expansão e custo.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-[#7a9a5a] group-hover:text-[#c9a84c] transition-colors">
                <span className="tracking-widest uppercase">Acessar</span>
                <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer bar */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-[#1e2a16]" />
          <span className="font-mono text-xs text-[#2a3a1a] tracking-widest">◆</span>
          <div className="h-px flex-1 bg-[#1e2a16]" />
        </div>
      </div>
    </div>
  );
}
