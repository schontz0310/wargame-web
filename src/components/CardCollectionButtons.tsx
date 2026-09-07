'use client'

import { useState, useEffect } from 'react'
import { useClientOnlyStorage } from '@/lib/storage'
import { useT } from '@/hooks/useT'
import { addCardToCollection, getCardCounts, MyCard } from '@/lib/cardCollection'

interface CardCollectionButtonsProps {
  card: Omit<MyCard, 'quantity'>
  onChange?: () => void
}

export default function CardCollectionButtons({ card, onChange }: CardCollectionButtonsProps) {
  const t = useT()
  const { isClient } = useClientOnlyStorage()
  const [counts, setCounts] = useState({ haveCount: 0, wantCount: 0 })
  const [loading, setLoading] = useState<'have' | 'want' | null>(null)

  useEffect(() => {
    if (isClient) setCounts(getCardCounts(card.id))
  }, [isClient, card.id])

  const handleAdd = async (listType: 'have' | 'want') => {
    setLoading(listType)
    await new Promise(resolve => setTimeout(resolve, 150))
    addCardToCollection(card, listType)
    setCounts(getCardCounts(card.id))
    setLoading(null)
    onChange?.()
  }

  if (!isClient) return <div className="h-6" />

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => handleAdd('have')}
        disabled={loading === 'have'}
        className="text-[10px] font-mono px-1.5 py-0.5 transition-colors disabled:opacity-50"
        style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
        title={t('cardCollectionButtons.addHaveTitle')}
      >
        {t('cardCollectionButtons.have')}{counts.haveCount > 0 ? ` (${counts.haveCount})` : ''}
      </button>
      <button
        onClick={() => handleAdd('want')}
        disabled={loading === 'want'}
        className="text-[10px] font-mono px-1.5 py-0.5 transition-colors disabled:opacity-50"
        style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid #c9a84c44', color: '#c9a84c' }}
        title={t('cardCollectionButtons.addWantTitle')}
      >
        {t('cardCollectionButtons.want')}{counts.wantCount > 0 ? ` (${counts.wantCount})` : ''}
      </button>
    </div>
  )
}
