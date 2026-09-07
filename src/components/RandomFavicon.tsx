'use client'

import { useEffect } from 'react'

// One "-standard" crest per faction — the clean full-color logos, excluding the
// "-black" outline variants and non-faction stray assets in the same folder.
const FACTION_ICONS = [
  'bannsons-raiders-standard.png',
  'clan-jade-falcon-standard.png',
  'clan-nova-cat-standard.png',
  'clan-wolf-standard.png',
  'dragons-fury-standard.png',
  'federated-suns-standard.png',
  'highlanders-standard.png',
  'house-davion-standard.png',
  'house-davion-swordsworn-standard.png',
  'house-kurita-standard.png',
  'house-liao-standard.png',
  'house-steiner-standard.png',
  'mercenary-standard.png',
  'rasalhague-dominion-standard.png',
  'republic-of-the-sphere-standard.png',
  'spirit-cats-standard.png',
  'steel-wolves-standard.png',
  'stormhammers-standard.png',
  'swordsworn-standard.png',
  'true-grit-standard.png',
]

export default function RandomFavicon() {
  useEffect(() => {
    const filename = FACTION_ICONS[Math.floor(Math.random() * FACTION_ICONS.length)]
    const href = `/images/factions/${filename}`

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/png'
    link.href = href
  }, [])

  return null
}
