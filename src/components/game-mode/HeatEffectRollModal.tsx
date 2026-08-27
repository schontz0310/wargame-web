'use client'

import { useState } from 'react'
import type { ColorMeaning } from '@/lib/api'
import { useT } from '@/hooks/useT'

export interface HeatEffectItem {
  slot: 'primary' | 'secondary' | 'movement'
  meaning: ColorMeaning
}

interface HeatEffectRollModalProps {
  unitName: string
  effects: HeatEffectItem[]
  onClose: () => void
}

const GREEN_HEX = '#009000'
const BLACK_HEX = '#000000'
const RED_HEX = '#FF0000'

function isAutomatic(hex: string) { return hex === BLACK_HEX }
function failThreshold(hex: string) { return hex === RED_HEX ? 3 : 2 }

export default function HeatEffectRollModal({ unitName, effects, onClose }: HeatEffectRollModalProps) {
  const t = useT()
  const [rolls, setRolls] = useState<Record<number, number>>({})

  const SLOT_LABELS: Record<HeatEffectItem['slot'], string> = {
    primary: t('heatModal.slotPrimary'),
    secondary: t('heatModal.slotSecondary'),
    movement: t('heatModal.slotMovement'),
  }

  const rollDie = (idx: number) => {
    setRolls(prev => ({ ...prev, [idx]: Math.floor(Math.random() * 6) + 1 }))
  }

  const allResolved = effects.every((e, i) =>
    isAutomatic(e.meaning.color.hexCode) || rolls[i] !== undefined
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)' }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{ background: '#111608', border: '1px solid #c9a84c', width: 480, maxHeight: '85vh' }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ borderBottom: '1px solid #2a3a1a', background: 'rgba(201,168,76,0.06)' }}
        >
          <span className="text-lg">⚠</span>
          <div>
            <div className="font-mono text-sm font-bold" style={{ color: '#c9a84c' }}>
              {t('heatModal.title')}
            </div>
            <div className="font-mono text-xs" style={{ color: '#5a7a4a' }}>{unitName}</div>
          </div>
        </div>

        {/* Effects */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {effects.map((effect, idx) => {
            const hex = effect.meaning.color.hexCode
            const auto = isAutomatic(hex)
            const threshold = failThreshold(hex)
            const rolled = rolls[idx]
            const failed = rolled !== undefined && rolled <= threshold

            const borderColor = hex === BLACK_HEX ? '#3a3a3a' : hex === RED_HEX ? '#7a2020' : '#7a6820'
            const badgeBg = hex === BLACK_HEX
              ? 'rgba(60,60,60,0.5)'
              : hex === RED_HEX ? 'rgba(150,30,30,0.35)' : 'rgba(150,130,30,0.35)'
            const badgeColor = hex === BLACK_HEX ? '#9090a0' : hex === RED_HEX ? '#e07070' : '#d4b840'

            return (
              <div
                key={idx}
                className="p-3"
                style={{ border: `1px solid ${borderColor}`, background: 'rgba(0,0,0,0.25)' }}
              >
                {/* Slot label + color dot + badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: hex, border: '1px solid rgba(255,255,255,0.15)' }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#5a7a4a' }}>
                    {SLOT_LABELS[effect.slot]}
                  </span>
                  <span
                    className="ml-auto font-mono text-[9px] px-2 py-0.5"
                    style={{ background: badgeBg, color: badgeColor }}
                  >
                    {auto ? t('heatModal.automatic') : `${t('heatModal.failThreshold')}${threshold}`}
                  </span>
                </div>

                {/* Effect name */}
                <div className="font-mono text-xs font-bold mb-1" style={{ color: '#e8d5a0' }}>
                  {effect.meaning.meaning}
                </div>

                {/* Description */}
                <div
                  className="font-mono text-[11px] leading-relaxed whitespace-pre-line"
                  style={{ color: '#a0a090' }}
                >
                  {effect.meaning.description}
                </div>

                {/* Roll area — only for non-automatic effects */}
                {!auto && (
                  <div className="flex items-center gap-3 mt-3">
                    {rolled === undefined ? (
                      <button
                        onClick={() => rollDie(idx)}
                        className="px-5 py-1.5 font-mono text-xs"
                        style={{ background: 'rgba(201,168,76,0.18)', border: '1px solid #c9a84c', color: '#c9a84c' }}
                      >
                        {t('heatModal.roll')}
                      </button>
                    ) : (
                      <>
                        <div
                          className="flex items-center justify-center font-mono text-2xl font-bold w-10 h-10 flex-shrink-0"
                          style={{
                            background: failed ? 'rgba(140,30,30,0.35)' : 'rgba(30,100,30,0.35)',
                            border: `1px solid ${failed ? '#8a2020' : '#2a6a2a'}`,
                            color: failed ? '#e07070' : '#7ad47a',
                          }}
                        >
                          {rolled}
                        </div>
                        <div className="font-mono text-xs" style={{ color: failed ? '#e07070' : '#7ad47a' }}>
                          {failed ? t('heatModal.applied') : t('heatModal.avoided')}
                        </div>
                        <button
                          onClick={() => rollDie(idx)}
                          className="ml-auto font-mono text-[10px] px-2 py-1"
                          style={{ border: '1px solid #2a3a1a', color: '#4a5e3a' }}
                        >
                          {t('heatModal.rollAgain')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex justify-end" style={{ borderTop: '1px solid #2a3a1a' }}>
          <button
            onClick={onClose}
            disabled={!allResolved}
            className="px-6 py-2 font-mono text-xs disabled:opacity-30"
            style={{ background: 'rgba(122,154,90,0.2)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export { GREEN_HEX }
