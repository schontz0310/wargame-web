'use client'

import { createContext, useContext, useState, useEffect, createElement, type ReactNode } from 'react'
import { safeLocalStorage } from '@/lib/storage'
import type { Lang } from '@/lib/translations'

const STORAGE_KEY = 'app_lang'

function detectBrowserLang(): Lang {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('pt')) return 'pt'
  if (lang.startsWith('es')) return 'es'
  return 'en'
}

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LangContext = createContext<LangContextValue>({ lang: 'en', setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const stored = safeLocalStorage.getItem(STORAGE_KEY) as Lang | null
    if (stored === 'en' || stored === 'es' || stored === 'pt') {
      setLangState(stored)
    } else {
      setLangState(detectBrowserLang())
    }
  }, [])

  const setLang = (next: Lang) => {
    setLangState(next)
    safeLocalStorage.setItem(STORAGE_KEY, next)
  }

  return createElement(LangContext.Provider, { value: { lang, setLang } }, children)
}

export function useLang() {
  return useContext(LangContext)
}
