'use client'

import { useColorMeanings } from '@/hooks/useColorMeanings'

export interface HeatDialRow {
  step: number
  primaryHeatValue: number
  secondaryHeatValue: number
  movementHeatValue: number
  primaryHeatColorMeaningId: string | null
  secondaryHeatColorMeaningId: string | null
  movementHeatColorMeaningId: string | null
}

interface Props {
  rows: HeatDialRow[]
  onChange: (rows: HeatDialRow[]) => void
}

export function HeatDialEditor({ rows, onChange }: Props) {
  const { colorMeanings } = useColorMeanings()
  const heatMeanings = colorMeanings.filter(c => c.usageType === 'equipment')

  function update(step: number, key: keyof HeatDialRow, value: unknown) {
    onChange(rows.map(r => r.step === step ? { ...r, [key]: value } : r))
  }

  function addStep() {
    if (rows.length >= 8) return
    onChange([...rows, {
      step: rows.length + 1,
      primaryHeatValue: 0,
      secondaryHeatValue: 0,
      movementHeatValue: 0,
      primaryHeatColorMeaningId: null,
      secondaryHeatColorMeaningId: null,
      movementHeatColorMeaningId: null,
    }])
  }

  function removeStep() {
    if (rows.length <= 1) return
    onChange(rows.slice(0, -1))
  }

  const thCls = 'px-3 py-2 text-left font-mono text-[10px] text-[#7a9a5a] tracking-wider uppercase border-r border-[#2a3a1a] last:border-r-0'
  const tdCls = 'px-2 py-1.5 border-r border-[#1a2a12] last:border-r-0'

  return (
    <div className="rounded border border-[#2a3a1a] overflow-hidden" style={{ background: 'rgba(8,12,5,0.9)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <span className="font-mono text-xs text-[#c9a84c] tracking-widest uppercase">
          Heat Dial — {rows.length} níveis de calor
        </span>
        <div className="flex gap-2">
          <button onClick={removeStep} className="font-mono text-xs px-2 py-0.5 rounded border border-[#3a4a2a] text-[#7a9a5a] hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
            − Nível
          </button>
          <button onClick={addStep} className="font-mono text-xs px-2 py-0.5 rounded border border-[#3a4a2a] text-[#7a9a5a] hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
            + Nível
          </button>
        </div>
      </div>

      {/* Helper */}
      <div className="px-4 py-2 border-b border-[#1a2a12]" style={{ background: 'rgba(0,0,0,0.15)' }}>
        <p className="font-mono text-[10px] text-[#4a5e3a] leading-relaxed">
          Cada nível representa um nível de aquecimento. Os valores negativos representam penalidades aplicadas aos stats quando o mech atinge aquele nível de calor.
          O último nível é o desligamento. O modificador de cor indica um equipamento especial que altera o comportamento do slot naquele nível.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#2a3a1a]" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <th className={thCls}>Nível</th>
              <th className={thCls}>Mod. Primário</th>
              <th className={thCls}>Equip. Primário</th>
              <th className={thCls}>Mod. Secundário</th>
              <th className={thCls}>Equip. Secundário</th>
              <th className={thCls}>Mod. Movimento</th>
              <th className={thCls}>Equip. Movimento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isShutdown = idx === rows.length - 1
              return (
                <tr
                  key={row.step}
                  className="border-b border-[#1a2a12] hover:bg-[#0d1208] transition-colors"
                  style={{
                    background: isShutdown
                      ? 'rgba(80,20,20,0.3)'
                      : idx % 2 === 0 ? 'rgba(13,18,8,0.5)' : 'rgba(8,12,5,0.5)',
                  }}
                >
                  {/* Step label */}
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold"
                        style={{
                          background: isShutdown ? '#cc220033' : '#c9a84c22',
                          border: `1px solid ${isShutdown ? '#cc2200' : '#c9a84c'}`,
                          color: isShutdown ? '#cc2200' : '#c9a84c',
                        }}
                      >
                        {row.step}
                      </span>
                      <span className="font-mono text-[10px] text-[#5a7a4a]">
                        {isShutdown ? '🔴 Desligado' : `Nível ${row.step}`}
                      </span>
                    </div>
                  </td>

                  {/* Primary heat modifier */}
                  <td className={tdCls}>
                    <div className="flex items-center gap-1">
                      <NumInput
                        value={row.primaryHeatValue}
                        onChange={v => update(row.step, 'primaryHeatValue', v)}
                        negative
                      />
                      <span className="font-mono text-[10px] text-[#4a5e3a]">atk</span>
                    </div>
                  </td>

                  {/* Primary equip */}
                  <td className={tdCls}>
                    <HeatEquipSelect
                      value={row.primaryHeatColorMeaningId}
                      onChange={v => update(row.step, 'primaryHeatColorMeaningId', v)}
                      options={heatMeanings.filter(m => ['ballistic','energetic'].includes(m.context))}
                    />
                  </td>

                  {/* Secondary heat modifier */}
                  <td className={tdCls}>
                    <div className="flex items-center gap-1">
                      <NumInput
                        value={row.secondaryHeatValue}
                        onChange={v => update(row.step, 'secondaryHeatValue', v)}
                        negative
                      />
                      <span className="font-mono text-[10px] text-[#4a5e3a]">atk</span>
                    </div>
                  </td>

                  {/* Secondary equip */}
                  <td className={tdCls}>
                    <HeatEquipSelect
                      value={row.secondaryHeatColorMeaningId}
                      onChange={v => update(row.step, 'secondaryHeatColorMeaningId', v)}
                      options={heatMeanings.filter(m => ['ballistic','energetic'].includes(m.context))}
                    />
                  </td>

                  {/* Movement heat modifier */}
                  <td className={tdCls}>
                    <div className="flex items-center gap-1">
                      <NumInput
                        value={row.movementHeatValue}
                        onChange={v => update(row.step, 'movementHeatValue', v)}
                        negative
                      />
                      <span className="font-mono text-[10px] text-[#4a5e3a]">mov</span>
                    </div>
                  </td>

                  {/* Movement equip */}
                  <td className={tdCls}>
                    <HeatEquipSelect
                      value={row.movementHeatColorMeaningId}
                      onChange={v => update(row.step, 'movementHeatColorMeaningId', v)}
                      options={heatMeanings.filter(m => m.context === 'movement')}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-4 py-2 border-t border-[#2a3a1a] flex gap-6" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <Stat label="Total mod. primário" value={rows.reduce((s, r) => s + r.primaryHeatValue, 0)} />
        <Stat label="Total mod. secundário" value={rows.reduce((s, r) => s + r.secondaryHeatValue, 0)} />
        <Stat label="Total mod. movimento" value={rows.reduce((s, r) => s + r.movementHeatValue, 0)} />
      </div>
    </div>
  )
}

function NumInput({ value, onChange, negative = false }: { value: number; onChange: (v: number) => void; negative?: boolean }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(+e.target.value)}
      min={negative ? -20 : 0}
      max={20}
      className="w-14 bg-transparent border border-[#2a3a1a] rounded text-center font-mono text-xs focus:outline-none focus:border-[#c9a84c] py-0.5"
      style={{ color: value < 0 ? '#cc2200' : value > 0 ? '#7a9a5a' : '#5a7a4a' }}
    />
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-[#4a5e3a] uppercase tracking-widest">{label}:</span>
      <span className="font-mono text-xs font-bold" style={{ color: value < 0 ? '#cc2200' : '#7a9a5a' }}>
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  )
}

function HeatEquipSelect({
  value,
  onChange,
  options,
}: {
  value: string | null
  onChange: (v: string | null) => void
  options: ReturnType<typeof useColorMeanings>['colorMeanings']
}) {
  const COLOR_HEX: Record<string, string> = {
    Black: '#111111', Red: '#cc2200', Blue: '#00aacc',
    Purple: '#9900aa', Gray: '#888888', Green: '#339900', Yellow: '#ccaa00',
  }
  const selected = options.find(o => o.id === value)
  const hex = selected ? COLOR_HEX[selected.color.name] ?? '#ffffff' : undefined

  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      className="max-w-[130px] bg-transparent font-mono text-[10px] outline-none cursor-pointer"
      style={{ color: hex ?? '#3a4a2a' }}
      title={selected?.meaning ?? 'Sem modificador'}
    >
      <option value="" style={{ color: '#3a4a2a', background: '#0d1208' }}>—</option>
      {options.map(o => (
        <option
          key={o.id}
          value={o.id}
          style={{ color: COLOR_HEX[o.color.name] ?? '#fff', background: '#0d1208' }}
          title={o.description}
        >
          [{o.color.name[0]}] {o.meaning.split(' ')[0]}
        </option>
      ))}
    </select>
  )
}
