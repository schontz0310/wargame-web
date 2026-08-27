// src/components/game-mode/OrderTypeMenu.tsx
'use client'

import { useState } from 'react'
import { getEligibleOrderTypes, type OrderType } from '@/lib/gameMode'
import type { UnitOrderState } from '@/hooks/useGameSession'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/translations'

const ORDER_KEY_MAP: Record<OrderType, TranslationKey> = {
  move: 'orders.move',
  run: 'orders.run',
  ranged: 'orders.ranged',
  close: 'orders.close',
  assault: 'orders.assault',
  vent: 'orders.vent',
  charge: 'orders.charge',
  death_from_above: 'orders.dfa',
  ram: 'orders.ram',
  artillery: 'orders.artillery',
  board: 'orders.board',
  disembark: 'orders.disembark',
}

interface OrderTypeMenuProps {
  unitType: string
  hasArtillery: boolean
  cargoCapacity?: number
  hasPassengers?: boolean
  isPassenger?: boolean
  orderState: UnitOrderState
  markerCount: number
  interactive: boolean
  onSelect: (type: OrderType) => void
}

function MarkerDots({ count }: { count: number }) {
  return (
    <span className="font-mono text-base tracking-tight leading-none" style={{ color: count >= 2 ? '#c06060' : count === 1 ? '#c9a84c' : '#3a4a2a' }}>
      {count >= 2 ? '●●' : count === 1 ? '●○' : '○○'}
    </span>
  )
}

export default function OrderTypeMenu({ unitType, hasArtillery, cargoCapacity = 0, hasPassengers = false, isPassenger = false, orderState, markerCount, interactive, onSelect }: OrderTypeMenuProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const eligibleTypes = getEligibleOrderTypes(unitType, hasArtillery, cargoCapacity, hasPassengers)

  const isMech = unitType.toLowerCase() === 'mech'
  // Infantry/vehicles with 2 markers cannot receive orders this turn
  const isBlocked = !isMech && markerCount >= 2
  const isOrdered = orderState.status === 'ordered'

  // Units aboard a transport cannot receive orders
  if (isPassenger) {
    return (
      <span
        className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm flex-shrink-0"
        style={{ background: 'rgba(40,80,120,0.2)', border: '1px solid #3a6090', color: '#7aaad8' }}
        title={t('orderMenu.aboardTitle')}
      >
        {t('orderMenu.aboard')}
      </span>
    )
  }

  if (!interactive) {
    if (isBlocked) {
      return (
        <span
          className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm flex-shrink-0 flex items-center gap-1"
          style={{ background: 'rgba(150,50,50,0.2)', color: '#c06060' }}
        >
          <MarkerDots count={markerCount} />
        </span>
      )
    }
    if (isOrdered) {
      return (
        <span
          className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm flex-shrink-0 flex items-center gap-1"
          style={{ background: 'rgba(122,154,90,0.15)', color: '#7a9a5a' }}
        >
          <MarkerDots count={markerCount} />
          <span>{t(ORDER_KEY_MAP[orderState.orderType ?? 'move'])}</span>
        </span>
      )
    }
    if (markerCount > 0) {
      return <MarkerDots count={markerCount} />
    }
    return null
  }

  // interactive
  if (isBlocked) {
    return (
      <div className="flex items-center gap-1 flex-shrink-0">
        <MarkerDots count={markerCount} />
        <span
          className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm"
          style={{ background: 'rgba(150,50,50,0.15)', border: '1px solid #5a2a2a', color: '#c06060' }}
          title={t('orderMenu.blockedTitle')}
        >
          {t('orderMenu.blocked')}
        </span>
      </div>
    )
  }

  if (isOrdered) {
    return (
      <div className="flex items-center gap-1 flex-shrink-0">
        <MarkerDots count={markerCount} />
        <span
          className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm"
          style={{ background: 'rgba(122,154,90,0.15)', border: '1px solid #3a4a2a', color: '#7a9a5a' }}
        >
          {t(ORDER_KEY_MAP[orderState.orderType ?? 'move'])}
        </span>
      </div>
    )
  }

  return (
    <div className="relative flex-shrink-0 flex items-center gap-1">
      {markerCount > 0 && <MarkerDots count={markerCount} />}
      <button
        onClick={() => setOpen(v => !v)}
        className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 corner-clip-sm"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid #3a4a2a',
          color: '#5a7a4a',
        }}
      >
        {t('orderMenu.order')}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 corner-clip-sm overflow-hidden"
          style={{ background: '#111608', border: '1px solid #3a4a2a', minWidth: 170 }}
        >
          {eligibleTypes.map(type => (
            <button
              key={type}
              onClick={() => { onSelect(type); setOpen(false) }}
              className="w-full text-left px-2 py-1.5 font-mono text-[10px]"
              style={{ color: '#c9a84c' }}
            >
              {t(ORDER_KEY_MAP[type])}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
