// src/components/game-mode/OrderTypeMenu.tsx
'use client'

import { useState } from 'react'
import { ORDER_TYPES, ORDER_TYPE_LABELS, DISABLED_ORDER_TYPES, type OrderType } from '@/lib/gameMode'
import type { UnitOrderState } from '@/hooks/useGameSession'

interface OrderTypeMenuProps {
  orderState: UnitOrderState
  interactive: boolean
  onSelect: (type: OrderType) => void
}

export default function OrderTypeMenu({ orderState, interactive, onSelect }: OrderTypeMenuProps) {
  const [open, setOpen] = useState(false)

  if (!interactive) {
    if (orderState.status === 'none') return null
    return (
      <span
        className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm flex-shrink-0"
        style={{
          background: orderState.status === 'pushed' ? 'rgba(150,50,50,0.2)' : 'rgba(122,154,90,0.15)',
          color: orderState.status === 'pushed' ? '#c06060' : '#7a9a5a',
        }}
      >
        {orderState.status === 'pushed' ? 'EMPURRADA' : ORDER_TYPE_LABELS[orderState.orderType ?? 'move']}
      </span>
    )
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm"
        style={{
          background: orderState.status === 'pushed' ? 'rgba(150,50,50,0.2)' : orderState.status === 'ordered' ? 'rgba(122,154,90,0.15)' : 'rgba(0,0,0,0.3)',
          border: '1px solid #3a4a2a',
          color: orderState.status === 'pushed' ? '#c06060' : orderState.status === 'ordered' ? '#7a9a5a' : '#5a7a4a',
        }}
      >
        {orderState.status === 'none' ? 'ORDEM' : orderState.status === 'pushed' ? 'EMPURRADA' : ORDER_TYPE_LABELS[orderState.orderType ?? 'move']}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 corner-clip-sm overflow-hidden" style={{ background: '#111608', border: '1px solid #3a4a2a', minWidth: 150 }}>
          {ORDER_TYPES.map(type => {
            const isDisabled = DISABLED_ORDER_TYPES.includes(type)
            return (
              <button
                key={type}
                disabled={isDisabled}
                onClick={() => { onSelect(type); setOpen(false) }}
                className="w-full text-left px-2 py-1.5 font-mono text-[10px] disabled:opacity-30"
                style={{ color: '#c9a84c' }}
              >
                {ORDER_TYPE_LABELS[type]}{isDisabled ? ' (em breve)' : ''}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
