'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useT } from '@/hooks/useT'
import LangSwitcher from '@/components/LangSwitcher'

export default function GamePage() {
  const router = useRouter()
  const t = useT()

  return (
    <div className="h-screen overflow-hidden flex flex-col scanline-bg" style={{ background: 'linear-gradient(160deg, #080c05 0%, #0d1208 40%, #0a0f06 100%)' }}>
      {/* Top bar */}
      <div className="shrink-0 border-b border-[#3a4a2a] px-8 py-2 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="font-mono text-xs text-[#4a5e3a] hover:text-[#7a9a5a] transition-colors tracking-widest uppercase">
            ← {t('game.back')}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <LangSwitcher />
          <span className="font-mono text-xs text-[#4a5e3a] tracking-widest">WARGAME-WEB // v1.0</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-8">
        <div className="max-w-3xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center gap-3 justify-center mb-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a84c]" />
              <span className="font-mono text-xs text-[#c9a84c] tracking-[0.3em] uppercase">{t('game.subtitle')}</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a84c]" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: '#e8d5a0', textShadow: '0 0 40px rgba(201,168,76,0.2), 0 2px 4px rgba(0,0,0,0.8)' }}>
              {t('game.title')}
            </h1>
            <p className="text-xs font-mono text-[#5a7a4a] tracking-widest uppercase">{t('game.selectMode')}</p>
          </div>

          {/* Mode cards */}
          <div className="grid grid-cols-2 gap-6">
            {/* Draft */}
            <Link href="/drafts" className="group block">
              <div className="corner-clip relative p-6 h-full transition-all duration-300 group-hover:translate-y-[-3px]"
                style={{
                  background: 'linear-gradient(135deg, #0d1208 0%, #141a0e 100%)',
                  border: '1px solid #3a4a2a',
                  boxShadow: 'inset 0 1px 0 rgba(180,150,60,0.1), 0 4px 24px rgba(0,0,0,0.6)',
                }}>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#c9a84c33] via-[#c9a84c] to-[#c9a84c33]" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="corner-clip-sm w-10 h-10 flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a' }}>
                    <svg className="w-5 h-5 text-[#7a9a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#c9a84c] tracking-widest uppercase leading-none mb-0.5">MODE 01</div>
                    <h2 className="text-lg font-bold text-[#e8d5a0] group-hover:text-[#c9a84c] transition-colors">{t('game.draft')}</h2>
                  </div>
                </div>
                <p className="text-xs text-[#6a7a5a] mb-5 leading-relaxed">{t('game.draftDesc')}</p>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#7a9a5a] group-hover:text-[#c9a84c] transition-colors">
                  <span className="tracking-widest uppercase">{t('common.access')}</span>
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Standard */}
            <Link href="/game/standard" className="group block">
              <div className="corner-clip relative p-6 h-full transition-all duration-300 group-hover:translate-y-[-3px]"
                style={{
                  background: 'linear-gradient(135deg, #0d1208 0%, #141a0e 100%)',
                  border: '1px solid #3a4a2a',
                  boxShadow: 'inset 0 1px 0 rgba(180,150,60,0.1), 0 4px 24px rgba(0,0,0,0.6)',
                }}>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#c9a84c33] via-[#c9a84c] to-[#c9a84c33]" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="corner-clip-sm w-10 h-10 flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a' }}>
                    <svg className="w-5 h-5 text-[#7a9a5a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#c9a84c] tracking-widest uppercase leading-none mb-0.5">MODE 02</div>
                    <h2 className="text-lg font-bold text-[#e8d5a0] group-hover:text-[#c9a84c] transition-colors">{t('game.standard')}</h2>
                  </div>
                </div>
                <p className="text-xs text-[#6a7a5a] mb-5 leading-relaxed">{t('game.standardDesc')}</p>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#7a9a5a] group-hover:text-[#c9a84c] transition-colors">
                  <span className="tracking-widest uppercase">{t('common.access')}</span>
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
