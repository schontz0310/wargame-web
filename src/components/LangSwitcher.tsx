'use client'

import { useLang } from '@/hooks/useLang'
import type { Lang } from '@/lib/translations'

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'pt', flag: '🇧🇷', label: 'PT' },
]

export default function LangSwitcher() {
  const { lang, setLang } = useLang()

  return (
    <div className="flex items-center gap-1">
      {LANGS.map(({ code, flag, label }) => {
        const active = lang === code
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            title={label}
            className="flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-[10px] corner-clip-sm transition-all"
            style={{
              background: active ? 'rgba(201,168,76,0.18)' : 'transparent',
              border: active ? '1px solid #c9a84c' : '1px solid transparent',
              color: active ? '#c9a84c' : '#4a5e3a',
              opacity: active ? 1 : 0.6,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{flag}</span>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
