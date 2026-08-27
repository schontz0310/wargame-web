'use client'

import { useLang } from './useLang'
import { translations, type TranslationKey } from '@/lib/translations'

function getByPath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : path
}

export function useT() {
  const { lang } = useLang()
  return function t(key: TranslationKey): string {
    const result = getByPath(translations[lang] as unknown as Record<string, unknown>, key)
    if (result === key) {
      return getByPath(translations.en as unknown as Record<string, unknown>, key)
    }
    return result
  }
}
