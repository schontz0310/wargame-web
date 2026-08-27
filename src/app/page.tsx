'use client'

import Link from "next/link";
import { useT } from "@/hooks/useT";
import LangSwitcher from "@/components/LangSwitcher";

export default function Home() {
  const t = useT()

  const cards = [
    {
      href: '/my-collection',
      mod: t('home.mod01'),
      title: t('home.myCollection'),
      desc: t('home.myCollectionDesc'),
      icon: (
        <svg className="w-5 h-5 text-[#7a9a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-1.586-1.586A2 2 0 0017 5H7a2 2 0 00-1.414.586L4 7m16 0v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0H4m4 0V4a1 1 0 011-1h6a1 1 0 011 1v3" />
        </svg>
      ),
    },
    {
      href: '/search',
      mod: t('home.mod02'),
      title: t('home.unitSearch'),
      desc: t('home.unitSearchDesc'),
      icon: (
        <svg className="w-5 h-5 text-[#7a9a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      href: '/unit-builder',
      mod: t('home.mod04'),
      title: t('home.unitBuilder'),
      desc: t('home.unitBuilderDesc'),
      icon: (
        <svg className="w-5 h-5 text-[#7a9a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      href: '/cards',
      mod: t('home.mod03'),
      title: t('home.cards'),
      desc: t('home.cardsDesc'),
      icon: (
        <svg className="w-5 h-5 text-[#7a9a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ]

  return (
    <div className="h-screen overflow-hidden flex flex-col scanline-bg" style={{ background: 'linear-gradient(160deg, #080c05 0%, #0d1208 40%, #0a0f06 100%)' }}>
      {/* Top bar */}
      <div className="shrink-0 border-b border-[#3a4a2a] px-8 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#7a9a5a] animate-pulse" />
          <span className="font-mono text-xs text-[#7a9a5a] tracking-widest uppercase">{t('home.systemOnline')}</span>
        </div>
        <div className="flex items-center gap-4">
          <LangSwitcher />
          <span className="font-mono text-xs text-[#4a5e3a] tracking-widest">WARGAME-WEB // v1.0</span>
        </div>
      </div>

      {/* Main content — vertically centered */}
      <div className="flex-1 flex flex-col justify-center px-8">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex items-center gap-3 justify-center mb-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a84c]" />
              <span className="font-mono text-xs text-[#c9a84c] tracking-[0.3em] uppercase">{t('home.centralCommand')}</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a84c]" />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: '#e8d5a0', textShadow: '0 0 40px rgba(201,168,76,0.2), 0 2px 4px rgba(0,0,0,0.8)' }}>
              WARGAME WEB
            </h1>
            <p className="text-xs font-mono text-[#5a7a4a] tracking-widest uppercase">
              {t('home.subtitle')}
            </p>
          </div>

          {/* Game featured card */}
          <Link href="/game" className="group block mb-3">
            <div className="corner-clip relative p-4 transition-all duration-300 group-hover:translate-y-[-2px]"
              style={{
                background: 'linear-gradient(135deg, #0f1a0a 0%, #1a2a0f 100%)',
                border: '1px solid #c9a84c55',
                boxShadow: 'inset 0 1px 0 rgba(201,168,76,0.15), 0 4px 20px rgba(0,0,0,0.6)',
              }}>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#c9a84c33] via-[#c9a84c] to-[#c9a84c33]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="corner-clip-sm w-9 h-9 flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid #c9a84c55' }}>
                    <svg className="w-5 h-5 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#c9a84c] tracking-widest uppercase leading-none mb-0.5">{t('home.mod05')}</div>
                    <h2 className="text-sm font-bold text-[#e8d5a0] group-hover:text-[#c9a84c] transition-colors leading-tight">{t('home.game')}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-[#7a9a5a] border border-[#3a4a2a] px-2 py-0.5 tracking-widest">DRAFT</span>
                  <span className="font-mono text-[10px] text-[#7a9a5a] border border-[#3a4a2a] px-2 py-0.5 tracking-widest">STANDARD</span>
                  <div className="flex items-center gap-1 text-xs font-mono text-[#7a9a5a] group-hover:text-[#c9a84c] transition-colors">
                    <span className="tracking-widest uppercase">{t('common.access')}</span>
                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#6a7a5a] mt-2 leading-relaxed">{t('home.gameDesc')}</p>
            </div>
          </Link>

          {/* Nav cards */}
          <div className="grid grid-cols-2 gap-3">
            {cards.map(({ href, mod, title, desc, icon }) => (
              <Link key={href} href={href} className="group block">
                <div className="corner-clip relative p-4 h-full transition-all duration-300 group-hover:translate-y-[-2px]"
                  style={{
                    background: 'linear-gradient(135deg, #0d1208 0%, #141a0e 100%)',
                    border: '1px solid #3a4a2a',
                    boxShadow: 'inset 0 1px 0 rgba(180,150,60,0.1), 0 4px 20px rgba(0,0,0,0.6)',
                  }}>
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#c9a84c33] via-[#c9a84c] to-[#c9a84c33]" />
                  <div className="flex items-center gap-3 mb-2">
                    <div className="corner-clip-sm w-8 h-8 flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a' }}>
                      {icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-[#c9a84c] tracking-widest uppercase leading-none mb-0.5">{mod}</div>
                      <h2 className="text-sm font-bold text-[#e8d5a0] group-hover:text-[#c9a84c] transition-colors leading-tight">
                        {title}
                      </h2>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6a7a5a] mb-2 leading-relaxed">
                    {desc}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#7a9a5a] group-hover:text-[#c9a84c] transition-colors">
                    <span className="tracking-widest uppercase">{t('common.access')}</span>
                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer bar */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-[#1e2a16]" />
            <span className="font-mono text-xs text-[#2a3a1a] tracking-widest">◆</span>
            <div className="h-px flex-1 bg-[#1e2a16]" />
          </div>
        </div>
      </div>
    </div>
  );
}
